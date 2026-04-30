/**
 * ChatList Component Tests
 *
 * Tests for the ChatList component including:
 * - Rendering chat rooms (USER type direct messages)
 * - Rendering group rooms (POST type)
 * - Filtering by search query
 * - Filtering by filterType ('chats' vs 'groups')
 * - Loading state
 * - Empty state (no rooms found)
 * - Room selection (calls setSelectedChatRoom)
 * - Unread message badge
 * - Sorting by most recent activity
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import ChatList from '@/components/Chat/ChatList'
import { useAppStore } from '@/store'
import { GET_CHAT_ROOMS } from '@/graphql/queries'

// ─── Apollo mocks ──────────────────────────────────────────────────────────
const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

// ─── Zustand store mock ────────────────────────────────────────────────────
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// ─── Avatar mock ───────────────────────────────────────────────────────────
jest.mock('@/components/Avatar', () => ({
  __esModule: true,
  default: ({ src, alt }: { src?: string; alt: string }) => (
    <img data-testid="avatar" src={src} alt={alt} />
  ),
}))

// ─── DisplayAvatar mock (used by ChatList) ─────────────────────────────────
jest.mock('@/components/DisplayAvatar', () => ({
  __esModule: true,
  DisplayAvatar: ({ avatar, username }: { avatar?: string | Record<string, unknown>; username: string; size?: number; className?: string }) => {
    const src = typeof avatar === 'string' ? avatar : `https://avataaars.io/?seed=${username}`
    return <img data-testid="avatar" src={src} alt={`${username}'s avatar`} />
  },
}))

// ─── LoadingSpinner mock ───────────────────────────────────────────────────
jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: number }) => (
    <div data-testid="loading-spinner" data-size={size}>
      Loading...
    </div>
  ),
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

// ─── Test data ────────────────────────────────────────────────────────────

const dmRoom = {
  _id: 'room-dm-1',
  title: 'Jane Doe',
  messageType: 'USER',
  users: ['user1', 'user2'],
  created: new Date(Date.now() - 60_000).toISOString(),
  avatar: 'https://example.com/jane.jpg',
}

const groupRoom = {
  _id: 'room-group-1',
  title: 'Interesting Quote',
  messageType: 'POST',
  users: ['user1', 'user2', 'user3'],
  created: new Date(Date.now() - 120_000).toISOString(),
  postDetails: { _id: 'post1', title: 'Interesting Quote', text: 'Some post text here.' },
  avatar: null,
}

const dmRoomWithUnread = {
  ...dmRoom,
  _id: 'room-dm-2',
  title: 'Unread Chat',
  unreadMessages: 5,
}

// ─── beforeEach default setup ─────────────────────────────────────────────

describe('ChatList', () => {
  const mockSetSelectedChatRoom = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        chat: { selectedRoom: null },
        setSelectedChatRoom: mockSetSelectedChatRoom,
      }
      return selector(state)
    })

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_CHAT_ROOMS) {
        return {
          data: { messageRooms: [dmRoom, groupRoom] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
    })
  })

  // ── Loading state ────────────────────────────────────────────────────────

  it('renders loading spinner when loading and no cached data', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  // ── DM (chats) filter ─────────────────────────────────────────────────────

  it('renders direct message rooms when filterType is "chats"', async () => {
    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    // Group room should NOT appear in the chats tab
    expect(screen.queryByText('Interesting Quote')).not.toBeInTheDocument()
  })

  it('shows DM badge label for USER rooms', async () => {
    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getAllByText('DM').length).toBeGreaterThan(0)
    })
  })

  // ── Group filter ──────────────────────────────────────────────────────────

  it('renders group rooms when filterType is "groups"', async () => {
    render(<ChatList filterType="groups" />)

    await waitFor(() => {
      expect(screen.getByText('Interesting Quote')).toBeInTheDocument()
    })

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
  })

  it('shows Group badge label for POST rooms', async () => {
    render(<ChatList filterType="groups" />)

    await waitFor(() => {
      expect(screen.getAllByText('Group').length).toBeGreaterThan(0)
    })
  })

  // ── Search filter ─────────────────────────────────────────────────────────

  it('filters rooms by search query (case-insensitive)', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [dmRoom, groupRoom] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" search="jane" />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
  })

  it('shows empty state when search matches nothing', async () => {
    render(<ChatList filterType="chats" search="zzznomatch" />)

    await waitFor(() => {
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
      // Empty state message
      expect(screen.getByText(/no chats found/i)).toBeInTheDocument()
    })
  })

  // ── Room selection ────────────────────────────────────────────────────────

  it('calls setSelectedChatRoom with room._id when a room is clicked', async () => {
    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    const roomButton = screen.getByText('Jane Doe').closest('button')!
    fireEvent.click(roomButton)

    expect(mockSetSelectedChatRoom).toHaveBeenCalledWith('room-dm-1')
  })

  // ── Selected room highlight ──────────────────────────────────────────────

  it('applies selected styling to the currently active room', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        chat: { selectedRoom: 'room-dm-1' },
        setSelectedChatRoom: mockSetSelectedChatRoom,
      }
      return selector(state)
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      const roomButton = screen.getByText('Jane Doe').closest('button')
      expect(roomButton?.className).toContain('border-[#52b274]')
    })
  })

  // ── Unread message badge ─────────────────────────────────────────────────

  it('renders unread count badge when a room has unread messages', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [dmRoomWithUnread] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('renders "99+" badge when unread count exceeds 99', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [{ ...dmRoomWithUnread, unreadMessages: 150 }] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument()
    })
  })

  it('does not render unread badge when unreadMessages is 0', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [{ ...dmRoom, unreadMessages: 0 }] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  // ── Empty state messages ─────────────────────────────────────────────────

  it('shows "No chats yet" heading when there are no chats', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('No chats yet')).toBeInTheDocument()
    })
  })

  it('shows "No groups yet" heading when there are no groups', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="groups" />)

    await waitFor(() => {
      expect(screen.getByText('No groups yet')).toBeInTheDocument()
    })
  })

  // ── Avatar rendering ──────────────────────────────────────────────────────

  it('renders an avatar image when the room has an avatar URL', async () => {
    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      const avatarImg = screen.getByTestId('avatar')
      expect(avatarImg).toBeInTheDocument()
      expect(avatarImg).toHaveAttribute('src', 'https://example.com/jane.jpg')
    })
  })

  it('renders a fallback icon when the room has no avatar', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        messageRooms: [{ ...dmRoom, avatar: null }],
      },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      // When no avatar, DisplayAvatar still renders a cartoon avatar image
      expect(screen.getByTestId('avatar')).toBeInTheDocument()
    })
  })

  // ── Query invocation ─────────────────────────────────────────────────────

  it('calls useQuery with GET_CHAT_ROOMS', () => {
    render(<ChatList filterType="chats" />)
    expect(mockUseQuery).toHaveBeenCalledWith(
      GET_CHAT_ROOMS,
      expect.objectContaining({ fetchPolicy: 'cache-and-network' })
    )
  })
})
