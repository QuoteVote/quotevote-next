/**
 * DirectoryToolbar: Following chip and removable active filter pills (home search page)
 */

import { fireEvent, render, screen } from '../../utils/test-utils'
import { DirectoryToolbar } from '@/app/components/PublicDirectory/DirectoryToolbar'
import { useAppStore } from '@/store'

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

  describe('Following filter', () => {
    it('is hidden when logged out', () => {
      render(<DirectoryToolbar />)
      expect(screen.queryByTestId('filter-following')).not.toBeInTheDocument()
    })

    it('toggles following=true in the URL when logged in', () => {
      useAppStore.getState().setUserData({ _id: 'user-1', username: 'tester', name: 'Tester' })
      render(<DirectoryToolbar />)

      const chip = screen.getByTestId('filter-following')
      expect(chip).toHaveAttribute('aria-pressed', 'false')
      fireEvent.click(chip)
      expect(mockReplace).toHaveBeenLastCalledWith('?following=true', { scroll: false })
    })

    it('clears following when already active', () => {
      useAppStore.getState().setUserData({ _id: 'user-1', username: 'tester', name: 'Tester' })
      mockSearch = 'following=true'
      render(<DirectoryToolbar />)

      const chip = screen.getByTestId('filter-following')
      expect(chip).toHaveAttribute('aria-pressed', 'true')
      fireEvent.click(chip)
      expect(mockReplace).toHaveBeenLastCalledWith('/', { scroll: false })
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

    it('does not render pills when no filters are active', () => {
      render(<DirectoryToolbar />)
      expect(screen.queryByRole('button', { name: /^Remove /i })).not.toBeInTheDocument()
    })
  })
})
