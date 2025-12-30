/**
 * Loader Component Tests
 * 
 * Tests that verify:
 * - Component renders correctly with default props
 * - Component renders correctly with custom props
 * - Component applies correct styling
 * - Component is accessible
 * - Component handles edge cases
 */

import { render, screen } from '../utils/test-utils'
import { Loader } from '@/components/common/Loader'

describe('Loader Component', () => {
  describe('Rendering', () => {
    it('renders without crashing with default props', () => {
      const { container } = render(<Loader />)

      expect(container).toBeInTheDocument()
      const spinner = container.querySelector('[role="status"]')
      expect(spinner).toBeInTheDocument()
    })

    it('renders with custom size', () => {
      const { container } = render(<Loader size={60} />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveStyle({ width: '60px', height: '60px' })
    })

    it('renders with custom loaderStyle', () => {
      const customStyle = { backgroundColor: 'red' }
      const { container } = render(<Loader loaderStyle={customStyle} mergeStyles={true} />)

      const wrapper = container.firstChild as HTMLElement
      // Check inline style directly
      expect(wrapper.style.backgroundColor).toBe('red')
    })

    it('renders with loadingLabel', () => {
      render(<Loader loadingLabel="Custom loading text" />)

      // There are two "Loading..." texts - one sr-only and one visible
      // Get the visible one by checking it's not sr-only
      const labels = screen.getAllByText('Loading...')
      const visibleLabel = labels.find(label => !label.classList.contains('sr-only'))
      expect(visibleLabel).toBeInTheDocument()
      expect(visibleLabel).not.toHaveClass('sr-only')
      expect(visibleLabel).toHaveClass('ml-2.5')
    })

    it('renders without loadingLabel by default', () => {
      const { container } = render(<Loader />)

      const label = container.querySelector('.ml-2\\.5')
      expect(label).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies default absolutely positioned style', () => {
      const { container } = render(<Loader />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({
        position: 'absolute',
        top: 'calc(50% - 15px)',
        left: 'calc(50% - 36px)',
      })
    })

    it('applies non-absolutely positioned style when absolutelyPositioned is false', () => {
      const { container } = render(<Loader absolutelyPositioned={false} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).not.toHaveStyle({
        position: 'absolute',
      })
    })

    it('applies default loader style properties', () => {
      const { container } = render(<Loader />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({
        width: 'auto',
        height: 'auto',
        zIndex: '100',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      })
    })

    it('merges custom styles when mergeStyles is true', () => {
      const customStyle = { backgroundColor: 'blue', padding: '20px' }
      const { container } = render(
        <Loader loaderStyle={customStyle} mergeStyles={true} />
      )

      const wrapper = container.firstChild as HTMLElement
      // Check that custom styles are applied
      expect(wrapper.style.backgroundColor).toBe('blue')
      expect(wrapper.style.padding).toBe('20px')
      // Check that default styles are also present
      expect(wrapper.style.display).toBe('flex')
    })

    it('replaces default styles when mergeStyles is false', () => {
      const customStyle = { backgroundColor: 'green' }
      const { container } = render(
        <Loader loaderStyle={customStyle} mergeStyles={false} />
      )

      const wrapper = container.firstChild as HTMLElement
      // When mergeStyles is false, only custom style should be applied
      expect(wrapper.style.backgroundColor).toBe('green')
      // Default styles should not be present
      expect(wrapper.style.display).not.toBe('flex')
    })

    it('applies correct spinner classes', () => {
      const { container } = render(<Loader />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-solid')
    })

    it('applies default size of 40px', () => {
      const { container } = render(<Loader />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toHaveStyle({ width: '40px', height: '40px' })
    })

    it('applies custom thickness', () => {
      const { container } = render(<Loader size={40} thickness={5} />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      // Thickness calculation: Math.max(1, Math.round((5 / 10) * (40 / 10))) = 2
      expect(spinner).toHaveStyle({ borderWidth: '2px' })
    })
  })

  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      const { container } = render(<Loader />)

      const spinner = container.querySelector('[role="status"]')
      expect(spinner).toBeInTheDocument()
    })

    it('has aria-label for screen readers', () => {
      const { container } = render(<Loader />)

      const spinner = container.querySelector('[role="status"]')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('has sr-only text for screen readers', () => {
      render(<Loader />)

      const srText = screen.getByText('Loading...')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveClass('sr-only')
    })
  })

  describe('Edge Cases', () => {
    it('handles size of 0', () => {
      const { container } = render(<Loader size={0} />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toHaveStyle({ width: '0px', height: '0px' })
    })

    it('handles very large size', () => {
      const { container } = render(<Loader size={200} />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      expect(spinner).toHaveStyle({ width: '200px', height: '200px' })
    })

    it('handles very small thickness', () => {
      const { container } = render(<Loader size={40} thickness={0.1} />)

      const spinner = container.querySelector('[role="status"]') as HTMLElement
      // Should default to minimum border width of 1px
      expect(spinner).toHaveStyle({ borderWidth: '1px' })
    })

    it('handles PulseLoaderProps', () => {
      const { container } = render(
        <Loader PulseLoaderProps={{ 'data-testid': 'custom-loader' }} />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('data-testid', 'custom-loader')
    })
  })

  describe('Component Structure', () => {
    it('has correct DOM structure', () => {
      const { container } = render(<Loader />)

      const wrapper = container.firstChild as HTMLElement
      const spinner = wrapper.querySelector('[role="status"]')
      const srText = wrapper.querySelector('.sr-only')

      expect(wrapper).toBeInTheDocument()
      expect(spinner).toBeInTheDocument()
      expect(srText).toBeInTheDocument()
    })

    it('has correct DOM structure with loadingLabel', () => {
      const { container } = render(<Loader loadingLabel="Loading..." />)

      const wrapper = container.firstChild as HTMLElement
      const spinner = wrapper.querySelector('[role="status"]')
      const label = wrapper.querySelector('.ml-2\\.5')

      expect(wrapper).toBeInTheDocument()
      expect(spinner).toBeInTheDocument()
      expect(label).toBeInTheDocument()
    })
  })
})

