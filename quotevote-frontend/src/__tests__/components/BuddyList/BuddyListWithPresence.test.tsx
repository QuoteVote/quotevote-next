/**
 * BuddyListWithPresence Component Tests
 * 
 * Tests for the BuddyListWithPresence component including:
 * - Buddy list rendering
 * - Presence indicators
 * - Pending requests handling
 * - Search functionality
 * - Presence subscription integration
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import BuddyListWithPresence from '@/components/BuddyList/BuddyListWithPresence'
import { useAppStore } from '@/store'
import { GET_BUDDY_LIST, GET_ROSTER } from '@/graphql/queries'

// Mock Zustand store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// Mock usePresenceSubscription
jest.mock('@/hooks/usePresenceSubscription', () => ({
  usePresenceSubscription: jest.fn(),
}))

// Mock useQuery from Apollo Client
const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

// Mock useRosterManagement
const mockAcceptBuddy = jest.fn().mockResolvedValue({})
const mockDeclineBuddy = jest.fn().mockResolvedValue({})
jest.mock('@/hooks/useRosterManagement', () => ({
  useRosterManagement: jest.fn(() => ({
        acceptBuddy: mockAcceptBuddy,
        declineBuddy: mockDeclineBuddy,
  })),
}))

// Mock BuddyItemList
jest.mock('@/components/BuddyList/BuddyItemList', () => ({
  __esModule: true,
  default: ({ buddyList }: { buddyList: unknown[] }) => (
    <div data-testid="buddy-item-list">
      {buddyList.length} buddies
    </div>
  ),
}))

// Mock LoadingSpinner
jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => (
    <div data-testid="loading-spinner">Loading...</div>
  ),
}))

// Mock Avatar
jest.mock('@/components/Avatar', () => ({
    __esModule: true,
  default: ({ src, alt, fallback }: { 
    src?: string; 
    alt: string; 
    fallback?: string;
  }) => (
    <div data-testid="avatar" data-src={src} data-alt={alt}>
      {fallback || alt[0]}
        </div>
    ),
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

const mockCurrentUser = {
  _id: 'user1',
  name: 'Current User',
  username: 'currentuser',
}

const mockBuddies = [
  {
    id: 'buddy1',
    buddyId: 'user2',
    status: 'accepted',
    buddy: {
      _id: 'user2',
      id: 'user2',
      username: 'buddy1',
      name: 'Buddy One',
      avatar: 'https://example.com/avatar1.jpg',
    },
  },
  {
    id: 'buddy2',
    buddyId: 'user3',
    status: 'accepted',
    buddy: {
      _id: 'user3',
      id: 'user3',
      username: 'buddy2',
      name: 'Buddy Two',
      avatar: 'https://example.com/avatar2.jpg',
    },
  },
]

// Mock query objects for reference (not used directly but kept for documentation)
// const mockBuddyListQuery = {
//   request: {
//     query: GET_BUDDY_LIST,
//   },
//   result: {
//     data: {
//       buddyList: mockBuddies,
//     },
//   },
// }

// const mockRosterQuery = {
//   request: {
//     query: GET_ROSTER,
//   },
//   result: {
//     data: {
//       roster: {
//         buddies: [],
//         pendingRequests: [],
//         blockedUsers: [],
//       },
//     },
//   },
// }

const mockRosterWithPending = {
  request: {
    query: GET_ROSTER,
  },
  result: {
    data: {
      roster: {
        buddies: [],
        pendingRequests: [
          {
            id: 'req1',
            buddyId: 'user4',
            status: 'pending',
            buddy: {
              _id: 'user4',
              id: 'user4',
              username: 'requester',
              name: 'Requester User',
              avatar: 'https://example.com/avatar3.jpg',
            },
          },
        ],
        blockedUsers: [],
      },
    },
  },
}

describe('BuddyListWithPresence', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useQuery to return buddy list data by default
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: { buddyList: mockBuddies },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
                                }
      if (query === GET_ROSTER) {
        return {
          data: { roster: { buddies: [], pendingRequests: [], blockedUsers: [] } },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
            }
      return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: mockCurrentUser,
        },
        chat: {
          presenceMap: {
            user2: { status: 'online', statusMessage: '', lastSeen: null },
            user3: { status: 'away', statusMessage: '', lastSeen: null },
          },
        },
        setBuddyList: jest.fn(),
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })
  })

  it('renders "Please log in" when no current user', () => {
    // Mock useQuery to skip when no user
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: null },
        chat: { presenceMap: {} },
        setBuddyList: jest.fn(),
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })

    render(<BuddyListWithPresence />)

    expect(screen.getByText('Please log in to view your buddy list')).toBeInTheDocument()
  })

  it('renders loading spinner while fetching data', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<BuddyListWithPresence />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders error message when query fails', async () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Failed to fetch buddy list'),
      refetch: jest.fn(),
    })

    render(<BuddyListWithPresence />)

    await waitFor(() => {
      expect(screen.getByText('Error loading buddy list. Please try refreshing.')).toBeInTheDocument()
    })
  })

  it('renders buddy list grouped by presence status', async () => {
    render(
      <BuddyListWithPresence />
    )

    await waitFor(() => {
      // There will be multiple buddy-item-list elements (one per presence group)
      const buddyLists = screen.getAllByTestId('buddy-item-list')
      expect(buddyLists.length).toBeGreaterThan(0)
    })

    // Should show presence sections - the component renders status labels like "online (1)" or "away (1)"
    expect(screen.getByText(/online/i)).toBeInTheDocument()
    expect(screen.getByText(/away/i)).toBeInTheDocument()
  })

  it('renders pending requests section when requests exist', async () => {
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: { buddyList: mockBuddies },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      if (query === GET_ROSTER) {
        return {
          data: { roster: mockRosterWithPending.result.data.roster },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
    })

    render(<BuddyListWithPresence />)

    await waitFor(() => {
      expect(screen.getByText('Pending Requests')).toBeInTheDocument()
      expect(screen.getByText('Requester User')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('accepts buddy request when accept button is clicked', async () => {
    const setSnackbar = jest.fn()
    
    // Mock queries to return pending requests
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: { buddyList: [] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      if (query === GET_ROSTER) {
        return {
          data: { roster: mockRosterWithPending.result.data.roster },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
    })
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: { presenceMap: {} },
        setBuddyList: jest.fn(),
        setSnackbar,
      }
      return selector(state)
    })

    render(
      <BuddyListWithPresence />
    )

    await waitFor(() => {
      expect(screen.getByText('Requester User')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Find accept button (Check icon)
    const acceptButtons = screen.getAllByTitle('Accept')
    if (acceptButtons.length > 0) {
      fireEvent.click(acceptButtons[0])

      await waitFor(() => {
        expect(mockAcceptBuddy).toHaveBeenCalledWith('req1')
        expect(setSnackbar).toHaveBeenCalledWith(
          expect.objectContaining({
            open: true,
            message: 'Buddy request accepted!',
            type: 'success',
          })
        )
      })
    }
  })

  it('declines buddy request when decline button is clicked', async () => {
    const setSnackbar = jest.fn()
    
    // Mock queries to return pending requests
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: { buddyList: [] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      if (query === GET_ROSTER) {
        return {
          data: { roster: mockRosterWithPending.result.data.roster },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
    })
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: { presenceMap: {} },
        setBuddyList: jest.fn(),
        setSnackbar,
      }
      return selector(state)
    })

    render(
      <BuddyListWithPresence />
    )

    await waitFor(() => {
      expect(screen.getByText('Requester User')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Find decline button (X icon)
    const declineButtons = screen.getAllByTitle('Decline')
    if (declineButtons.length > 0) {
      fireEvent.click(declineButtons[0])

      await waitFor(() => {
        expect(mockDeclineBuddy).toHaveBeenCalledWith('req1')
        expect(setSnackbar).toHaveBeenCalledWith(
          expect.objectContaining({
            open: true,
            message: 'Buddy request declined',
            type: 'info',
          })
        )
      })
    }
  })

  it('filters buddies by search query', async () => {
    // Search for "Buddy" which should match both buddies (they have names "Buddy One" and "Buddy Two")
    render(<BuddyListWithPresence search="Buddy" />)

    await waitFor(() => {
      // When filtering, if there are matches, buddy-item-list will be rendered
      // The component filters by Text field (name || username)
      const buddyLists = screen.queryAllByTestId('buddy-item-list')
      // We should have at least one section with filtered results
      expect(buddyLists.length).toBeGreaterThan(0)
    })

    // Verify that the filtered results are shown
    const buddyLists = screen.getAllByTestId('buddy-item-list')
    expect(buddyLists.length).toBeGreaterThan(0)
  })

  it('handles accept buddy errors gracefully', async () => {
    const setSnackbar = jest.fn()
    mockAcceptBuddy.mockRejectedValueOnce(new Error('Failed to accept'))

    // Mock queries to return pending requests
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: { buddyList: [] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      if (query === GET_ROSTER) {
        return {
          data: { roster: mockRosterWithPending.result.data.roster },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: { presenceMap: {} },
        setBuddyList: jest.fn(),
        setSnackbar,
      }
      return selector(state)
    })

    render(
      <BuddyListWithPresence />
    )

    await waitFor(() => {
      expect(screen.getByText('Requester User')).toBeInTheDocument()
    }, { timeout: 3000 })

    const acceptButtons = screen.getAllByTitle('Accept')
    if (acceptButtons.length > 0) {
      fireEvent.click(acceptButtons[0])

      await waitFor(() => {
        expect(setSnackbar).toHaveBeenCalledWith(
          expect.objectContaining({
            open: true,
            type: 'danger',
          })
        )
      })
    }
  })

  it('syncs buddy list to store when data is loaded', async () => {
    const setBuddyList = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: { presenceMap: {} },
        setBuddyList,
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })

    render(
      <BuddyListWithPresence />
    )

    await waitFor(() => {
      expect(setBuddyList).toHaveBeenCalledWith(mockBuddies)
    })
  })
})
