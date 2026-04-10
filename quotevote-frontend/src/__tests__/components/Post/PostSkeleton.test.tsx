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

  it('renders vote column skeleton', () => {
    const { container } = render(<PostSkeleton />)
    // Vote column has rounded square placeholders
    const votePlaceholders = container.querySelectorAll('[class*="rounded"]')
    expect(votePlaceholders.length).toBeGreaterThan(0)
  })

  it('renders multiple skeleton placeholder divs', () => {
    const { container } = render(<PostSkeleton />)
    const skeletonDivs = container.querySelectorAll('[class*="bg-muted"]')
    expect(skeletonDivs.length).toBeGreaterThan(5)
  })

  it('renders content area with body lines', () => {
    const { container } = render(<PostSkeleton />)
    const lines = container.querySelectorAll('[class*="rounded"]')
    expect(lines.length).toBeGreaterThan(3)
  })
})
