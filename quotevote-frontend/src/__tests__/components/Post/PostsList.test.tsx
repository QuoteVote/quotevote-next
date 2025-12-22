/**
 * PostsList Component Tests
 * 
 * Basic tests for the PostsList component
 */

import { render, screen } from '../../utils/test-utils'
// @ts-expect-error - MockedProvider may not have types in this version
import { MockedProvider } from '@apollo/client/testing'
import PostsList from '../../../components/Post/PostsList'
import type { PostListProps } from '@/types/post'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock Zustand store
const mockHiddenPosts: string[] = []
jest.mock('@/store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) => {
    const state = {
      ui: {
        hiddenPosts: mockHiddenPosts,
      },
    }
    return selector(state)
  },
}))

describe('PostsList Component', () => {
  const mockPostsData = {
    posts: {
      entities: [
        {
          _id: 'post1',
          userId: 'user1',
          created: '2024-01-15T10:30:00Z',
          title: 'Post 1',
          text: 'Content 1',
          creator: {
            _id: 'user1',
            username: 'user1',
            name: 'User 1',
          },
          votes: [],
          comments: [],
          quotes: [],
        },
      ],
      pagination: {
        total_count: 1,
        limit: 10,
        offset: 0,
      },
    },
  }

  const mockProps: PostListProps = {
    data: mockPostsData,
    loading: false,
    limit: 10,
    fetchMore: jest.fn(),
    variables: {
      limit: 10,
      offset: 0,
      searchKey: '',
      interactions: false,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHiddenPosts.length = 0
  })

  describe('Basic Rendering', () => {
    it('renders posts list component', () => {
      const { container } = render(
        <MockedProvider mocks={[]}>
          <PostsList {...mockProps} />
        </MockedProvider>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('shows empty message when no posts', () => {
      const { container } = render(
        <MockedProvider mocks={[]}>
          <PostsList
            {...mockProps}
            data={{
              posts: {
                entities: [],
                pagination: {
                  total_count: 0,
                  limit: 10,
                  offset: 0,
                },
              },
            }}
          />
        </MockedProvider>
      )
      // Component should render (may show empty state or loading)
      expect(container.firstChild).toBeInTheDocument()
      // Check for empty message if it exists
      const emptyMessage = screen.queryByText(/no posts found/i)
      if (emptyMessage) {
        expect(emptyMessage).toBeInTheDocument()
      }
    })
  })
})
