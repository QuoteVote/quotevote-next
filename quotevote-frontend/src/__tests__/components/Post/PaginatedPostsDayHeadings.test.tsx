/**
 * PaginatedPostsList: day headings in newest-first feeds
 */

import { render, screen } from '../../utils/test-utils'
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

jest.mock('@/components/Post/PostCard', () => ({
  __esModule: true,
  default: ({ title, timeOnly }: { title: string; timeOnly?: boolean }) => (
    <article data-testid="post-card" data-time-only={timeOnly ? 'true' : 'false'}>
      {title}
    </article>
  ),
}))

const at = (daysAgo: number, hour: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const post = (id: string, created: string) => ({
  _id: id,
  userId: 'u1',
  title: `Post ${id}`,
  text: 'text',
  url: `/post/t/x/${id}`,
  created,
  upvotes: 1,
  downvotes: 0,
})

function renderList(props: Record<string, unknown>) {
  return render(<PaginatedPostsList {...props} />)
}

describe('PaginatedPostsList day headings', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: {
        posts: {
          entities: [post('a', at(0, 9)), post('b', at(0, 8)), post('c', at(1, 18))],
          pagination: { total_count: 3, limit: 20, offset: 0 },
        },
      },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })
  })

  it('puts a heading before each day and shows only the time on the cards', () => {
    renderList({ groupByDay: true })

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Today',
      'Yesterday',
    ])
    expect(screen.getAllByTestId('post-card')[0]).toHaveAttribute('data-time-only', 'true')
  })

  it('leaves the headings out when sorted by popularity', () => {
    renderList({ groupByDay: true, interactions: true })

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    expect(screen.getAllByTestId('post-card')[0]).toHaveAttribute('data-time-only', 'false')
  })

  it('has no headings unless asked', () => {
    renderList({})

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})
