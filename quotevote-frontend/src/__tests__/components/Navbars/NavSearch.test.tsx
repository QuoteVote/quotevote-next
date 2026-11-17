/**
 * NavSearch: on other pages it sends the query home; on home (large screens)
 * it updates `q` and keeps the other filters.
 */

import { act, fireEvent, render, screen } from '../../utils/test-utils'
import NavSearch from '@/components/Navbars/NavSearch'

let mockPathname = '/'
let mockParams = new URLSearchParams()
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockParams,
}))

describe('NavSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockPush.mockClear()
    mockReplace.mockClear()
    mockParams = new URLSearchParams()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the search input on other pages', () => {
    mockPathname = '/profile'
    render(<NavSearch />)
    expect(screen.getByPlaceholderText('Search quotes, people and topics')).toBeInTheDocument()
  })

  it('sends the query home from other pages', () => {
    mockPathname = '/profile'
    render(<NavSearch />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: 'parking' },
    })
    act(() => {
      jest.advanceTimersByTime(450)
    })
    expect(mockPush).toHaveBeenCalledWith('/?q=parking')
  })

  it('shows the current search on home and keeps the other filters when it changes', () => {
    mockPathname = '/'
    mockParams = new URLSearchParams('q=bus&tag=t1&page=3')
    render(<NavSearch />)
    const input = screen.getByRole('textbox', { name: 'Search' })
    expect(input).toHaveValue('bus')

    fireEvent.change(input, { target: { value: 'night bus' } })
    act(() => {
      jest.advanceTimersByTime(450)
    })
    expect(mockReplace).toHaveBeenCalledWith('/?q=night+bus&tag=t1', { scroll: false })
    expect(mockPush).not.toHaveBeenCalled()
  })
})
