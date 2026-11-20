/**
 * MessageItem Component Tests
 * 
 * Tests for the MessageItem component including:
 * - Message rendering (own vs other user messages)
 * - Read state indicators
 * - Delete functionality
 * - Avatar and timestamp display
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import MessageItem from '@/components/Chat/MessageItem'
import { useAppStore } from '@/store'
import type { ChatMessage } from '@/types/chat'
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

// Mock useMutation from Apollo Client
const mockMutate = jest.fn().mockResolvedValue({ data: { deleteMessage: { _id: 'msg1' } } })
const mockUseMutation = jest.fn(() => [mockMutate, { loading: false, error: null }])
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useMutation: () => mockUseMutation(),
}))

// Mock Avatar component
jest.mock('@/components/Avatar', () => ({
  __esModule: true,
  default: ({ src, alt, size }: { src?: string; alt: string; size: number }) => (
    <div data-testid="avatar" data-src={src} data-alt={alt} data-size={size}>
      Avatar
    </div>
  ),
}))

// Mock DisplayAvatar component (used by MessageItem)
jest.mock('@/components/DisplayAvatar', () => ({
  __esModule: true,
  DisplayAvatar: ({ username, size }: { avatar?: unknown; username: string; size: number; className?: string }) => (
    <div data-testid="avatar" data-username={username} data-size={size}>
      DisplayAvatar
    </div>
  ),
}))

jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: () => () => true,
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

const mockCurrentUser = {
  _id: 'user1',
  name: 'Current User',
  username: 'currentuser',
}


const mockOwnMessage: ChatMessage & { user?: { _id?: string; name?: string; username?: string; avatar?: string } } = {
  _id: 'msg1',
  messageRoomId: 'room1',
  userId: 'user1',
  userName: 'Current User',
  text: 'My message',
  created: new Date().toISOString(),
  type: 'USER',
  user: {
    _id: 'user1',
    name: 'Current User',
    username: 'currentuser',
    avatar: 'https://example.com/avatar1.jpg',
  },
  readBy: ['user2'],
}

const mockOtherMessage: ChatMessage & { user?: { _id?: string; name?: string; username?: string; avatar?: string } } = {
  _id: 'msg2',
  messageRoomId: 'room1',
  userId: 'user2',
  userName: 'Other User',
  text: 'Other message',
  created: new Date().toISOString(),
  type: 'USER',
  user: {
    _id: 'user2',
    name: 'Other User',
    username: 'otheruser',
    avatar: 'https://example.com/avatar2.jpg',
  },
  readBy: [],
}

// Mock mutation object for reference (not used directly but kept for documentation)
// const mockDeleteMutation = {
//   request: {
//     query: DELETE_MESSAGE,
//     variables: { messageId: 'msg1' },
//   },
//   result: {
//     data: {
//       deleteMessage: {
//         success: true,
//       },
//     },
//   },
// }

describe('MessageItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutate.mockClear()
    mockMutate.mockResolvedValue({ data: { deleteMessage: { _id: 'msg1' } } })
    mockUseMutation.mockReturnValue([mockMutate, { loading: false, error: null }])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: mockCurrentUser,
        },
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })
  })

  it('renders own message as a row marked mine', () => {
    render(<MessageItem message={mockOwnMessage} />)

    expect(screen.getByText('My message')).toBeInTheDocument()
    const row = screen.getByTestId('message-item-msg1')
    expect(row).toHaveClass('qv-bubble-row')
    expect(row).toHaveAttribute('data-mine', 'true')
  })

  it('renders other user message as a row not marked mine', () => {
    render(<MessageItem message={mockOtherMessage} />)

    expect(screen.getByText('Other message')).toBeInTheDocument()
    const row = screen.getByTestId('message-item-msg2')
    expect(row).toHaveClass('qv-bubble-row')
    expect(row).not.toHaveAttribute('data-mine')
  })

  it('displays sender name inside the bubble for other user messages in a post chat', () => {
    render(<MessageItem message={mockOtherMessage} roomType="POST" />)

    const name = screen.getByText('Other User')
    expect(name.closest('.qv-bubble')).toBeInTheDocument()
  })

  it('does not display sender name in a direct message', () => {
    render(<MessageItem message={mockOtherMessage} roomType="USER" />)

    expect(screen.queryByText('Other User')).not.toBeInTheDocument()
  })

  it('does not display sender name for own messages', () => {
    render(<MessageItem message={mockOwnMessage} />)

    expect(screen.queryByText('Current User')).not.toBeInTheDocument()
  })

  it('displays a 32px avatar for other user messages', () => {
    render(<MessageItem message={mockOtherMessage} />)

    const avatar = screen.getByTestId('avatar')
    expect(avatar).toHaveAttribute('data-size', '32')
  })

  it('does not display an avatar or profile link for own messages', () => {
    render(<MessageItem message={mockOwnMessage} />)

    expect(screen.queryByTestId('avatar')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders profile link on other user avatar', () => {
    render(<MessageItem message={mockOtherMessage} />)

    const profileLink = screen.getByRole('link', { name: 'Open otheruser profile' })
    expect(profileLink).toHaveAttribute('href', '/profile/otheruser')
  })

  it('displays read indicator for own messages when read', () => {
    render(<MessageItem message={mockOwnMessage} />)

    // Check for double check icon (read indicator) - CheckCheck icon
    // SVGs don't have img role by default, so we look for the CheckCheck icon by class or testid
    const checkIcon = document.querySelector('.lucide-check-check')
    expect(checkIcon).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Read' })).toBeInTheDocument()
  })

  it('displays unread indicator for own messages when not read', () => {
    const unreadMessage = {
      ...mockOwnMessage,
      readBy: [],
    }

    render(<MessageItem message={unreadMessage} />)

    // Should show single check (sent, not read)
    expect(screen.getByText('My message')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Sent' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Read' })).not.toBeInTheDocument()
  })

  it('shows no time or read state on other user messages', () => {
    render(<MessageItem message={mockOtherMessage} />)

    expect(screen.queryByRole('img', { name: /Read|Sent/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Just now|m ago/i)).not.toBeInTheDocument()
  })

  it('displays timestamp', () => {
    render(<MessageItem message={mockOwnMessage} />)

    // Timestamp should be displayed (format may vary)
    expect(screen.getByText(/Just now|m ago|ago/i)).toBeInTheDocument()
  })

  it('shows delete button on hover for own messages in a post chat', () => {
    render(<MessageItem message={mockOwnMessage} roomType="POST" />)

    const messageContainer = screen.getByText('My message').closest('.group')
    if (messageContainer) {
      fireEvent.mouseEnter(messageContainer)
    }

    // Delete button should be available (may need to check for aria-label)
    const deleteButton = screen.queryByLabelText('Delete message')
    // Button exists but may be hidden until hover
    expect(deleteButton).toBeInTheDocument()
  })

  it('deletes message when delete button is clicked', async () => {
    const setSnackbar = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setSnackbar,
      }
      return selector(state)
    })

    // Reset mock for this test
    mockMutate.mockResolvedValueOnce({ data: { deleteMessage: { _id: 'msg1' } } })

    render(<MessageItem message={mockOwnMessage} roomType="POST" />)

    const deleteButton = screen.getByLabelText('Delete message')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Message deleted successfully')
    })
  })

  it('handles delete errors gracefully', async () => {
    const setSnackbar = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setSnackbar,
      }
      return selector(state)
    })

    // Mock mutation to throw error
    mockMutate.mockRejectedValueOnce(new Error('Failed to delete message'))

    render(<MessageItem message={mockOwnMessage} roomType="POST" />)

    const deleteButton = screen.getByLabelText('Delete message')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Delete Error'))
    })
  })

  it('never offers delete on a direct message, even your own', () => {
    render(<MessageItem message={mockOwnMessage} roomType="USER" />)
    expect(screen.queryByLabelText('Delete message')).not.toBeInTheDocument()
  })

  it("doesn't offer delete to an admin on someone else's message", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) =>
      selector({ user: { data: { ...mockCurrentUser, admin: true } } })
    )
    render(<MessageItem message={mockOtherMessage} roomType="POST" />)
    expect(screen.queryByLabelText('Delete message')).not.toBeInTheDocument()
  })

  it('shows a deleted message as a note, without delete', () => {
    render(
      <MessageItem
        message={{ ...mockOwnMessage, text: 'Message deleted by its author', deleted: true }}
        roomType="POST"
      />
    )
    expect(
      screen.getByText('Message deleted by its author').closest('.qv-bubble')
    ).toHaveAttribute('data-deleted', 'true')
    expect(screen.queryByLabelText('Delete message')).not.toBeInTheDocument()
  })

  it('keeps the delete button reachable by keyboard, not only on hover', () => {
    render(<MessageItem message={mockOwnMessage} roomType="POST" />)
    const deleteButton = screen.getByRole('button', { name: 'Delete message' })
    // The wrap reveals it on :focus-within as well as :hover (globals.css).
    expect(deleteButton.closest('.qv-bubble-wrap')).toBeInTheDocument()
    expect(deleteButton).not.toHaveAttribute('tabindex', '-1')
  })

  it('does not show delete button for other user messages', () => {
    render(<MessageItem message={mockOtherMessage} />)

    const deleteButton = screen.queryByLabelText('Delete message')
    expect(deleteButton).not.toBeInTheDocument()
  })

  it('handles missing user data gracefully', () => {
    const messageWithoutUser = {
      ...mockOtherMessage,
      user: undefined,
    }

    render(<MessageItem message={messageWithoutUser} roomType="POST" />)

    expect(screen.getByText('Other message')).toBeInTheDocument()
    expect(screen.getByText('Other User')).toBeInTheDocument() // Uses userName
  })

  it('handles missing avatar gracefully', () => {
    const messageWithoutAvatar = {
      ...mockOtherMessage,
      user: {
        ...mockOtherMessage.user!,
        avatar: undefined,
      },
    }

    render(<MessageItem message={messageWithoutAvatar} />)

    expect(screen.getByText('Other message')).toBeInTheDocument()
  })

  it('returns null when no current user', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: null },
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })

    const { container } = render(<MessageItem message={mockOwnMessage} />)

    expect(container.firstChild).toBeNull()
  })
})
