/**
 * PostCard Component Tests
 *
 * Basic tests for the PostCard component
 */

import { act, fireEvent, render, screen, waitFor } from '../../utils/test-utils'
import PostCard from '../../../components/Post/PostCard'
import { APPROVE_POST } from '@/graphql/mutations'
import type { PostCardProps } from '@/types/post'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock Zustand store — selector-aware so the component reads the right slices.
// State object is inside the factory to avoid jest.mock hoisting / TDZ issues.
jest.mock('@/store', () => {
  const state: {
    setSelectedPost: jest.Mock
    user: { data: { _id: string } | null }
    ui: { hiddenPosts: string[] }
  } = {
    setSelectedPost: jest.fn(),
    user: { data: null },
    ui: { hiddenPosts: [] },
  }
  return {
    useAppStore: (selector: (s: typeof state) => unknown) =>
      typeof selector === 'function' ? selector(state) : state,
    __setMockUserData: (user: { _id: string } | null) => {
      state.user.data = user
    },
  }
})

const { __setMockUserData } = jest.requireMock('@/store') as {
  __setMockUserData: (user: { _id: string } | null) => void
}

// Mock useGuestGuard
jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: () => jest.fn(() => true),
}))

// Mock Apollo hooks — both must be inside the factory to avoid TDZ issues.
// useMutation needs a live Apollo tree; mocking avoids that requirement.
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: jest.fn(() => ({ data: undefined, loading: false, error: undefined })),
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
}))

const { useMutation: mockUseMutation } = jest.requireMock('@apollo/client/react') as {
  useMutation: jest.Mock
}

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
    __setMockUserData(null)
    mockUseMutation.mockImplementation(() => [jest.fn(), { loading: false }])
  })

  it('reconciles the selected Support state from the completed mutation response', async () => {
    type ApprovePostResult = {
      data: {
        approvePost: {
          _id: string
          approvedBy: string[]
          rejectedBy: string[]
        }
      }
    }
    let resolveApprovePost!: (result: ApprovePostResult) => void
    const approvePost = jest.fn(
      () =>
        new Promise<ApprovePostResult>((resolve) => {
          resolveApprovePost = resolve
        })
    )

    __setMockUserData({ _id: 'current-user' })
    mockUseMutation.mockImplementation((mutation) => {
      if (mutation === APPROVE_POST) return [approvePost, { loading: false }]
      return [jest.fn(), { loading: false }]
    })

    render(<PostCard {...mockPostCardProps} />)

    expect(screen.getByRole('button', { name: 'Support this post' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Support this post' }))

    expect(screen.getByRole('button', { name: 'Remove support' })).toBeInTheDocument()
    expect(approvePost).toHaveBeenCalledWith({
      variables: {
        postId: 'post1',
        userId: 'current-user',
        remove: false,
      },
    })

    await act(async () => {
      resolveApprovePost({
        data: {
          approvePost: {
            _id: 'post1',
            // Intentionally differs from the optimistic addition to prove the response wins.
            approvedBy: [],
            rejectedBy: [],
          },
        },
      })
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Support this post' })).toBeInTheDocument()
    })
  })

  describe('Basic Rendering', () => {
    it('renders post card', () => {
      const { container } = render(<PostCard {...mockPostCardProps} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders without crashing when title is provided', () => {
      const { container } = render(<PostCard {...mockPostCardProps} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles missing creator gracefully', () => {
      const { container } = render(<PostCard {...mockPostCardProps} creator={undefined} />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Citation URL Rendering', () => {
    it('renders post card with citationUrl without crashing', () => {
      const { container } = render(
        <PostCard {...mockPostCardProps} citationUrl="https://www.example.com/article" />
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders post card without citationUrl without crashing', () => {
      const { container } = render(<PostCard {...mockPostCardProps} />)
      expect(mockPostCardProps.citationUrl).toBeUndefined()
      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles null citationUrl gracefully', () => {
      const { container } = render(<PostCard {...mockPostCardProps} citationUrl={null} />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  // RC1-028: Standard post cards must always use blue styling regardless of vote state.
  // Green/red are reserved for profile activity cards (ActivityCard + getCardBackgroundColor).
  describe('Card Color (RC1-028)', () => {
    const expectBlueCard = (container: HTMLElement) => {
      const card = container.querySelector('[data-testid="post-card"]') as HTMLElement
      if (!card) throw new Error(`post-card not found. HTML:\n${container.innerHTML.slice(0, 1000)}`)
      // CARD_THEME.borderColor = '#56b3ff'. jsdom keeps the hex value as-is (does not convert to rgb).
      expect(card.style.border).toContain('#56b3ff')
      expect(card.style.borderBottom).toContain('#56b3ff')
      // Background must not be set by vote state — it's controlled by the card class
      expect(card.style.backgroundColor).toBe('')
      expect(card.getAttribute('data-sentiment')).toBe('neutral')
    }

    it('stays blue when the post is heavily upvoted', () => {
      const { container } = render(
        <PostCard {...mockPostCardProps} approvedBy={['a', 'b', 'c']} rejectedBy={[]} />
      )
      expectBlueCard(container)
    })

    it('stays blue when the post is heavily downvoted', () => {
      const { container } = render(
        <PostCard {...mockPostCardProps} approvedBy={[]} rejectedBy={['a', 'b', 'c']} />
      )
      expectBlueCard(container)
    })
  })

  describe('Compact directory cards (#454)', () => {
    it('hides body text, Show More, and bookmark/share actions', () => {
      render(
        <PostCard
          {...mockPostCardProps}
          compact
          text="This body should not appear in the directory."
        />
      )

      expect(screen.getByTestId('post-card')).toHaveAttribute('data-compact', 'true')
      expect(
        screen.queryByText('This body should not appear in the directory.')
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Show More' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Bookmark' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    it('keeps votes, interaction count, and source attribution', () => {
      render(
        <PostCard
          {...mockPostCardProps}
          compact
          citationUrl="https://arxiv.org/abs/123"
          attribution="Ada Lovelace"
          comments={[{ _id: 'c1', created: '2024-01-01T00:00:00Z', userId: 'u1' }]}
        />
      )

      expect(screen.getByRole('button', { name: 'Support this post' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Disagree with this post' })).toBeInTheDocument()
      expect(screen.getByText(/1 interaction/)).toBeInTheDocument()
      expect(screen.getByText('Source: arxiv.org')).toBeInTheDocument()
      expect(screen.getByText('— Ada Lovelace')).toBeInTheDocument()
    })
  })
})
