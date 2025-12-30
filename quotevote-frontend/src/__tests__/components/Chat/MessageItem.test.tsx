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

// Mock Zustand store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// Mock useMutation from Apollo Client
const mockMutate = jest.fn().mockResolvedValue({ data: { deleteMessage: { _id: 'msg1' } } })
const mockUseMutation = jest.fn((_mutation: unknown, _options?: unknown) => [mockMutate, { loading: false, error: null }])
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useMutation: (mutation: unknown, options?: unknown) => mockUseMutation(mutation, options),
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

  it('renders own message with correct styling', () => {
    render(<MessageItem message={mockOwnMessage} />)

    expect(screen.getByText('My message')).toBeInTheDocument()
    // Own messages should be right-aligned
    const messageContainer = screen.getByText('My message').closest('div')
    // The justify-end class is on the direct parent div
    expect(messageContainer?.closest('.justify-end')).toBeInTheDocument()
  })

  it('renders other user message with correct styling', () => {
    render(<MessageItem message={mockOtherMessage} />)

    expect(screen.getByText('Other message')).toBeInTheDocument()
    // Other messages should be left-aligned
    const messageContainer = screen.getByText('Other message').closest('div')
    // The justify-start class is on the direct parent div
    expect(messageContainer?.closest('.justify-start')).toBeInTheDocument()
  })

  it('displays sender name for other user messages', () => {
    render(<MessageItem message={mockOtherMessage} />)

    expect(screen.getByText('Other User')).toBeInTheDocument()
  })

  it('does not display sender name for own messages', () => {
    render(<MessageItem message={mockOwnMessage} />)

    expect(screen.queryByText('Current User')).not.toBeInTheDocument()
  })

  it('displays avatar for other user messages on the left', () => {
    render(<MessageItem message={mockOtherMessage} />)

    const avatars = screen.getAllByTestId('avatar')
    expect(avatars.length).toBeGreaterThan(0)
  })

  it('displays avatar for own messages on the right', () => {
    render(<MessageItem message={mockOwnMessage} />)

    const avatars = screen.getAllByTestId('avatar')
    expect(avatars.length).toBeGreaterThan(0)
  })

  it('displays read indicator for own messages when read', () => {
    render(<MessageItem message={mockOwnMessage} />)

    // Check for double check icon (read indicator) - CheckCheck icon
    // SVGs don't have img role by default, so we look for the CheckCheck icon by class or testid
    const checkIcon = document.querySelector('.lucide-check-check')
    expect(checkIcon).toBeInTheDocument()
  })

  it('displays unread indicator for own messages when not read', () => {
    const unreadMessage = {
      ...mockOwnMessage,
      readBy: [],
    }

    render(<MessageItem message={unreadMessage} />)

    // Should show single check (unread)
    expect(screen.getByText('My message')).toBeInTheDocument()
  })

  it('displays timestamp', () => {
    render(<MessageItem message={mockOwnMessage} />)

    // Timestamp should be displayed (format may vary)
    expect(screen.getByText(/Just now|m ago|ago/i)).toBeInTheDocument()
  })

  it('shows delete button on hover for own messages', () => {
    render(<MessageItem message={mockOwnMessage} />)

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

    render(<MessageItem message={mockOwnMessage} />)

    const deleteButton = screen.getByLabelText('Delete message')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(setSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
          message: 'Message deleted successfully',
          type: 'success',
        })
      )
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

    render(<MessageItem message={mockOwnMessage} />)

    const deleteButton = screen.getByLabelText('Delete message')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(setSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
          type: 'danger',
        })
      )
    })
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

    render(<MessageItem message={messageWithoutUser} />)

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

