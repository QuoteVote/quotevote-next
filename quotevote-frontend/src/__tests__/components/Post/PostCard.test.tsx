/**
 * PostCard Component Tests
 * 
 * Basic tests for the PostCard component
 */

import { render } from '../../utils/test-utils'
// @ts-expect-error - MockedProvider may not have types in this version
import { MockedProvider } from '@apollo/client/testing'
import PostCard from '../../../components/Post/PostCard'
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
  useAppStore: () => ({
    setSelectedPost: mockSetSelectedPost,
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
})
