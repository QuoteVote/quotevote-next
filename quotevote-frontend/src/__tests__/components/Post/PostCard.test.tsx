/**
 * PostCard Component Tests
 *
 * Basic tests for the PostCard component
 */

import { fireEvent, render, screen } from '../../utils/test-utils'
import PostCard from '../../../components/Post/PostCard'
import type { PostCardProps } from '@/types/post'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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

const { useMutation: mockUseMutation, useQuery: mockUseQuery } = jest.requireMock(
  '@apollo/client/react'
) as {
  useMutation: jest.Mock
  useQuery: jest.Mock
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

  describe('Search result cards (#528)', () => {
    const tagged = { ...mockPostCardProps, url: '/post/qa/test/post1', tagId: 'group-qa' }

    beforeEach(() => {
      mockUseQuery.mockImplementation(() => ({
        data: { tag: { _id: 'group-qa', title: 'QA' } },
        loading: false,
        error: undefined,
      }))
    })

    afterEach(() => {
      mockUseQuery.mockImplementation(() => ({ data: undefined, loading: false, error: undefined }))
      window.history.replaceState(null, '', '/')
    })

    it('has no voting controls', () => {
      render(<PostCard {...tagged} approvedBy={['a']} rejectedBy={['b']} />)

      expect(screen.queryByRole('button', { name: /support this post/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /disagree with this post/i })).not.toBeInTheDocument()
    })

    it('shows the tag before the title as a labelled filter', () => {
      render(<PostCard {...tagged} />)

      const tag = screen.getByRole('button', { name: 'Show posts tagged #QA' })
      const title = screen.getByRole('heading', { name: 'Test Post Title' })
      expect(tag.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('applies the tag filter and keeps the current search, without opening the post', () => {
      window.history.replaceState(null, '', '/?q=civic&page=3')
      render(<PostCard {...tagged} />)

      fireEvent.click(screen.getByRole('button', { name: 'Show posts tagged #QA' }))

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/?q=civic&tag=group-qa')
    })

    it('replaces a tag filter from an older group link', () => {
      window.history.replaceState(null, '', '/?group=old-tag')
      render(<PostCard {...tagged} />)

      fireEvent.click(screen.getByRole('button', { name: 'Show posts tagged #QA' }))
      expect(mockPush).toHaveBeenCalledWith('/?tag=group-qa')
    })

    it('starts a fresh tag filter when used away from the home page', () => {
      window.history.replaceState(null, '', '/profile/alice')
      render(<PostCard {...tagged} />)

      fireEvent.click(screen.getByRole('button', { name: 'Show posts tagged #QA' }))
      expect(mockPush).toHaveBeenCalledWith('/?tag=group-qa')
    })

    it('opens the post from the rest of the card, with the mouse or the keyboard', () => {
      render(<PostCard {...tagged} />)

      fireEvent.click(screen.getByText('This is the post content.'))
      expect(mockPush).toHaveBeenLastCalledWith('/post/qa/test/post1')

      fireEvent.keyDown(screen.getByTestId('post-card'), { key: 'Enter' })
      expect(mockPush).toHaveBeenCalledTimes(2)
    })

    it('keeps Enter on the tag from opening the post', () => {
      render(<PostCard {...tagged} />)

      fireEvent.keyDown(screen.getByRole('button', { name: 'Show posts tagged #QA' }), {
        key: 'Enter',
      })
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('shows author, time and activity together in the footer', () => {
      render(<PostCard {...tagged} comments={[{ _id: 'c1', created: '2024-01-01', userId: 'u1' }]} />)

      expect(screen.getByTestId('post-card-interactions')).toHaveTextContent('1 interaction')
      expect(screen.getByText('testuser')).toBeInTheDocument()
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

  // RC1-030 / Issue #474: Short preview on content cards without 'Show More' link
  describe('Body Preview Truncation (#474)', () => {
    it('renders short text in full without ellipsis and without Show More button', () => {
      const shortText = 'Short content under limit.'
      render(<PostCard {...mockPostCardProps} text={shortText} />)

      expect(screen.getByText(shortText)).toBeInTheDocument()
      expect(screen.queryByText('Show More')).not.toBeInTheDocument()
      expect(screen.queryByText('Show Less')).not.toBeInTheDocument()
    })

    it('truncates long text at 150 characters with ellipsis and does not render Show More button', () => {
      const longText = 'A'.repeat(250)
      const { container } = render(<PostCard {...mockPostCardProps} text={longText} />)

      const expectedText = `${'A'.repeat(150)}...`
      expect(screen.getByText(expectedText)).toBeInTheDocument()
      expect(screen.queryByText('Show More')).not.toBeInTheDocument()
      expect(screen.queryByText('Show Less')).not.toBeInTheDocument()

      const bodyDiv = container.querySelector('.line-clamp-3')
      expect(bodyDiv).toBeInTheDocument()
    })

    it('shows a truncated body preview on compact directory cards without Show More', () => {
      const longText = 'B'.repeat(250)
      const { container } = render(
        <PostCard {...mockPostCardProps} compact text={longText} />
      )

      expect(screen.getByText(`${'B'.repeat(150)}...`)).toBeInTheDocument()
      expect(screen.queryByText('Show More')).not.toBeInTheDocument()
      expect(container.querySelector('.line-clamp-3')).toBeInTheDocument()
    })
  })

  describe('Compact directory cards (#454)', () => {
    it('shows body preview and hides bookmark/share actions', () => {
      render(
        <PostCard
          {...mockPostCardProps}
          compact
          text="This body should appear in the directory."
        />
      )

      expect(screen.getByTestId('post-card')).toHaveAttribute('data-compact', 'true')
      expect(screen.getByText('This body should appear in the directory.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Show More' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Bookmark' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    it('keeps the interaction count and source attribution', () => {
      render(
        <PostCard
          {...mockPostCardProps}
          compact
          citationUrl="https://arxiv.org/abs/123"
          attribution="Ada Lovelace"
          comments={[{ _id: 'c1', created: '2024-01-01T00:00:00Z', userId: 'u1' }]}
        />
      )

      expect(screen.getByText(/1 interaction/)).toBeInTheDocument()
      expect(screen.getByText('Source: arxiv.org')).toBeInTheDocument()
      expect(screen.getByText('— Ada Lovelace')).toBeInTheDocument()
    })
  })
})
