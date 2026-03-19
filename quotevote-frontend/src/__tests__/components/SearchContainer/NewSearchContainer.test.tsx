/**
 * SearchContainer (new tabbed version) Component Tests
 *
 * Tests for the SearchContainer component including:
 * - Tab rendering (Trending, Featured, Friends, Search)
 * - URL param syncing
 * - Search input and debounce
 * - Guest sections visibility
 */

// Mock useQuery
const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

// Mock next/navigation
const mockReplace = jest.fn()
const mockSearchParamsGet = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    toString: () => '',
  }),
}))

// Mock useDebounce to return value immediately
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}))

// Mock child PostCard and PostSkeleton
jest.mock('@/components/Post/PostCard', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid="post-card">{title}</div>
  ),
}))
jest.mock('@/components/Post/PostSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="post-skeleton">Loading...</div>,
}))

// Mock SearchGuestSections
jest.mock('@/components/SearchContainer/SearchGuestSections', () => ({
  __esModule: true,
  default: () => <div data-testid="search-guest-sections" />,
}))

// Mock store
jest.mock('@/store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) => {
    const state = {
      user: { data: { _id: 'user-1', id: 'user-1' } },
    }
    return selector(state)
  },
}))

import { render, screen, waitFor } from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import SearchContainer from '@/components/SearchContainer/SearchContainer'

const defaultQueryResult = {
  loading: false,
  data: {
    posts: {
      entities: [
        {
          _id: 'post-1',
          userId: 'user-1',
          created: '2024-01-01',
          title: 'Test Post',
          text: 'Test content',
          url: '/dashboard/post/group/test/post-1',
          comments: [],
          votes: [],
          quotes: [],
          bookmarkedBy: [],
          approvedBy: [],
          rejectedBy: [],
        },
      ],
      pagination: { total_count: 1, limit: 20, offset: 0 },
    },
    featuredPosts: {
      entities: [],
      pagination: { total_count: 0, limit: 20, offset: 0 },
    },
  },
  error: undefined,
}

describe('SearchContainer (tabbed version)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // By default: no search query, tab=trending
    mockSearchParamsGet.mockImplementation((key: string) => {
      const params: Record<string, string | null> = {
        q: null,
        tab: 'trending',
        from: null,
        to: null,
      }
      return params[key] ?? null
    })
    mockUseQuery.mockReturnValue(defaultQueryResult)
  })

  describe('Basic Rendering', () => {
    it('renders search input', () => {
      render(<SearchContainer />)
      expect(screen.getByPlaceholderText('Search posts, people, and more...')).toBeInTheDocument()
    })

    it('renders Trending tab by default', () => {
      render(<SearchContainer />)
      expect(screen.getByRole('tab', { name: /trending/i })).toBeInTheDocument()
    })

    it('renders Featured tab', () => {
      render(<SearchContainer />)
      expect(screen.getByRole('tab', { name: /featured/i })).toBeInTheDocument()
    })

    it('renders Friends tab for logged-in users', () => {
      render(<SearchContainer />)
      expect(screen.getByRole('tab', { name: /friends/i })).toBeInTheDocument()
    })

    it('does not render Search tab when no query', () => {
      render(<SearchContainer />)
      expect(screen.queryByRole('tab', { name: /^search$/i })).not.toBeInTheDocument()
    })

    it('renders SearchGuestSections', () => {
      render(<SearchContainer />)
      expect(screen.getByTestId('search-guest-sections')).toBeInTheDocument()
    })
  })

  describe('Tab URL sync', () => {
    it('renders search tab when q param is set', () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        const params: Record<string, string | null> = {
          q: 'hello',
          tab: 'search',
          from: null,
          to: null,
        }
        return params[key] ?? null
      })
      render(<SearchContainer />)
      expect(screen.getByRole('tab', { name: /^search$/i })).toBeInTheDocument()
    })
  })

  describe('Search input', () => {
    it('updates input value on change', async () => {
      const user = userEvent.setup()
      render(<SearchContainer />)

      const input = screen.getByPlaceholderText('Search posts, people, and more...') as HTMLInputElement
      await user.type(input, 'quote')

      expect(input.value).toBe('quote')
    })

    it('calls router.replace when debounced query changes', async () => {
      const user = userEvent.setup()
      render(<SearchContainer />)

      const input = screen.getByPlaceholderText('Search posts, people, and more...')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled()
      })
    })
  })

  describe('Loading state', () => {
    it('shows PostSkeleton when loading', () => {
      mockUseQuery.mockReturnValue({ loading: true, data: undefined, error: undefined })
      render(<SearchContainer />)
      expect(screen.getAllByTestId('post-skeleton').length).toBeGreaterThan(0)
    })
  })

  describe('Empty state', () => {
    it('shows mock posts when query returns empty with no search key', () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        data: {
          posts: {
            entities: [],
            pagination: { total_count: 0, limit: 20, offset: 0 },
          },
        },
        error: undefined,
      })
      render(<SearchContainer />)
      // When no search key and no posts, mock data is shown as fallback
      expect(screen.queryByText(/no posts found/i)).not.toBeInTheDocument()
    })
  })
})
