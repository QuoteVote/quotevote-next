/**
 * Post Component Tests
 *
 * Covers the Post detail shell, including the interaction-count indicator
 * shown next to the bookmark button in the sticky action bar.
 *
 * Note: `useQuery`/`useMutation` are mocked directly, so no Apollo provider
 * is needed. (Apollo Client 4 no longer exports `MockedProvider` from
 * `@apollo/client/testing`.)
 */

import { render, within } from '../../utils/test-utils'
import Post from '../../../components/Post/Post'
import type { PostProps } from '@/types/post'

// Mock useRouter
const mockPush = jest.fn()
const mockBack = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
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

// Stub heavy child components so the Post shell renders in jsdom
jest.mock('@/components/VotingComponents/VotingBoard', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <div data-testid="voting-board">{content}</div>,
}))
jest.mock('@/components/VotingComponents/VotingPopup', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/DisplayAvatar', () => ({
  DisplayAvatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-seed={username ?? ''} />
  ),
}))
jest.mock('../../../components/CustomButtons/FollowButton', () => ({
  FollowButton: () => <button type="button">Follow</button>,
}))
jest.mock('../../../components/CustomButtons/BookmarkIconButton', () => ({
  BookmarkIconButton: () => (
    <button type="button" aria-label="Bookmark">
      Bookmark
    </button>
  ),
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
    it('renders the post title and action toolbar', () => {
      const { getByRole } = render(<Post {...mockProps} />)
      expect(getByRole('heading', { name: 'Test Post' })).toBeInTheDocument()
      expect(getByRole('toolbar', { name: 'Post actions' })).toBeInTheDocument()
    })

    it('handles missing creator gracefully', () => {
      const postWithoutCreator = {
        ...mockPost,
        creator: undefined,
      }
      const { getByRole } = render(
        <Post {...mockProps} post={postWithoutCreator} />
      )
      expect(getByRole('toolbar', { name: 'Post actions' })).toBeInTheDocument()
    })
  })

  describe('Default avatar seed', () => {
    it('seeds the default avatar with the display name (matches profile/chat)', () => {
      const { getByTestId } = render(<Post {...mockProps} />)
      expect(getByTestId('avatar')).toHaveAttribute('data-seed', 'Test User')
    })

    it('falls back to the username when the creator has no name', () => {
      const post = { ...mockPost, creator: { ...mockPost.creator, name: undefined } }
      const { getByTestId } = render(<Post {...mockProps} post={post} />)
      expect(getByTestId('avatar')).toHaveAttribute('data-seed', 'testuser')
    })
  })

  describe('Interaction count indicator', () => {
    it('shows the interaction count in the action bar next to the bookmark', () => {
      const postWithInteractions = {
        ...mockPost,
        votes: [{ _id: 'v1' }, { _id: 'v2' }],
        comments: [{ _id: 'c1', created: '2024-01-15T11:00:00Z', userId: 'user2' }],
        quotes: [{ _id: 'q1' }],
      }
      const { getByRole } = render(
        <Post {...mockProps} post={postWithInteractions} />
      )
      // votes(2) + comments(1) + quotes(1) = 4
      const toolbar = getByRole('toolbar', { name: 'Post actions' })
      const indicator = within(toolbar).getByLabelText('4 interactions')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveTextContent('4')
      // The bookmark button lives in the same toolbar, immediately before it
      expect(within(toolbar).getByLabelText('Bookmark')).toBeInTheDocument()
    })

    it('pluralizes correctly for a single interaction', () => {
      const postWithOneInteraction = {
        ...mockPost,
        comments: [{ _id: 'c1', created: '2024-01-15T11:00:00Z', userId: 'user2' }],
      }
      const { getByRole } = render(
        <Post {...mockProps} post={postWithOneInteraction} />
      )
      const toolbar = getByRole('toolbar', { name: 'Post actions' })
      expect(within(toolbar).getByLabelText('1 interaction')).toBeInTheDocument()
    })

    it('shows zero interactions when the post has none', () => {
      const { getByRole } = render(<Post {...mockProps} />)
      const toolbar = getByRole('toolbar', { name: 'Post actions' })
      expect(within(toolbar).getByLabelText('0 interactions')).toHaveTextContent('0')
    })
  })

  describe('Vote count indicator', () => {
    it('shows the support / disagree counts in the action bar next to the bookmark', () => {
      const postWithVotes = {
        ...mockPost,
        approvedBy: ['a1', 'a2', 'a3'],
        rejectedBy: ['r1'],
      }
      const { getByRole } = render(<Post {...mockProps} post={postWithVotes} />)
      const toolbar = getByRole('toolbar', { name: 'Post actions' })
      const indicator = within(toolbar).getByLabelText('3 support, 1 disagree')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveTextContent('3')
      expect(indicator).toHaveTextContent('1')
      // Lives in the same toolbar as the bookmark button
      expect(within(toolbar).getByLabelText('Bookmark')).toBeInTheDocument()
    })

    it('defaults to 0 / 0 when there are no votes', () => {
      const { getByRole } = render(<Post {...mockProps} />)
      const toolbar = getByRole('toolbar', { name: 'Post actions' })
      expect(within(toolbar).getByLabelText('0 support, 0 disagree')).toBeInTheDocument()
    })
  })

  it('no longer renders a separate bottom stats bar', () => {
    const { queryByText } = render(<Post {...mockProps} />)
    // The old bottom bar rendered the literal word "interactions" as text;
    // the action-bar indicator only exposes it via aria-label/tooltip.
    expect(queryByText(/interactions?$/)).not.toBeInTheDocument()
  })
})
