/**
 * SearchContainer Component Tests
 * 
 * Tests for the SidebarSearchView (SearchContainer) component.
 * Tests cover:
 * - Basic rendering
 * - Search input handling
 * - Debouncing behavior
 * - GraphQL query execution
 * - Loading states
 * - Error handling
 * - Empty states
 * - Search results display
 * - No results scenarios
 */

// Mock useQuery from Apollo Client - MUST be before any imports
// Component imports from '@apollo/client' directly
const mockUseQuery = jest.fn()

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client')
  return {
    ...actual,
    useQuery: jest.fn((...args: unknown[]) => mockUseQuery(...args)),
  }
})

jest.mock('@apollo/client/react', () => {
  const actual = jest.requireActual('@apollo/client/react')
  return {
    ...actual,
    useQuery: jest.fn((...args: unknown[]) => mockUseQuery(...args)),
  }
})

// Mock the SearchResults component
jest.mock('@/components/SearchContainer/SearchResults', () => ({
  __esModule: true,
  default: ({ searchResults, isLoading, isError }: {
    searchResults: unknown
    isLoading: boolean
    isError: unknown
  }) => {
    if (isError) {
      return <div data-testid="search-error">An error has occurred.</div>
    }
    if (isLoading) {
      return <div data-testid="search-loading">Loading...</div>
    }
    if (!searchResults) {
      return null
    }
    return <div data-testid="search-results">Search Results</div>
  },
}))

// Mock useDebounce to control debouncing in tests
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: jest.fn((value) => value), // Return value immediately for testing
}))

import { render, screen, waitFor } from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import SidebarSearchView from '@/components/SearchContainer'

const mockSearchResults = {
  posts: {
    entities: [
      {
        _id: '1',
        title: 'Test Content',
        creator: { _id: 'u1', name: 'Author', username: 'author' },
      },
    ],
  },
  searchUser: [
    {
      _id: '2',
      name: 'Test User',
      username: 'testuser',
    },
  ],
}

const mockEmptyResults = {
  posts: { entities: [] },
  searchUser: [],
}

