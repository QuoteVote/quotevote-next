/**
 * LogoutPage Component Tests
 *
 * Tests for the LogoutPage component.
 * Tests cover:
 * - Component rendering and loading state
 * - Logout functionality (token removal, Apollo reset, Zustand reset)
 * - Navigation to home page
 */

import { render, screen, waitFor } from '../utils/test-utils'
import { LogoutPage } from '@/components/LogoutPage'
import { useAppStore } from '@/store'

// Mock Next.js router
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock Apollo client hook
const mockResetStore = jest.fn().mockResolvedValue(undefined)
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useApolloClient: jest.fn(() => ({ resetStore: mockResetStore })),
}))

describe('LogoutPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    mockResetStore.mockClear()

    // Reset store state to logged in
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        data: {
          _id: 'user123',
          username: 'testuser',
          name: 'Test User',
        },
      },
    })

    // Mock localStorage
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'mock-token'),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      })
    }
  })

  describe('Rendering', () => {
    it('renders loading state with spinner and message', () => {
      render(<LogoutPage />)
      expect(screen.getByText('Signing you out…')).toBeInTheDocument()
    })
  })

  describe('Logout Functionality', () => {
    it('removes token from localStorage', async () => {
      render(<LogoutPage />)
      await waitFor(() => {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('token')
      })
    })

    it('resets Apollo Client store', async () => {
      render(<LogoutPage />)
      await waitFor(() => {
        expect(mockResetStore).toHaveBeenCalled()
      })
    })

    it('resets Zustand store', async () => {
      render(<LogoutPage />)
      await waitFor(() => {
        const storeState = useAppStore.getState()
        expect(storeState.user.data).toEqual({})
      })
    })

    it('redirects to home page after logout', async () => {
      render(<LogoutPage />)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })
  })
})
