/**
 * PaginatedList Component Tests
 * 
 * Tests that verify:
 * - Component renders correctly in different states (loading, error, empty, data)
 * - Pagination integration works correctly
 * - Custom render functions work
 * - Component handles edge cases
 */

import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { PaginatedList } from '@/components/common/PaginatedList'

// Mock usePagination hook
const mockHandlePageChange = jest.fn()
const mockUsePagination = jest.fn()

jest.mock('@/hooks/usePagination', () => ({
  usePagination: (...args: unknown[]) => mockUsePagination(...args),
}))

describe('PaginatedList Component', () => {
  const mockData = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }))

  beforeEach(() => {
    jest.clearAllMocks()
    mockHandlePageChange.mockClear()
    // Reset mock to return default values
    mockUsePagination.mockImplementation((options?: { onPageChange?: (page: number) => void }) => {
      const onPageChange = options?.onPageChange
      return {
        currentPage: 1,
        pageSize: 10,
        handlePageChange: (page: number) => {
          mockHandlePageChange(page)
          onPageChange?.(page)
        },
        handlePageSizeChange: jest.fn(),
        resetToFirstPage: jest.fn(),
        calculatePagination: jest.fn((totalCount: number) => ({
          currentPage: 1,
          totalPages: Math.ceil(totalCount / 10),
          totalCount,
          pageSize: 10,
          hasNextPage: true,
          hasPreviousPage: false,
          startIndex: 0,
          endIndex: Math.min(10, totalCount),
        })),
      }
    })
  })

  describe('Loading State', () => {
    it('shows default loading state when loading and no data', () => {
      render(
        <PaginatedList
          data={undefined}
          loading={true}
          totalCount={25}
        />
      )

      // Should show skeleton loader
      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })

    it('shows custom loading renderer when provided', () => {
      render(
        <PaginatedList
          data={undefined}
          loading={true}
          totalCount={25}
          renderLoading={() => <div data-testid="custom-loading">Custom Loading</div>}
        />
      )

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
      expect(screen.getByText('Custom Loading')).toBeInTheDocument()
    })

    it('shows loading overlay when loading with existing data', () => {
      render(
        <PaginatedList
          data={mockData.slice(0, 10)}
          loading={true}
          totalCount={25}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      )

      expect(screen.getByText('Loading new page...')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we fetch the latest posts')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows default error state when error occurs', () => {
      const error = new Error('Test error')
      render(
        <PaginatedList
          data={undefined}
          loading={false}
          error={error}
          totalCount={25}
        />
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    it('shows custom error renderer when provided', () => {
      const error = new Error('Test error')
      render(
        <PaginatedList
          data={undefined}
          loading={false}
          error={error}
          totalCount={25}
          renderError={(err) => (
            <div data-testid="custom-error">Error: {err.message}</div>
          )}
        />
      )

      expect(screen.getByTestId('custom-error')).toBeInTheDocument()
      expect(screen.getByText('Error: Test error')).toBeInTheDocument()
    })

    it('shows refresh button when onRefresh is provided', () => {
      const error = new Error('Test error')
      const onRefresh = jest.fn()
      render(
        <PaginatedList
          data={undefined}
          loading={false}
          error={error}
          totalCount={25}
          onRefresh={onRefresh}
        />
      )

      const refreshButton = screen.getByText('Try Again')
      expect(refreshButton).toBeInTheDocument()

      fireEvent.click(refreshButton)
      expect(onRefresh).toHaveBeenCalled()
    })

    it('does not show refresh button when onRefresh is not provided', () => {
      const error = new Error('Test error')
      render(
        <PaginatedList
          data={undefined}
          loading={false}
          error={error}
          totalCount={25}
        />
      )

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows default empty state when no data', () => {
      render(
        <PaginatedList
          data={[]}
          loading={false}
          totalCount={0}
        />
      )

      expect(screen.getByText('No items found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
    })

    it('shows custom empty renderer when provided', () => {
      render(
        <PaginatedList
          data={[]}
          loading={false}
          totalCount={0}
          renderEmpty={() => <div data-testid="custom-empty">No data available</div>}
        />
      )

      expect(screen.getByTestId('custom-empty')).toBeInTheDocument()
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('does not show empty state when loading', () => {
      render(
        <PaginatedList
          data={[]}
          loading={true}
          totalCount={0}
        />
      )

      expect(screen.queryByText('No items found')).not.toBeInTheDocument()
    })
  })

  describe('Data Rendering', () => {
    it('renders data using renderItem function', () => {
      render(
        <PaginatedList
          data={mockData.slice(0, 10)}
          loading={false}
          totalCount={25}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 10')).toBeInTheDocument()
    })

    it('renders children when provided instead of renderItem', () => {
      render(
        <PaginatedList
          data={mockData.slice(0, 10)}
          loading={false}
          totalCount={25}
        >
          <div data-testid="children-content">Children content</div>
        </PaginatedList>
      )

      expect(screen.getByTestId('children-content')).toBeInTheDocument()
    })

    it('prefers children over renderItem when both are provided', () => {
      render(
        <PaginatedList
          data={mockData.slice(0, 10)}
          loading={false}
          totalCount={25}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        >
          <div data-testid="children-content">Children content</div>
        </PaginatedList>
      )

      expect(screen.getByTestId('children-content')).toBeInTheDocument()
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
    })
  })

  describe('Pagination Integration', () => {
    it('shows pagination when totalPages > 1', () => {
      render(
        <PaginatedList
          data={mockData.slice(0, 10)}
          loading={false}
          totalCount={25}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      )

      // Pagination renders both desktop and mobile layouts, so buttons appear twice
      const nextButtons = screen.getAllByLabelText('Go to next page')
      expect(nextButtons.length).toBeGreaterThan(0)
    })

    it('does not show pagination when totalPages <= 1', () => {
      render(
        <PaginatedList
          data={mockData.slice(0, 5)}
          loading={false}
          totalCount={5}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      )

      expect(screen.queryByLabelText('Go to next page')).not.toBeInTheDocument()
    })

    it('calls onPageChange when pagination changes', async () => {
      const onPageChange = jest.fn()
      render(
        <PaginatedList
          data={mockData.slice(0, 10)}
          loading={false}
          totalCount={25}
          onPageChange={onPageChange}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      )

      // Get first instance (desktop layout) and click it
      const nextButtons = screen.getAllByLabelText('Go to next page')
      fireEvent.click(nextButtons[0]!)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalled()
      })
    })
  })

  describe('Styling', () => {
    it('applies custom className to root', () => {
      const { container } = render(
        <PaginatedList
          data={mockData.slice(0, 10)}
          loading={false}
          totalCount={25}
          className="custom-root-class"
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-root-class')
    })

    it('applies custom contentClassName', () => {
      const { container } = render(
        <PaginatedList
          data={mockData.slice(0, 10)}
          loading={false}
          totalCount={25}
          contentClassName="custom-content-class"
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      )

      const content = container.querySelector('.custom-content-class')
      expect(content).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined data', () => {
      render(
        <PaginatedList
          data={undefined}
          loading={false}
          totalCount={0}
        />
      )

      expect(screen.getByText('No items found')).toBeInTheDocument()
    })

    it('handles null data', () => {
      render(
        <PaginatedList
          data={null as unknown as []}
          loading={false}
          totalCount={0}
        />
      )

      expect(screen.getByText('No items found')).toBeInTheDocument()
    })

    it('handles error without message', () => {
      const error = { message: undefined }
      render(
        <PaginatedList
          data={undefined}
          loading={false}
          error={error}
          totalCount={25}
        />
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('An error occurred while loading the data.')).toBeInTheDocument()
    })
  })
})