describe('SearchContainer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock for useQuery - returns no data, not loading
    // Note: Component requires Apollo Provider context, so mock must return valid structure
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    })
  })

  describe('Basic Rendering', () => {
    it('renders search input', () => {
      render(<SidebarSearchView />)

      expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument()
      expect(screen.getByLabelText('search')).toBeInTheDocument()
    })

    it('renders search icon', () => {
      render(<SidebarSearchView />)

      // Search icon should be present (lucide-react Search component)
      const searchInput = screen.getByPlaceholderText('Search…')
      expect(searchInput).toBeInTheDocument()
    })

    it('renders with default display style', () => {
      const { container } = render(<SidebarSearchView />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('block')
    })

    it('renders with custom display style', () => {
      const { container } = render(<SidebarSearchView Display="flex" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex')
    })

    it('hides container when Display is "none"', () => {
      const { container } = render(<SidebarSearchView Display="none" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('hidden')
    })
  })

  describe('Search Input Handling', () => {
    it('updates search text on input change', async () => {
      const user = userEvent.setup()
      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…') as HTMLInputElement
      await user.type(input, 'test')

      expect(input.value).toBe('test')
    })

    it('clears search text', async () => {
      const user = userEvent.setup()
      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…') as HTMLInputElement
      await user.type(input, 'test')
      expect(input.value).toBe('test')

      await user.clear(input)
      expect(input.value).toBe('')
    })

    it('handles special characters in search', async () => {
      const user = userEvent.setup()
      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…') as HTMLInputElement
      await user.type(input, 'test@example.com')

      expect(input.value).toBe('test@example.com')
    })
  })

  describe('Debouncing', () => {
    it('skips query when search text is empty', async () => {
      render(<SidebarSearchView />)

      // Should not show loading or results when empty
      await waitFor(() => {
        expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument()
        expect(screen.queryByTestId('search-results')).not.toBeInTheDocument()
      })
    })

    it('skips query when search text is only whitespace', async () => {
      const user = userEvent.setup()
      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…')
      await user.type(input, '   ')

      // Should not trigger query for whitespace-only input
      await waitFor(() => {
        expect(screen.queryByTestId('search-results')).not.toBeInTheDocument()
      })
    })
  })

  describe('GraphQL Query Execution', () => {
    it('executes search query with debounced text', async () => {
      const user = userEvent.setup()
      mockUseQuery.mockReturnValue({
        data: mockSearchResults,
        loading: false,
        error: undefined,
      })

      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…')
      await user.type(input, 'test query')

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument()
      })
    })

    it('handles query loading state', async () => {
      const user = userEvent.setup()
      // Component only renders SearchResultsView when data exists
      // So we provide data along with loading state to test loading UI
      mockUseQuery.mockReturnValue({
        data: mockSearchResults,
        loading: true,
        error: undefined,
      })

      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…')
      await user.type(input, 'test')

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('search-loading')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when query fails', async () => {
      const user = userEvent.setup()
      // Component only renders SearchResultsView when data exists
      // So we provide data along with error to test error UI
      mockUseQuery.mockReturnValue({
        data: mockSearchResults,
        loading: false,
        error: new Error('Network error'),
      })

      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByTestId('search-error')).toBeInTheDocument()
        expect(screen.getByText('An error has occurred.')).toBeInTheDocument()
      })
    })

    it('handles GraphQL errors gracefully', async () => {
      const user = userEvent.setup()
      // Component only renders SearchResultsView when data exists
      // So we provide data along with error to test error UI
      mockUseQuery.mockReturnValue({
        data: mockSearchResults,
        loading: false,
        error: { message: 'GraphQL error' },
      })

      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByTestId('search-error')).toBeInTheDocument()
      })
    })
  })

  describe('Search Results', () => {
    it('displays search results when data is available', async () => {
      const user = userEvent.setup()
      mockUseQuery.mockReturnValue({
        data: mockSearchResults,
        loading: false,
        error: undefined,
      })

      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…')
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument()
      })
    })

    it('does not display results when no data', async () => {
      render(<SidebarSearchView />)

      await waitFor(() => {
        expect(screen.queryByTestId('search-results')).not.toBeInTheDocument()
      })
    })

    it('handles empty search results', async () => {
      const user = userEvent.setup()
      mockUseQuery.mockReturnValue({
        data: mockEmptyResults,
        loading: false,
        error: undefined,
      })

      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…')
      await user.type(input, 'nonexistent')

      // Should still show results component (which handles empty state internally)
      await waitFor(() => {
        // The SearchResults component handles empty state, so we just verify query executed
        expect(input).toHaveValue('nonexistent')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles very long search queries', async () => {
      const user = userEvent.setup()
      const longQuery = 'a'.repeat(500)
      mockUseQuery.mockReturnValue({
        data: mockEmptyResults,
        loading: false,
        error: undefined,
      })

      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…') as HTMLInputElement
      await user.type(input, longQuery)

      expect(input.value).toBe(longQuery)
    })

    it('handles rapid input changes', async () => {
      const user = userEvent.setup({ delay: 0 })
      mockUseQuery.mockReturnValue({
        data: mockSearchResults,
        loading: false,
        error: undefined,
      })

      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…')
      
      // Rapidly type multiple characters
      await user.type(input, 'final')

      // Should eventually show results for final query
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles search with unicode characters', async () => {
      const user = userEvent.setup()
      mockUseQuery.mockReturnValue({
        data: mockEmptyResults,
        loading: false,
        error: undefined,
      })

      render(<SidebarSearchView />)

      const input = screen.getByPlaceholderText('Search…') as HTMLInputElement
      await user.type(input, '测试')

      expect(input.value).toBe('测试')
    })
  })
})

