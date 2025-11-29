/**
 * LoadingSpinner Component Tests
 * 
 * Tests that verify:
 * - Component renders correctly with default props
 * - Component renders correctly with custom props
 * - Component applies correct styling
 * - Component is accessible
 * - Component handles edge cases
 */

import { render, screen } from '../utils/test-utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('renders without crashing with default props', () => {
      const { container } = render(<LoadingSpinner />)

      expect(container).toBeInTheDocument()
      const spinner = container.querySelector('[role="status"]')
      expect(spinner).toBeInTheDocument()
    })

    it('renders with custom size', () => {
      const { container } = render(<LoadingSpinner size={100} />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveStyle({ width: '100px', height: '100px' })
    })

    it('renders with custom marginTop', () => {
      const { container } = render(<LoadingSpinner marginTop="50px" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveStyle({ marginTop: '50px' })
    })

    it('renders with both custom size and marginTop', () => {
      const { container } = render(
        <LoadingSpinner size={120} marginTop="30px" />
      )

      const wrapper = container.firstChild as HTMLElement
      const spinner = container.querySelector('[role="status"]') as HTMLElement

      expect(wrapper).toHaveStyle({ marginTop: '30px' })
      expect(spinner).toHaveStyle({ width: '120px', height: '120px' })
    })
  })

  describe('Styling', () => {
    it('applies correct container classes', () => {
      const { container } = render(<LoadingSpinner />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center', 'w-full')
    })

    it('applies correct spinner classes', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-4', 'border-solid')
    })

    it('applies default size of 80px', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toHaveStyle({ width: '80px', height: '80px' })
    })

    it('applies default marginTop of 15px', () => {
      const { container } = render(<LoadingSpinner />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ marginTop: '15px' })
    })
  })

  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('[role="status"]')
      expect(spinner).toBeInTheDocument()
    })

    it('has aria-label for screen readers', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('[role="status"]')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('has sr-only text for screen readers', () => {
      render(<LoadingSpinner />)

      const srText = screen.getByText('Loading...')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveClass('sr-only')
    })
  })

  describe('Edge Cases', () => {
    it('handles size of 0', () => {
      const { container } = render(<LoadingSpinner size={0} />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toHaveStyle({ width: '0px', height: '0px' })
    })

    it('handles very large size', () => {
      const { container } = render(<LoadingSpinner size={500} />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toHaveStyle({ width: '500px', height: '500px' })
    })

    it('handles empty marginTop string', () => {
      const { container } = render(<LoadingSpinner marginTop="" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ marginTop: '' })
    })

    it('handles zero marginTop', () => {
      const { container } = render(<LoadingSpinner marginTop="0" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ marginTop: '0' })
    })
  })

  describe('Component Structure', () => {
    it('has correct DOM structure', () => {
      const { container } = render(<LoadingSpinner />)

      const wrapper = container.firstChild as HTMLElement
      const spinner = wrapper.querySelector('[role="status"]')
      const srText = wrapper.querySelector('.sr-only')

      expect(wrapper).toBeInTheDocument()
      expect(spinner).toBeInTheDocument()
      expect(srText).toBeInTheDocument()
    })

    it('does not throw hydration warnings', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<LoadingSpinner />)

      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('hydration'),
        expect.anything()
      )

      consoleError.mockRestore()
    })
  })
})

