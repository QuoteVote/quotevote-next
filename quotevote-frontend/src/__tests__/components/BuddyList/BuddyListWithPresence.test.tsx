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
import { GET_BUDDY_LIST, GET_BUDDY_REQUESTS } from '@/graphql/queries'
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

// Mock useBuddyManagement
const mockAcceptBuddy = jest.fn().mockResolvedValue({})
const mockDeclineBuddy = jest.fn().mockResolvedValue({})
jest.mock('@/hooks/useBuddyManagement', () => ({
  useBuddyManagement: jest.fn(() => ({
        acceptBuddy: mockAcceptBuddy,
        declineBuddy: mockDeclineBuddy,
  })),
}))

// Mock BuddyItemList: one row per buddy, in the order given
jest.mock('@/components/BuddyList/BuddyItemList', () => ({
  __esModule: true,
  default: ({ buddyList }: { buddyList: { Text?: string; presence?: { status?: string } }[] }) => (
    <ul data-testid="buddy-item-list" data-count={buddyList.length}>
      {buddyList.map((b) => (
        <li key={b.Text} data-status={b.presence?.status}>
          {b.Text}
        </li>
      ))}
    </ul>
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

const mockOutgoingRequests = [
  {
    _id: 'req0',
    status: 'pending',
    requester: { _id: 'user1', username: 'currentuser' },
    recipient: { _id: 'user5', username: 'someone' },
  },
]

const mockPendingRequests = [
  {
    _id: 'req1',
    status: 'pending',
    requester: {
      _id: 'user4',
      username: 'requester',
      name: 'Requester User',
      avatar: 'https://example.com/avatar3.jpg',
    },
    recipient: { _id: 'user1', username: 'currentuser' },
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
      if (query === GET_BUDDY_REQUESTS) {
        return {
          data: { buddyRequests: mockOutgoingRequests },
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

  it('renders one flat buddy list in presence order, hiding invisible buddies', async () => {
    const entry = (id: string, name: string, status: string) => ({
      user: { _id: id, username: name.toLowerCase(), name },
      presence: { status },
    })
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BUDDY_LIST) {
        return {
          data: {
            getBuddyList: [
              entry('u-off', 'Olive', 'offline'),
              entry('u-dnd', 'Dana', 'dnd'),
              entry('u-inv', 'Ivan', 'invisible'),
              entry('u-away', 'Abe', 'away'),
              entry('u-on', 'Nina', 'online'),
            ],
          },
          loading: false,
          refetch: jest.fn(),
        }
      }
      return { data: { buddyRequests: [] }, loading: false, refetch: jest.fn() }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) =>
      selector({
        user: { data: mockCurrentUser },
        chat: { presenceMap: {} },
        setBuddyList: jest.fn(),
      })
    )

    render(<BuddyListWithPresence />)

    expect(await screen.findByTestId('buddy-list-with-presence')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Buddies · 4' })).toBeInTheDocument()
    const lists = screen.getAllByTestId('buddy-item-list')
    expect(lists).toHaveLength(1)
    const rows = Array.from(lists[0].querySelectorAll('li')).map((li) => li.textContent)
    expect(rows).toEqual(['Nina', 'Abe', 'Dana', 'Olive'])
    expect(screen.queryByText('Ivan')).not.toBeInTheDocument()
  })

  it('takes live presence from the store over the list query', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) =>
      selector({
        user: { data: mockCurrentUser },
        chat: { presenceMap: { user2: { status: 'offline' }, user3: { status: 'online' } } },
        setBuddyList: jest.fn(),
      })
    )

    render(<BuddyListWithPresence />)

    const list = await screen.findByTestId('buddy-item-list')
    const rows = Array.from(list.querySelectorAll('li')).map((li) => li.textContent)
    expect(rows).toEqual(['Buddy Two', 'Buddy One'])
  })

  it('says so when there are no buddies yet', async () => {
    mockUseQuery.mockImplementation((query) =>
      query === GET_BUDDY_LIST
        ? { data: { getBuddyList: [] }, loading: false, refetch: jest.fn() }
        : { data: { buddyRequests: [] }, loading: false, refetch: jest.fn() }
    )

    render(<BuddyListWithPresence />)

    expect(
      await screen.findByText('No buddies yet. Use Add buddy above to find someone.')
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Buddies · 0' })).toBeInTheDocument()
    expect(screen.queryByTestId('buddy-item-list')).not.toBeInTheDocument()
    expect(screen.queryByText(/Pending requests/)).not.toBeInTheDocument()
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
      if (query === GET_BUDDY_REQUESTS) {
        return {
          data: { buddyRequests: [...mockOutgoingRequests, ...mockPendingRequests] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
    })

    render(<BuddyListWithPresence />)

    expect(
      await screen.findByRole('heading', { name: 'Pending requests · 1' })
    ).toBeInTheDocument()
    expect(screen.getByText('Requester User')).toBeInTheDocument()
    expect(screen.getByText('Wants to be your buddy')).toBeInTheDocument()
    // My own outgoing request is not something I can accept
    expect(screen.queryByText('someone')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accept Requester User' })).toHaveTextContent(
      'Accept'
    )
    expect(screen.getByRole('button', { name: 'Decline Requester User' })).toHaveTextContent(
      'Decline'
    )
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
      if (query === GET_BUDDY_REQUESTS) {
        return {
          data: { buddyRequests: [...mockOutgoingRequests, ...mockPendingRequests] },
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

    fireEvent.click(screen.getByRole('button', { name: 'Accept Requester User' }))

    await waitFor(() => {
      expect(mockAcceptBuddy).toHaveBeenCalledWith('req1')
      expect(toast.success).toHaveBeenCalledWith('Buddy request accepted!')
    })
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
      if (query === GET_BUDDY_REQUESTS) {
        return {
          data: { buddyRequests: [...mockOutgoingRequests, ...mockPendingRequests] },
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

    fireEvent.click(screen.getByRole('button', { name: 'Decline Requester User' }))

    await waitFor(() => {
      expect(mockDeclineBuddy).toHaveBeenCalledWith('req1')
      expect(toast).toHaveBeenCalledWith('Buddy request declined')
    })
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
    expect(screen.getByTestId('buddy-item-list')).toHaveAttribute('data-count', '2')
    expect(screen.getByRole('heading', { name: 'Buddies · 2' })).toBeInTheDocument()
  })

  it('finds a buddy by @username as well as by name (#531)', async () => {
    const { rerender } = render(<BuddyListWithPresence search="@buddy2" />)

    expect(await screen.findByText('Buddy Two')).toBeInTheDocument()
    expect(screen.queryByText('Buddy One')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Buddies · 1' })).toBeInTheDocument()

    rerender(<BuddyListWithPresence search="buddy one" />)
    expect(await screen.findByText('Buddy One')).toBeInTheDocument()
    expect(screen.queryByText('Buddy Two')).not.toBeInTheDocument()
  })

  it('says so when no buddy matches the search', async () => {
    render(<BuddyListWithPresence search="@nobody" />)
    expect(await screen.findByTestId('buddy-empty-search')).toHaveTextContent('No buddies match “@nobody”.')
    // The "no buddies yet" hint is only for an empty list, not an empty search
    expect(screen.queryByText(/No buddies yet/)).not.toBeInTheDocument()
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
      if (query === GET_BUDDY_REQUESTS) {
        return { data: { buddyRequests: mockPendingRequests }, loading: false, refetch: jest.fn() }
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
      if (query === GET_BUDDY_REQUESTS) {
        return {
          data: { buddyRequests: [...mockOutgoingRequests, ...mockPendingRequests] },
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

    fireEvent.click(screen.getByRole('button', { name: 'Accept Requester User' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to accept')
    })
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
