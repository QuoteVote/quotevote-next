/**
 * Pagination Component Tests
 *
 * Tests that verify:
 * - Component renders correctly with various props
 * - Page navigation works correctly
 * - Component handles edge cases
 * - Component is accessible
 * - Component shows/hides correctly based on totalPages
 */

import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { Pagination } from '@/components/common/Pagination'

describe('Pagination Component', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalCount: 100,
    pageSize: 10,
    onPageChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing with default props', () => {
      const { container } = render(<Pagination {...defaultProps} />)

      expect(container).toBeInTheDocument()
    })

    it('does not render when totalPages is 1', () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={1} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('does not render when totalPages is 0', () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={0} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders page numbers correctly', () => {
      render(<Pagination {...defaultProps} currentPage={5} maxVisiblePages={5} />)

      // Should show pages 3, 4, 5, 6, 7
      const page3Buttons = screen.getAllByLabelText('Page 3')
      const page5Buttons = screen.getAllByLabelText('Page 5')
      const page7Buttons = screen.getAllByLabelText('Page 7')
      expect(page3Buttons.length).toBeGreaterThan(0)
      expect(page5Buttons.length).toBeGreaterThan(0)
      expect(page7Buttons.length).toBeGreaterThan(0)
    })

    it('shows page info when showPageInfo is true', () => {
      render(<Pagination {...defaultProps} showPageInfo={true} />)

      expect(screen.getByText(/1–10 of 100/)).toBeInTheDocument()
    })

    it('hides page info when showPageInfo is false', () => {
      render(<Pagination {...defaultProps} showPageInfo={false} />)

      expect(screen.queryByText(/1–10 of 100/)).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('calls onPageChange when clicking next page button', async () => {
      const onPageChange = jest.fn()
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />)

      const nextButtons = screen.getAllByLabelText('Next page')
      fireEvent.click(nextButtons[0]!)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(2)
      })
    })

    it('calls onPageChange when clicking previous page button', async () => {
      const onPageChange = jest.fn()
      render(
        <Pagination
          {...defaultProps}
          currentPage={2}
          onPageChange={onPageChange}
        />
      )

      const prevButtons = screen.getAllByLabelText('Previous page')
      fireEvent.click(prevButtons[0]!)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(1)
      })
    })

    it('calls onPageChange when clicking a page number', async () => {
      const onPageChange = jest.fn()
      render(
        <Pagination
          {...defaultProps}
          currentPage={1}
          onPageChange={onPageChange}
        />
      )

      const pageButtons = screen.getAllByLabelText('Page 2')
      fireEvent.click(pageButtons[0]!)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(2)
      })
    })

    it('calls onPageChange when clicking first page button', async () => {
      const onPageChange = jest.fn()
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          showFirstLast={true}
          onPageChange={onPageChange}
        />
      )

      const firstButtons = screen.getAllByLabelText('First page')
      fireEvent.click(firstButtons[0]!)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(1)
      })
    })

    it('calls onPageChange when clicking last page button', async () => {
      const onPageChange = jest.fn()
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          showFirstLast={true}
          onPageChange={onPageChange}
        />
      )

      const lastButtons = screen.getAllByLabelText('Last page')
      fireEvent.click(lastButtons[0]!)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(10)
      })
    })

    it('does not call onPageChange when clicking current page', () => {
      const onPageChange = jest.fn()
      render(
        <Pagination
          {...defaultProps}
          currentPage={2}
          onPageChange={onPageChange}
        />
      )

      const currentPageButtons = screen.getAllByLabelText('Page 2')
      fireEvent.click(currentPageButtons[0]!)

      expect(onPageChange).not.toHaveBeenCalled()
    })

    it('does not call onPageChange when disabled', () => {
      const onPageChange = jest.fn()
      render(
        <Pagination
          {...defaultProps}
          disabled={true}
          onPageChange={onPageChange}
        />
      )

      const nextButtons = screen.getAllByLabelText('Next page')
      fireEvent.click(nextButtons[0]!)

      expect(onPageChange).not.toHaveBeenCalled()
    })
  })

  describe('Button States', () => {
    it('disables previous button on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />)

      const prevButtons = screen.getAllByLabelText('Previous page')
      expect(prevButtons[0]).toBeDisabled()
    })

    it('disables next button on last page', () => {
      render(<Pagination {...defaultProps} currentPage={10} />)

      const nextButtons = screen.getAllByLabelText('Next page')
      expect(nextButtons[0]).toBeDisabled()
    })

    it('disables first button on first page', () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={1}
          showFirstLast={true}
        />
      )

      const firstButtons = screen.getAllByLabelText('First page')
      expect(firstButtons[0]).toBeDisabled()
    })

    it('disables last button on last page', () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={10}
          showFirstLast={true}
        />
      )

      const lastButtons = screen.getAllByLabelText('Last page')
      expect(lastButtons[0]).toBeDisabled()
    })

    it('highlights current page', () => {
      render(<Pagination {...defaultProps} currentPage={3} />)

      const currentPageButtons = screen.getAllByLabelText('Page 3')
      const hasCurrent = currentPageButtons.some(btn =>
        btn.getAttribute('aria-current') === 'page'
      )
      expect(hasCurrent).toBe(true)
    })
  })

  describe('Ellipsis', () => {
    it('shows start ellipsis when needed', () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={10}
          maxVisiblePages={5}
        />
      )

      // Component renders unicode ellipsis character
      const ellipsis = screen.getByText('…')
      expect(ellipsis).toBeInTheDocument()
    })

    it('shows end ellipsis when needed', () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={1}
          maxVisiblePages={5}
        />
      )

      const ellipsis = screen.getAllByText('…')
      expect(ellipsis.length).toBeGreaterThan(0)
    })

    it('does not show ellipsis when all pages are visible', () => {
      render(
        <Pagination
          {...defaultProps}
          totalPages={5}
          maxVisiblePages={5}
        />
      )

      const ellipsis = screen.queryByText('…')
      expect(ellipsis).not.toBeInTheDocument()
    })
  })

  describe('Page Info', () => {
    it('calculates page info correctly for first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />)

      expect(screen.getByText(/1–10 of 100/)).toBeInTheDocument()
    })

    it('calculates page info correctly for middle page', () => {
      render(<Pagination {...defaultProps} currentPage={5} />)

      expect(screen.getByText(/41–50 of 100/)).toBeInTheDocument()
    })

    it('calculates page info correctly for last page', () => {
      render(<Pagination {...defaultProps} currentPage={10} />)

      expect(screen.getByText(/91–100 of 100/)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it.skip('shows loading indicator when changing page', async () => {
      // Loading state was removed from the Pagination component
    })

    it.skip('hides loading indicator after timeout', async () => {
      // Loading state was removed from the Pagination component
    })
  })

  describe('First/Last Buttons', () => {
    it('hides first/last buttons when showFirstLast is false', () => {
      render(
        <Pagination
          {...defaultProps}
          showFirstLast={false}
          currentPage={5}
        />
      )

      expect(screen.queryByLabelText('First page')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Last page')).not.toBeInTheDocument()
    })

    it('shows first/last buttons when showFirstLast is true', () => {
      render(
        <Pagination
          {...defaultProps}
          showFirstLast={true}
          currentPage={5}
        />
      )

      const firstButtons = screen.getAllByLabelText('First page')
      const lastButtons = screen.getAllByLabelText('Last page')
      expect(firstButtons.length).toBeGreaterThan(0)
      expect(lastButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-labels for all buttons', () => {
      render(<Pagination {...defaultProps} showFirstLast={true} />)

      const firstButtons = screen.getAllByLabelText('First page')
      const prevButtons = screen.getAllByLabelText('Previous page')
      const nextButtons = screen.getAllByLabelText('Next page')
      const lastButtons = screen.getAllByLabelText('Last page')
      const page1Buttons = screen.getAllByLabelText('Page 1')

      expect(firstButtons.length).toBeGreaterThan(0)
      expect(prevButtons.length).toBeGreaterThan(0)
      expect(nextButtons.length).toBeGreaterThan(0)
      expect(lastButtons.length).toBeGreaterThan(0)
      expect(page1Buttons.length).toBeGreaterThan(0)
    })

    it('has aria-current for current page', () => {
      render(<Pagination {...defaultProps} currentPage={2} />)

      const currentPageButtons = screen.getAllByLabelText('Page 2')
      const hasCurrent = currentPageButtons.some(btn =>
        btn.getAttribute('aria-current') === 'page'
      )
      expect(hasCurrent).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles very large totalPages', () => {
      render(
        <Pagination
          {...defaultProps}
          totalPages={1000}
          currentPage={500}
          maxVisiblePages={5}
        />
      )

      const page500Buttons = screen.getAllByLabelText('Page 500')
      expect(page500Buttons.length).toBeGreaterThan(0)
    })

    it('handles maxVisiblePages larger than totalPages', () => {
      render(
        <Pagination
          {...defaultProps}
          totalPages={3}
          maxVisiblePages={10}
        />
      )

      const page1Buttons = screen.getAllByLabelText('Page 1')
      const page2Buttons = screen.getAllByLabelText('Page 2')
      const page3Buttons = screen.getAllByLabelText('Page 3')
      expect(page1Buttons.length).toBeGreaterThan(0)
      expect(page2Buttons.length).toBeGreaterThan(0)
      expect(page3Buttons.length).toBeGreaterThan(0)
    })
  })
})
