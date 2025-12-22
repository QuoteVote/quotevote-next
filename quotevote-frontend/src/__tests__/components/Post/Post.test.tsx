/**
 * Post Component Tests
 * 
 * Basic tests for the Post component
 */

import { render } from '../../utils/test-utils'
// @ts-expect-error - MockedProvider may not have types in this version
import { MockedProvider } from '@apollo/client/testing'
import Post from '../../../components/Post/Post'
import type { PostProps } from '@/types/post'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Zustand store
const mockSetSnackbar = jest.fn()
jest.mock('@/store', () => ({
  useAppStore: () => ({
    setSnackbar: mockSetSnackbar,
  }),
}))

// Mock useGuestGuard
const mockGuestGuard = jest.fn(() => true)
jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: () => mockGuestGuard,
}))

// Mock useQuery and useMutation from Apollo Client
const mockUseQuery = jest.fn()
const mockUseMutation = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

describe('Post Component', () => {
  const mockPost = {
    _id: 'post1',
    userId: 'user1',
    created: '2024-01-15T10:30:00Z',
    title: 'Test Post',
    text: 'This is a test post content.',
    url: 'https://example.com',
    enable_voting: true,
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
    reportedBy: [],
  }

  const mockUser = {
    _id: 'current-user',
    admin: false,
    _followingId: [],
  }

  const mockProps: PostProps = {
    post: mockPost,
    user: mockUser,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mocks
    mockUseQuery.mockReturnValue({
      data: { users: [] },
      loading: false,
      error: undefined,
    })
    mockUseMutation.mockReturnValue([
      jest.fn(),
      { loading: false, error: undefined },
    ])
  })

  describe('Basic Rendering', () => {
    it('renders post component', () => {
      const { container } = render(
        <MockedProvider mocks={[]}>
          <Post {...mockProps} />
        </MockedProvider>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders without crashing when title is provided', () => {
      const { container } = render(
        <MockedProvider mocks={[]}>
          <Post {...mockProps} />
        </MockedProvider>
      )
      // Component should render without crashing
      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles missing creator gracefully', () => {
      const postWithoutCreator = {
        ...mockPost,
        creator: undefined,
      }
      const { container } = render(
        <MockedProvider mocks={[]}>
          <Post {...mockProps} post={postWithoutCreator} />
        </MockedProvider>
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})
