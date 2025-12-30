import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders correctly with default props', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
    // Default size is 80px
    expect(spinner).toHaveStyle({ width: '80px', height: '80px' })
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size={50} />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveStyle({ width: '50px', height: '50px' })
  })

  it('renders with custom margin top', () => {
    const { container } = render(<LoadingSpinner marginTop="20px" />)
    // The margin is on the outer div
    const outerDiv = container.firstChild
    expect(outerDiv).toHaveStyle({ marginTop: '20px' })
  })
})
