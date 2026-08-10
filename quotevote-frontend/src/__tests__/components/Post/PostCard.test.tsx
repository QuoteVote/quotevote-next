/**
 * PostCard Component Tests
 *
 * Basic tests for the PostCard component
 */

import { render } from '../../utils/test-utils'
import PostCard from '../../../components/Post/PostCard'
import type { PostCardProps } from '@/types/post'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock Zustand store — selector-aware so the component reads the right slices.
// State object is inside the factory to avoid jest.mock hoisting / TDZ issues.
jest.mock('@/store', () => {
  const state = {
    setSelectedPost: jest.fn(),
    user: { data: null },
    ui: { hiddenPosts: [] },
  }
  return {
    useAppStore: (selector: (s: typeof state) => unknown) =>
      typeof selector === 'function' ? selector(state) : state,
  }
})

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
})
