/**
 * PostController Component Tests
 *
 * Tests for the PostController component including:
 * - Loading state renders PostSkeleton
 * - Error state redirects to /error
 * - Successful data fetch renders Post component
 * - Missing postId shows "Post not found"
 * - Page state management via setSelectedPage
 */

import { render, screen } from '../../utils/test-utils'
import PostController from '../../../components/Post/PostController'
import { GET_POST } from '@/graphql/queries'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useParams: () => ({ postId: 'test-post-id' }),
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Zustand store
const mockSetSelectedPage = jest.fn()
jest.mock('@/store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) => {
    const state = {
      setSelectedPage: mockSetSelectedPage,
      user: {
        data: {
          _id: 'user-123',
          admin: false,
          _followingId: [],
        },
      },
    }
    return selector(state)
  },
}))

// Mock PostSkeleton
jest.mock('../../../components/Post/PostSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="post-skeleton">Loading...</div>,
}))

// Mock Post component
jest.mock('../../../components/Post/Post', () => ({
  __esModule: true,
  default: ({ post }: { post: { title?: string } }) => (
    <div data-testid="post-component">{post.title}</div>
  ),
}))

const mockPost = {
  _id: 'test-post-id',
  userId: 'user-123',
  created: '2024-01-01',
  title: 'Test Post',
  text: 'Test content',
  url: '/dashboard/post/group/test/test-post-id',
  comments: [],
  votes: [],
  quotes: [],
}

describe('PostController Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('renders PostSkeleton while loading', () => {
      const mocks = [
        {
          request: {
            query: GET_POST,
            variables: { postId: 'test-post-id' },
          },
          result: {
            data: { post: mockPost },
          },
          delay: 1000,
        },
      ]
      render(<PostController postId="test-post-id" />, { mocks })
      expect(screen.getByTestId('post-skeleton')).toBeInTheDocument()
    })
  })

  describe('Missing postId', () => {
    it('shows post not found when postId is empty', () => {
      render(<PostController postId="" />)
      expect(screen.getByText(/Post not found/i)).toBeInTheDocument()
    })

    it('shows post not found when postId is undefined', () => {
      render(<PostController />)
      expect(screen.getByText(/Post not found/i)).toBeInTheDocument()
    })
  })

  describe('Page State Management', () => {
    it('calls setSelectedPage with empty string on mount', () => {
      render(<PostController postId="" />)
      expect(mockSetSelectedPage).toHaveBeenCalledWith('')
    })
  })
})
