/**
 * NavSearch: hidden on the home search page (`/`), which has its own toolbar search
 */

import { render, screen } from '../../utils/test-utils'
import NavSearch from '@/components/Navbars/NavSearch'

let mockPathname = '/'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}))

describe('NavSearch', () => {
  it('renders nothing on the home page', () => {
    mockPathname = '/'
    const { container } = render(<NavSearch />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument()
  })

  it('renders the search input on other pages', () => {
    mockPathname = '/profile'
    render(<NavSearch />)
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument()
  })
})
