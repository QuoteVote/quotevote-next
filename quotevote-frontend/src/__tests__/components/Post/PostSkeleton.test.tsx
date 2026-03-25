import { render } from '../../utils/test-utils'
import PostSkeleton from '../../../components/Post/PostSkeleton'

describe('PostSkeleton Component', () => {
  it('renders skeleton component', () => {
    const { container } = render(<PostSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with animate-pulse class', () => {
    const { container } = render(<PostSkeleton />)
    const animated = container.querySelector('.animate-pulse')
    expect(animated).toBeInTheDocument()
  })

  it('renders avatar skeleton (rounded-full)', () => {
    const { container } = render(<PostSkeleton />)
    const avatar = container.querySelector('.rounded-full')
    expect(avatar).toBeInTheDocument()
  })

  it('renders multiple skeleton placeholder divs', () => {
    const { container } = render(<PostSkeleton />)
    const skeletonDivs = container.querySelectorAll('.bg-muted')
    expect(skeletonDivs.length).toBeGreaterThan(5)
  })

  it('renders content area with body lines', () => {
    const { container } = render(<PostSkeleton />)
    // Check for body text skeleton lines (rounded bg-muted elements)
    const lines = container.querySelectorAll('.rounded')
    expect(lines.length).toBeGreaterThan(3)
  })
})
