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
import { toast } from 'sonner'

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }),
}))

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
  default: ({ buddyList }: { buddyList: Array<{ statusMessage?: string }> }) => (
    <div
      data-testid="buddy-item-list"
      data-messages={buddyList.map((buddy) => buddy.statusMessage ?? '').join('|')}
    >
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

const mockBuddyListEntries = [
  {
    user: {
      _id: 'user2',
      username: 'buddy1',
      name: 'Buddy One',
      avatar: 'https://example.com/avatar1.jpg',
    },
    presence: { status: 'online' },
  },
  {
    user: {
      _id: 'user3',
      username: 'buddy2',
      name: 'Buddy Two',
      avatar: 'https://example.com/avatar2.jpg',
    },
    presence: { status: 'away' },
  },
]

const mockRosterEntries = [
  {
    _id: 'roster1',
    userId: 'user2',
    buddyId: 'user1',
    status: 'accepted',
    initiatedBy: 'user2',
    buddy: { _id: 'user2', username: 'buddy1', avatar: null },
  },
]

const mockPendingRosterEntries = [
  {
    _id: 'req1',
    userId: 'user4',
    buddyId: 'user1',
    status: 'pending',
    initiatedBy: 'user4',
    buddy: {
      _id: 'user4',
      username: 'requester',
      name: 'Requester User',
      avatar: 'https://example.com/avatar3.jpg',
    },
  },
]

describe('BuddyListWithPresence', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useQuery to return buddy list data by default
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: { getBuddyList: mockBuddyListEntries },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
                                }
      if (query === GET_ROSTER) {
        return {
          data: { getRoster: mockRosterEntries },
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

    // Should show presence sections - the component renders status labels like "Available (1)" or "Away (1)"
    expect(screen.getByText(/available/i)).toBeInTheDocument()
    expect(screen.getByText(/away/i)).toBeInTheDocument()
    // "Online" was renamed "Available" everywhere (#468)
    expect(screen.queryByText(/online/i)).not.toBeInTheDocument()
  })

  it('renders pending requests section when requests exist', async () => {
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: { getBuddyList: mockBuddyListEntries },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      if (query === GET_ROSTER) {
        return {
          data: { getRoster: mockPendingRosterEntries },
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
          data: { getBuddyList: [] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      if (query === GET_ROSTER) {
        return {
          data: { getRoster: mockPendingRosterEntries },
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
        expect(toast.success).toHaveBeenCalledWith('Buddy request accepted!')
      })
    }
  })

  it('declines buddy request when decline button is clicked', async () => {
    const setSnackbar = jest.fn()

    // Mock queries to return pending requests
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: { getBuddyList: [] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      if (query === GET_ROSTER) {
        return {
          data: { getRoster: mockPendingRosterEntries },
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
        expect(toast).toHaveBeenCalledWith('Buddy request declined')
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

  it('finds a buddy by @username as well as by name (#531)', async () => {
    const { rerender } = render(<BuddyListWithPresence search="@buddy2" />)

    expect(await screen.findByText('1 buddies')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Away (1)' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /available/i })).not.toBeInTheDocument()

    rerender(<BuddyListWithPresence search="buddy one" />)
    expect(await screen.findByRole('heading', { name: 'Available (1)' })).toBeInTheDocument()
  })

  it('lists an Invisible buddy as Offline, with no status message (#468)', async () => {
    // Invisible is the default status, so it must not drop the buddy from the list.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: {
          presenceMap: {
            user2: { status: 'invisible', statusMessage: 'Secret plans', lastSeen: null },
            user3: { status: 'away', statusMessage: '', lastSeen: null },
          },
        },
        setBuddyList: jest.fn(),
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })

    render(<BuddyListWithPresence />)

    expect(await screen.findByRole('heading', { name: 'Offline (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Away (1)' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /invisible/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /available/i })).not.toBeInTheDocument()
    const messages = screen.getAllByTestId('buddy-item-list').map((el) => el.dataset.messages)
    expect(messages.join('|')).not.toContain('Secret plans')
  })

  it('says so when no buddy matches the search', async () => {
    render(<BuddyListWithPresence search="@nobody" />)
    expect(await screen.findByTestId('buddy-empty-search')).toHaveTextContent('No buddies match “@nobody”.')
  })

  it('marks the Away section with a distinct yellow (#531)', async () => {
    render(<BuddyListWithPresence />)
    const heading = await screen.findByRole('heading', { name: 'Away (1)' })
    expect(heading.className).toContain('text-[#854d0e]')
    expect(heading.previousElementSibling?.className).toContain('bg-[#facc15]')
  })

  it('uses theme colours, so the list is readable in dark mode', async () => {
    const { container } = render(<BuddyListWithPresence />)
    await screen.findAllByTestId('buddy-item-list')
    expect(container.querySelector('.bg-white, .bg-gray-50, .text-gray-500')).toBeNull()
  })

  it('names the Accept and Decline buttons after the person', async () => {
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return { data: { getBuddyList: mockBuddyListEntries }, loading: false, refetch: jest.fn() }
      }
      if (query === GET_ROSTER) {
        return { data: { getRoster: mockPendingRosterEntries }, loading: false, refetch: jest.fn() }
      }
      return { data: undefined, loading: false, refetch: jest.fn() }
    })
    render(<BuddyListWithPresence />)
    expect(await screen.findByRole('button', { name: 'Accept Requester User' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decline Requester User' })).toBeInTheDocument()
  })

  it('handles accept buddy errors gracefully', async () => {
    const setSnackbar = jest.fn()
    mockAcceptBuddy.mockRejectedValueOnce(new Error('Failed to accept'))

    // Mock queries to return pending requests
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: { getBuddyList: [] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      if (query === GET_ROSTER) {
        return {
          data: { getRoster: mockPendingRosterEntries },
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
        expect(toast.error).toHaveBeenCalledWith(expect.any(String))
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
      expect(setBuddyList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ buddyId: 'user2', status: 'accepted' }),
          expect.objectContaining({ buddyId: 'user3', status: 'accepted' }),
        ])
      )
    })
  })
})
