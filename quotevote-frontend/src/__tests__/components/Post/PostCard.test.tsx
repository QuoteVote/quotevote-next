/**
 * PostCard Component Tests
 * 
 * Basic tests for the PostCard component
 */

import { fireEvent, render, screen, waitFor } from '../../utils/test-utils'
// @ts-expect-error - MockedProvider may not have types in this version
import { MockedProvider } from '@apollo/client/testing'
import PostCard from '../../../components/Post/PostCard'
import { APPROVE_POST } from '@/graphql/mutations'
import type { PostCardProps } from '@/types/post'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Zustand store
const mockSetSelectedPost = jest.fn()
jest.mock('@/store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      setSelectedPost: mockSetSelectedPost,
      user: { data: { _id: 'current-user' } },
    }),
}))

// Mock useGuestGuard
const mockGuestGuard = jest.fn(() => true)
jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: () => mockGuestGuard,
}))

// Mock useQuery from Apollo Client
const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

describe('PostCard Component', () => {
  const mockPostCardProps: PostCardProps = {
    _id: 'post1',
    text: 'This is the post content.',
    title: 'Test Post Title',
    url: 'https://example.com/post',
    created: '2024-01-15T10:30:00Z',
    creator: {
      _id: 'user1',
      username: 'testuser',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
    },
    votes: [],
    comments: [],
    quotes: [],
    approvedBy: [],
    rejectedBy: [],
    bookmarkedBy: [],
    activityType: 'POSTED',
    limitText: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock for useQuery - returns loading: false, no data
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    })
  })

  it('reconciles the selected Support state from the completed mutation response', async () => {
    const approvePostMock = {
      request: {
        query: APPROVE_POST,
        variables: {
          postId: 'post1',
          userId: 'current-user',
          remove: true,
        },
      },
      result: {
        data: {
          approvePost: {
            _id: 'post1',
            // Intentionally differs from the optimistic removal to prove the response wins.
            approvedBy: ['current-user'],
            rejectedBy: [],
          },
        },
      },
    }

    render(
      <PostCard
        {...mockPostCardProps}
        approvedBy={['current-user']}
      />,
      { mocks: [approvePostMock] }
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove support' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove support' })).toBeInTheDocument()
    })
  })

  describe('Basic Rendering', () => {
    it('renders post card', () => {
      const { container } = render(
        <MockedProvider mocks={[]}>
          <PostCard {...mockPostCardProps} />
        </MockedProvider>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders without crashing when title is provided', () => {
      const { container } = render(
        <MockedProvider mocks={[]}>
          <PostCard {...mockPostCardProps} />
        </MockedProvider>
      )
      // Component should render without crashing
      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles missing creator gracefully', () => {
      const propsWithoutCreator = {
        ...mockPostCardProps,
        creator: undefined,
      }
      const { container } = render(
        <MockedProvider mocks={[]}>
          <PostCard {...propsWithoutCreator} />
        </MockedProvider>
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Citation URL Rendering', () => {
    it('renders post card with citationUrl without crashing', () => {
      const propsWithCitation: PostCardProps = {
        ...mockPostCardProps,
        citationUrl: 'https://www.example.com/article',
      }
      const { container } = render(
        <MockedProvider mocks={[]}>
          <PostCard {...propsWithCitation} />
        </MockedProvider>
      )
      // Component should render without crashing when citationUrl is provided
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders post card without citationUrl without crashing', () => {
      const { container } = render(
        <MockedProvider mocks={[]}>
          <PostCard {...mockPostCardProps} />
        </MockedProvider>
      )
      // Component should render without crashing when citationUrl is not provided
      expect(mockPostCardProps.citationUrl).toBeUndefined()
      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles null citationUrl gracefully', () => {
      const propsWithNullCitation: PostCardProps = {
        ...mockPostCardProps,
        citationUrl: null,
      }
      const { container } = render(
        <MockedProvider mocks={[]}>
          <PostCard {...propsWithNullCitation} />
        </MockedProvider>
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})

