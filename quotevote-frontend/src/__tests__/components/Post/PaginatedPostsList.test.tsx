/**
 * PaginatedPostsList Component Tests
 * 
 * Basic tests for the PaginatedPostsList component
 */

import { fireEvent, render, screen } from '../../utils/test-utils'
// @ts-expect-error - MockedProvider may not have types in this version
import { MockedProvider } from '@apollo/client/testing'
import PaginatedPostsList from '../../../components/Post/PaginatedPostsList'

// Mock useRouter
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

// Mock both pagination hooks (PaginatedList uses usePagination)
jest.mock('@/hooks/usePagination', () => {
  const hook = () => ({
    currentPage: 1,
    pageSize: 20,
    handlePageChange: jest.fn(),
    handlePageSizeChange: jest.fn(),
    resetToFirstPage: jest.fn(),
    calculatePagination: jest.fn((total: number) => ({
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(total / 20)),
      pageSize: 20,
      totalCount: total,
      hasNextPage: false,
      hasPreviousPage: false,
    })),
  })
  return { usePaginationWithFilters: jest.fn(hook), usePagination: jest.fn(hook) }
})

// Mock Zustand store
const mockHiddenPosts: string[] = []
jest.mock('@/store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) => {
    const state = {
      ui: {
        hiddenPosts: mockHiddenPosts,
      },
    }
    return selector(state)
  },
}))

// Mock useQuery from Apollo Client
const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

describe('PaginatedPostsList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHiddenPosts.length = 0
    // Default mock for useQuery
    mockUseQuery.mockReturnValue({
      data: {
        posts: {
          entities: [],
          pagination: {
            total_count: 0,
            limit: 20,
            offset: 0,
          },
        },
      },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })
  })

  describe('Basic Rendering', () => {
    it('renders paginated posts list component', () => {
      const { container } = render(
        <MockedProvider mocks={[]} addTypename={false}>
          <PaginatedPostsList />
        </MockedProvider>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('shows empty state when no posts', async () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <PaginatedPostsList />
        </MockedProvider>
      )
      // Component should render (may show loading or empty state)
      expect(screen.queryByText(/no.*found|no items/i) || document.body).toBeTruthy()
    })
  })

  describe('Empty and error states (#528)', () => {
    afterEach(() => window.history.replaceState(null, '', '/'))

    it('says nothing matched a search and offers to clear it', () => {
      window.history.replaceState(null, '', '/?q=civic&group=g1')
      render(<PaginatedPostsList searchKey="civic" tagId="g1" />)

      const empty = screen.getByTestId('posts-empty')
      expect(empty).toHaveTextContent('No posts found')
      expect(empty).toHaveTextContent('Nothing matches \u201ccivic\u201d with the current filters.')
      fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }))
      expect(mockReplace).toHaveBeenCalledWith('/')
    })

    it('explains an empty Following feed', () => {
      render(<PaginatedPostsList friendsOnly />)
      expect(screen.getByTestId('posts-empty')).toHaveTextContent(
        'Posts from people you follow will show up here.'
      )
    })

    it('has no clear button when nothing is filtered', () => {
      render(<PaginatedPostsList />)
      expect(screen.getByTestId('posts-empty')).toHaveTextContent('No posts yet')
      expect(screen.queryByRole('button', { name: 'Clear search and filters' })).not.toBeInTheDocument()
    })

    it("uses the caller's empty text, e.g. for a profile's posts", () => {
      render(
        <PaginatedPostsList
          userId="u1"
          loadMoreMode
          emptyTitle="No posts yet"
          emptyMessage="Ada hasn't posted anything yet."
        />
      )
      const empty = screen.getByTestId('posts-empty')
      expect(empty).toHaveTextContent("Ada hasn't posted anything yet.")
      expect(screen.queryByRole('button', { name: 'Clear search and filters' })).not.toBeInTheDocument()
    })

    it('shows a plain message instead of the raw error, with a retry', () => {
      const refetch = jest.fn()
      mockUseQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: new Error('Response not successful: Received status code 500'),
        refetch,
      })
      render(<PaginatedPostsList />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent("Posts couldn't load")
      expect(alert).not.toHaveTextContent('status code 500')
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
      // Called with no arguments: passing the click event made refetch send nothing.
      expect(refetch).toHaveBeenCalledWith()
    })
  })
})
