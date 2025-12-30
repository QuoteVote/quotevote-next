/**
 * StickyPaginationWrapper Component Tests
 * 
 * Tests that verify:
 * - Component renders correctly with children
 * - Pagination is rendered when provided
 * - Component applies correct styling
 * - Component structure is correct
 */

import { render, screen } from '../utils/test-utils'
import { StickyPaginationWrapper } from '@/components/common/StickyPaginationWrapper'
import { Pagination } from '@/components/common/Pagination'

describe('StickyPaginationWrapper Component', () => {
  const mockPagination = (
    <Pagination
      currentPage={1}
      totalPages={10}
      totalCount={100}
      pageSize={10}
      onPageChange={jest.fn()}
    />
  )

  describe('Rendering', () => {
    it('renders without crashing with children', () => {
      const { container } = render(
        <StickyPaginationWrapper>
          <div>Test content</div>
        </StickyPaginationWrapper>
      )

      expect(container).toBeInTheDocument()
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('renders children correctly', () => {
      render(
        <StickyPaginationWrapper>
          <div data-testid="child">Child content</div>
        </StickyPaginationWrapper>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('renders pagination when provided', () => {
      render(
        <StickyPaginationWrapper pagination={mockPagination}>
          <div>Content</div>
        </StickyPaginationWrapper>
      )

      // Pagination renders both desktop and mobile layouts, so buttons appear twice
      const nextButtons = screen.getAllByLabelText('Go to next page')
      expect(nextButtons.length).toBeGreaterThan(0)
    })

    it('does not render pagination when not provided', () => {
      render(
        <StickyPaginationWrapper>
          <div>Content</div>
        </StickyPaginationWrapper>
      )

      expect(screen.queryByLabelText('Go to next page')).not.toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(
        <StickyPaginationWrapper className="custom-class">
          <div>Content</div>
        </StickyPaginationWrapper>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-class')
    })
  })

  describe('Styling', () => {
    it('applies correct root container classes', () => {
      const { container } = render(
        <StickyPaginationWrapper>
          <div>Content</div>
        </StickyPaginationWrapper>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex', 'flex-col', 'min-h-screen', 'relative')
    })

    it('applies correct content area classes', () => {
      const { container } = render(
        <StickyPaginationWrapper>
          <div>Content</div>
        </StickyPaginationWrapper>
      )

      const content = container.querySelector('.pb-48') as HTMLElement
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('flex-1', 'pb-48', 'mb-8', 'overflow-auto')
    })

    it('applies correct pagination container classes', () => {
      render(
        <StickyPaginationWrapper pagination={mockPagination}>
          <div>Content</div>
        </StickyPaginationWrapper>
      )

      // Get first instance (desktop layout) and find its fixed container
      const nextButtons = screen.getAllByLabelText('Go to next page')
      const paginationContainer = nextButtons[0]!.closest('.fixed')
      expect(paginationContainer).toBeInTheDocument()
      expect(paginationContainer).toHaveClass(
        'fixed',
        'bottom-0',
        'left-0',
        'right-0',
        'z-[1000]'
      )
    })
  })

  describe('Component Structure', () => {
    it('has correct DOM structure with children only', () => {
      const { container } = render(
        <StickyPaginationWrapper>
          <div data-testid="content">Content</div>
        </StickyPaginationWrapper>
      )

      const wrapper = container.firstChild as HTMLElement
      const content = wrapper.querySelector('[data-testid="content"]')

      expect(wrapper).toBeInTheDocument()
      expect(content).toBeInTheDocument()
    })

    it('has correct DOM structure with pagination', () => {
      const { container } = render(
        <StickyPaginationWrapper pagination={mockPagination}>
          <div data-testid="content">Content</div>
        </StickyPaginationWrapper>
      )

      const wrapper = container.firstChild as HTMLElement
      const content = wrapper.querySelector('[data-testid="content"]')
      // Pagination renders both desktop and mobile layouts
      const nextButtons = screen.getAllByLabelText('Go to next page')

      expect(wrapper).toBeInTheDocument()
      expect(content).toBeInTheDocument()
      expect(nextButtons.length).toBeGreaterThan(0)
    })

    it('renders multiple children correctly', () => {
      render(
        <StickyPaginationWrapper>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <div data-testid="child3">Child 3</div>
        </StickyPaginationWrapper>
      )

      expect(screen.getByTestId('child1')).toBeInTheDocument()
      expect(screen.getByTestId('child2')).toBeInTheDocument()
      expect(screen.getByTestId('child3')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      const { container } = render(<StickyPaginationWrapper>{null}</StickyPaginationWrapper>)

      expect(container).toBeInTheDocument()
    })

    it('handles null pagination', () => {
      const { container } = render(
        <StickyPaginationWrapper pagination={null}>
          <div>Content</div>
        </StickyPaginationWrapper>
      )

      expect(container).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('handles undefined pagination', () => {
      const { container } = render(
        <StickyPaginationWrapper pagination={undefined}>
          <div>Content</div>
        </StickyPaginationWrapper>
      )

      expect(container).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})

