/**
 * MessageBox Component Tests
 * 
 * Tests for the MessageBox component including:
 * - Room selection and display
 * - Header actions (back, block, remove buddy, delete chat)
 * - Message rendering integration
 * - Loading and error states
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import MessageBox from '@/components/Chat/MessageBox'
import { useAppStore } from '@/store'
import { GET_CHAT_ROOMS, GET_ROSTER } from '@/graphql/queries'
import type { ChatRoom } from '@/types/chat'

// Mock Zustand store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// Mock useGuestGuard
jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: jest.fn(() => () => true),
}))

// Mock useQuery from Apollo Client
const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

// Mock useRosterManagement
jest.mock('@/hooks/useRosterManagement', () => ({
  useRosterManagement: jest.fn(() => ({
    blockBuddy: jest.fn().mockResolvedValue({}),
    unblockBuddy: jest.fn().mockResolvedValue({}),
    removeBuddy: jest.fn().mockResolvedValue({}),
  })),
}))

// Mock child components
jest.mock('@/components/Chat/MessageItemList', () => ({
  __esModule: true,
  default: ({ room }: { room: ChatRoom | null }) => (
    <div data-testid="message-item-list">
      {room ? `Messages for room: ${room._id}` : 'No room'}
    </div>
  ),
}))

jest.mock('@/components/Chat/MessageSend', () => ({
  __esModule: true,
  default: ({ messageRoomId }: { messageRoomId?: string | null }) => (
    <div data-testid="message-send">
      Message send for room: {messageRoomId || 'none'}
    </div>
  ),
}))

jest.mock('@/components/Chat/TypingIndicator', () => ({
  __esModule: true,
  default: ({ messageRoomId }: { messageRoomId?: string | null }) => (
    <div data-testid="typing-indicator">
      Typing indicator for room: {messageRoomId || 'none'}
    </div>
  ),
}))

// Mock DropdownMenu components
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => 
    asChild ? <>{children}</> : <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div data-testid="dropdown-item" onClick={onClick}>{children}</div>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

const mockRoom: ChatRoom = {
  _id: 'room1',
  title: 'Test Chat',
  messageType: 'USER',
  users: ['user1', 'user2'],
  created: new Date().toISOString(),
  avatar: 'https://example.com/avatar.jpg',
}

const mockCurrentUser = {
  _id: 'user1',
  name: 'Current User',
  username: 'currentuser',
}

// Mock query objects for reference (not used directly but kept for documentation)
// const mockChatRoomsQuery = {
//   request: {
//     query: GET_CHAT_ROOMS,
//   },
//   result: {
//     data: {
//       messageRooms: [mockRoom],
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

describe('MessageBox', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useQuery to return rooms and roster data by default
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_CHAT_ROOMS) {
        return {
          data: { messageRooms: [mockRoom] },
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
          selectedRoom: 'room1',
          buddyList: [],
          presenceMap: {},
        },
        setSelectedChatRoom: jest.fn(),
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })
  })

  it('renders "No room selected" when no room is provided', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: { selectedRoom: null, buddyList: [], presenceMap: {} },
        setSelectedChatRoom: jest.fn(),
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })

    render(<MessageBox />)

    expect(screen.getByText('No room selected')).toBeInTheDocument()
  })

  it('renders room header with correct title and avatar', async () => {
    render(<MessageBox />)

    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument()
    })

    expect(screen.getByText('Direct Message')).toBeInTheDocument()
  })

  it('renders back button and calls setSelectedChatRoom when clicked', async () => {
    const setSelectedChatRoom = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: { selectedRoom: 'room1', buddyList: [], presenceMap: {} },
        setSelectedChatRoom,
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })

    render(<MessageBox />)

    await waitFor(() => {
      expect(screen.getByLabelText('Back to conversations')).toBeInTheDocument()
    })

    const backButton = screen.getByLabelText('Back to conversations')
    fireEvent.click(backButton)

    expect(setSelectedChatRoom).toHaveBeenCalledWith(null)
  })

  it('renders MessageItemList and MessageSend components when room is selected', async () => {
    render(<MessageBox />)

    await waitFor(() => {
      expect(screen.getByTestId('message-item-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('message-send')).toBeInTheDocument()
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })

  it('renders settings menu with block, remove buddy, and delete options for USER rooms', async () => {
    render(<MessageBox />)

    await waitFor(() => {
      expect(screen.getByLabelText('Chat settings')).toBeInTheDocument()
    })

    const settingsButton = screen.getByLabelText('Chat settings')
    fireEvent.click(settingsButton)

    await waitFor(() => {
      // The dropdown content should be rendered
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
      expect(screen.getByText('Block User')).toBeInTheDocument()
      expect(screen.getByText('Remove Buddy')).toBeInTheDocument()
      expect(screen.getByText('Close Chat')).toBeInTheDocument()
    })
  })

  it('accepts roomOverride prop to override selected room', async () => {
    const overrideRoom: ChatRoom = {
      _id: 'room2',
      title: 'Override Room',
      messageType: 'USER',
      users: ['user1', 'user3'],
      created: new Date().toISOString(),
    }

    render(<MessageBox roomOverride={overrideRoom} />)

    await waitFor(() => {
      expect(screen.getByText('Override Room')).toBeInTheDocument()
    })
  })

  it('handles loading state while fetching rooms', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<MessageBox />)

    // Should show no room selected while loading
    expect(screen.getByText('No room selected')).toBeInTheDocument()
  })
})

