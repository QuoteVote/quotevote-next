/**
 * DirectoryToolbar (#515): Search, Filters and Date range as the three discovery
 * controls, with sort, Following and topic inside Filters, topic suggestions in
 * the search, and removable active filter pills.
 */

import { fireEvent, render, screen } from '../../utils/test-utils'
import { DirectoryToolbar } from '@/app/components/PublicDirectory/DirectoryToolbar'
import { useAppStore } from '@/store'
import { useQuery } from '@apollo/client/react'
import { TAGS_QUERY } from '@/graphql/queries'

const mockReplace = jest.fn()
let mockSearch = ''

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(mockSearch),
}))

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: jest.fn(() => ({ data: undefined, loading: false, error: undefined })),
}))

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: <T,>(value: T) => value,
}))

describe('DirectoryToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearch = ''
    useAppStore.getState().clearUserData()
  })

  const openFilters = () => fireEvent.click(screen.getByTestId('filter-filters'))

  it('has three discovery controls: Search, Filters and Date range', () => {
    render(<DirectoryToolbar />)
    expect(screen.getByRole('combobox', { name: 'Search quotes, topics and sources' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Date range' })).toBeInTheDocument()
    // Latest, Following and Tags are no longer separate top-level controls.
    expect(screen.queryByTestId('filter-latest')).not.toBeInTheDocument()
    expect(screen.queryByTestId('filter-following')).not.toBeInTheDocument()
    expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument()
    expect(screen.queryByText(/Tip: use #hashtag/)).not.toBeInTheDocument()
  })

  describe('Filters', () => {
    it('offers Latest and Most popular, with Latest chosen by default', () => {
      render(<DirectoryToolbar />)
      openFilters()
      expect(screen.getByRole('radio', { name: /Latest/ })).toBeChecked()
      fireEvent.click(screen.getByRole('radio', { name: /Most popular/ }))
      expect(mockReplace).toHaveBeenLastCalledWith('?interactions=true', { scroll: false })
    })

    it('goes back to Latest from Most popular', () => {
      mockSearch = 'interactions=true&q=civic'
      render(<DirectoryToolbar />)
      openFilters()
      fireEvent.click(screen.getByRole('radio', { name: /Latest/ }))
      expect(mockReplace).toHaveBeenLastCalledWith('?q=civic', { scroll: false })
    })

    it('hides Only people I follow when logged out', () => {
      render(<DirectoryToolbar />)
      openFilters()
      expect(screen.queryByRole('checkbox', { name: 'Only people I follow' })).not.toBeInTheDocument()
    })

    it('toggles following=true when logged in', () => {
      useAppStore.getState().setUserData({ _id: 'user-1', username: 'tester', name: 'Tester' })
      render(<DirectoryToolbar />)
      openFilters()
      fireEvent.click(screen.getByRole('checkbox', { name: 'Only people I follow' }))
      expect(mockReplace).toHaveBeenLastCalledWith('?following=true', { scroll: false })
    })

    it('shows how many filters are on, and clears them without touching search or date', () => {
      useAppStore.getState().setUserData({ _id: 'user-1', username: 'tester', name: 'Tester' })
      mockSearch = 'q=civic&interactions=true&following=true&from=2026-10-01'
      render(<DirectoryToolbar />)
      const button = screen.getByRole('button', { name: 'Filters, 2 on' })
      fireEvent.click(button)
      fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
      expect(mockReplace).toHaveBeenLastCalledWith('?q=civic&from=2026-10-01', { scroll: false })
    })

    it('disables Clear filters when nothing is on', () => {
      render(<DirectoryToolbar />)
      openFilters()
      expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled()
    })
  })

  describe('Date range', () => {
    it('names the chosen range on the button', () => {
      mockSearch = 'from=2026-10-01&to=2026-10-20'
      render(<DirectoryToolbar />)
      const button = screen.getByTestId('filter-date')
      expect(button).toHaveAccessibleName(/^Date range, /)
      expect(button).toHaveTextContent('–')
    })
  })

  describe('Active filter pills', () => {
    it('removes only the Feed pill and keeps other params', () => {
      mockSearch = 'q=climate&following=true&interactions=true'
      render(<DirectoryToolbar />)

      fireEvent.click(screen.getByRole('button', { name: 'Remove Feed filter' }))
      expect(mockReplace).toHaveBeenLastCalledWith('?q=climate&interactions=true', {
        scroll: false,
      })
    })

    it('removes the search pill and clears q', () => {
      mockSearch = 'q=climate&following=true'
      render(<DirectoryToolbar />)

      fireEvent.click(screen.getByRole('button', { name: 'Remove Search filter' }))
      expect(mockReplace).toHaveBeenLastCalledWith('?following=true', { scroll: false })
    })

    it('labels the tag as a Topic pill', () => {
      mockSearch = 'tag=g1'
      render(<DirectoryToolbar />)
      expect(screen.getByRole('button', { name: 'Remove Topic filter' })).toBeInTheDocument()
    })

    it('still reads the tag from an older group link, and removes it', () => {
      mockSearch = 'group=g1'
      render(<DirectoryToolbar />)
      fireEvent.click(screen.getByRole('button', { name: 'Remove Topic filter' }))
      expect(mockReplace).toHaveBeenLastCalledWith('/', { scroll: false })
    })

    it('clears everything with Clear all when two or more filters are on', () => {
      mockSearch = 'q=climate&interactions=true&from=2026-10-01'
      render(<DirectoryToolbar />)
      fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
      expect(mockReplace).toHaveBeenLastCalledWith('/', { scroll: false })
      expect(screen.getByRole('combobox')).toHaveValue('')
    })

    it('hides Clear all with a single filter', () => {
      mockSearch = 'q=climate'
      render(<DirectoryToolbar />)
      expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
    })

    it('does not render pills when no filters are active', () => {
      render(<DirectoryToolbar />)
      expect(screen.queryByRole('button', { name: /^Remove /i })).not.toBeInTheDocument()
    })
  })
})

describe('DirectoryToolbar search input', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearch = ''
    ;(useQuery as unknown as jest.Mock).mockImplementation((doc: unknown) => ({
      data:
        doc === TAGS_QUERY
          ? { tags: [{ _id: 'g1', title: 'Politics', privacy: 'public' }] }
          : undefined,
      loading: false,
      error: undefined,
    }))
  })

  it('applies the tag filter when the input is a single #word naming a tag', () => {
    render(<DirectoryToolbar />)
    const input = screen.getByTestId('directory-search')
    fireEvent.change(input, { target: { value: '#politics' } })
    expect(mockReplace).toHaveBeenCalledWith('?tag=g1', { scroll: false })
    expect(mockReplace).not.toHaveBeenCalledWith(expect.stringContaining('q='), expect.anything())
  })

  it('waits on a half-typed #topic instead of searching it as text', () => {
    render(<DirectoryToolbar />)
    fireEvent.change(screen.getByTestId('directory-search'), { target: { value: '#pol' } })
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('suggests matching topics and applies the one chosen with the keyboard', () => {
    render(<DirectoryToolbar />)
    const box = screen.getByRole('combobox')
    fireEvent.focus(box)
    fireEvent.change(box, { target: { value: '#po' } })
    const list = screen.getByRole('listbox', { name: 'Topics' })
    expect(list).toHaveTextContent('Politics')
    expect(box).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    expect(box).toHaveAttribute('aria-activedescendant', screen.getByRole('option').id)
    fireEvent.submit(box.closest('form') as HTMLFormElement)
    expect(mockReplace).toHaveBeenLastCalledWith('?tag=g1', { scroll: false })
    expect(box).toHaveValue('')
  })

  it('suggests topics for plain text too, and a click applies one', () => {
    render(<DirectoryToolbar />)
    const box = screen.getByRole('combobox')
    fireEvent.focus(box)
    fireEvent.change(box, { target: { value: 'polit' } })
    fireEvent.click(screen.getByRole('option', { name: /Politics/ }))
    expect(mockReplace).toHaveBeenLastCalledWith('?tag=g1', { scroll: false })
  })

  it('closes the suggestions with Escape', () => {
    render(<DirectoryToolbar />)
    const box = screen.getByRole('combobox')
    fireEvent.focus(box)
    fireEvent.change(box, { target: { value: '#po' } })
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('lists topics inside Filters and applies one', () => {
    render(<DirectoryToolbar />)
    fireEvent.click(screen.getByTestId('filter-filters'))
    expect(screen.getByRole('radio', { name: 'Any topic' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: '#Politics' }))
    expect(mockReplace).toHaveBeenLastCalledWith('?tag=g1', { scroll: false })
  })

  it('keeps unknown #words and plain text as text search', () => {
    render(<DirectoryToolbar />)
    const input = screen.getByTestId('directory-search')
    fireEvent.change(input, { target: { value: '#unknown' } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)
    expect(mockReplace).toHaveBeenLastCalledWith('?q=%23unknown', { scroll: false })
  })

  it('does not advertise @username search', () => {
    render(<DirectoryToolbar />)
    expect(screen.queryByText(/@username/)).not.toBeInTheDocument()
  })

  describe('Search box sync (#528)', () => {
    it('empties the box when the search is cleared from outside it', () => {
      mockSearch = 'q=civic'
      const { rerender } = render(<DirectoryToolbar />)
      const box = screen.getByRole('combobox')
      expect(box).toHaveValue('civic')

      // e.g. "Clear search and filters" on an empty results page
      mockSearch = ''
      rerender(<DirectoryToolbar />)
      expect(box).toHaveValue('')
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it("doesn't overwrite what is being typed when the URL catches up", () => {
      mockSearch = 'q=civ'
      const { rerender } = render(<DirectoryToolbar />)
      const box = screen.getByRole('combobox')
      fireEvent.change(box, { target: { value: 'civic' } })

      mockSearch = 'q=civi'
      rerender(<DirectoryToolbar />)
      expect(box).toHaveValue('civic')
    })
  })
})
