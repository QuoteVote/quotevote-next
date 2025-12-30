/**
 * PostChatMessage Component Tests
 * 
 * Tests for the PostChatMessage component including:
 * - Message rendering
 * - Reactions display
 * - Delete functionality
 * - Profile navigation
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import PostChatMessage from '@/components/PostChat/PostChatMessage'
import { useAppStore } from '@/store'
import type { PostChatMessageProps } from '@/types/postChat'

// Mock Zustand store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// Mock useQuery and useMutation from Apollo Client
const mockUseQuery = jest.fn()
const mockMutate = jest.fn().mockResolvedValue({ data: { deleteMessage: { _id: 'msg1' } } })
const mockUseMutation = jest.fn((_mutation: unknown, _options?: unknown) => [mockMutate, { loading: false, error: null }])
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (query: unknown, options?: unknown) => mockUseQuery(query, options),
  useMutation: (mutation: unknown, options?: unknown) => mockUseMutation(mutation, options),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock Avatar component
jest.mock('@/components/Avatar', () => ({
  __esModule: true,
  default: ({ src, alt, size, onClick, className }: { 
    src?: string; 
    alt: string; 
    size: number;
    onClick?: () => void;
    className?: string;
  }) => (
    <div 
      data-testid="avatar" 
      data-src={src} 
      data-alt={alt} 
      data-size={size}
      onClick={onClick}
      className={className}
    >
      Avatar
    </div>
  ),
}))

// Mock PostChatReactions
jest.mock('@/components/PostChat/PostChatReactions', () => ({
  __esModule: true,
  default: ({ messageId }: { messageId: string }) => (
    <div data-testid="post-chat-reactions">Reactions for {messageId}</div>
  ),
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

const mockCurrentUser = {
  _id: 'user1',
  name: 'Current User',
  username: 'currentuser',
  admin: false,
}

const mockMessage: PostChatMessageProps['message'] = {
  _id: 'msg1',
  userId: 'user2',
  text: 'Test message',
  created: new Date().toISOString(),
  user: {
    name: 'Other User',
    username: 'otheruser',
    avatar: 'https://example.com/avatar.jpg',
  },
}

const mockOwnMessage: PostChatMessageProps['message'] = {
  ...mockMessage,
  _id: 'msg2',
  userId: 'user1',
  user: {
    name: 'Current User',
    username: 'currentuser',
    avatar: 'https://example.com/avatar1.jpg',
  },
}

// Mock query/mutation objects for reference (not used directly but kept for documentation)
// const mockGetReactionsQuery = {
//   request: {
//     query: GET_MESSAGE_REACTIONS,
//     variables: { messageId: 'msg1' },
//   },
//   result: {
//     data: {
//       messageReactions: [],
//     },
//   },
// }

// const mockDeleteMutation = {
//   request: {
//     query: DELETE_MESSAGE,
//     variables: { messageId: 'msg1' },
//   },
//   result: {
//     data: {
//       deleteMessage: {
//         _id: 'msg1',
//       },
//     },
//   },
// }

describe('PostChatMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutate.mockClear()
    mockMutate.mockResolvedValue({ data: { deleteMessage: { _id: 'msg1' } } })
    mockUseMutation.mockReturnValue([mockMutate, { loading: false, error: null }])

    // Mock useQuery to return reactions data
    mockUseQuery.mockReturnValue({
      data: { messageReactions: [] },
      loading: false,
      error: undefined,
    })

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

  it('renders message text', () => {
    render(<PostChatMessage message={mockMessage} />)

    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders avatar', () => {
    render(
      <PostChatMessage message={mockMessage} />)

    expect(screen.getByTestId('avatar')).toBeInTheDocument()
  })

  it('renders reactions component', () => {
    render(
      <PostChatMessage message={mockMessage} />)

    expect(screen.getByTestId('post-chat-reactions')).toBeInTheDocument()
  })

  it('displays delete button for own messages', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setSnackbar: jest.fn(),
      }
      return selector(state)
    })

    render(
      <PostChatMessage message={mockOwnMessage} />)

    const messageContainer = screen.getByText('Test message').closest('.group')
    if (messageContainer) {
      fireEvent.mouseEnter(messageContainer)
    }

    const deleteButton = screen.queryByLabelText('Delete message')
    expect(deleteButton).toBeInTheDocument()
  })

  it('does not display delete button for other user messages', () => {
    render(
      <PostChatMessage message={mockMessage} />)

    const deleteButton = screen.queryByLabelText('Delete message')
    expect(deleteButton).not.toBeInTheDocument()
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

    render(
      <PostChatMessage message={mockOwnMessage} />)

    const messageContainer = screen.getByText('Test message').closest('.group')
    if (messageContainer) {
      fireEvent.mouseEnter(messageContainer)
    }

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
    // Mock mutation to reject
    mockMutate.mockRejectedValueOnce(new Error('Failed to delete message'))
    mockUseMutation.mockReturnValueOnce([mockMutate, { loading: false, error: null }])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setSnackbar,
      }
      return selector(state)
    })

    render(<PostChatMessage message={mockOwnMessage} />)

    const messageContainer = screen.getByText('Test message').closest('.group')
    if (messageContainer) {
      fireEvent.mouseEnter(messageContainer)
    }

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

  it('navigates to profile when avatar is clicked', () => {
    const mockPush = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    })

    render(
      <PostChatMessage message={mockMessage} />)

    const avatar = screen.getByTestId('avatar')
    fireEvent.click(avatar)

    expect(mockPush).toHaveBeenCalledWith('/Profile/otheruser')
  })

  it('renders with correct styling for default direction', () => {
    render(<PostChatMessage message={mockMessage} />)

    const messageText = screen.getByText('Test message')
    const outerContainer = messageText.closest('.mb-3.flex')
    expect(outerContainer).toHaveClass('flex-row')
  })

  it('renders with correct styling for own messages', () => {
    render(<PostChatMessage message={mockOwnMessage} />)

    const messageText = screen.getByText('Test message')
    const outerContainer = messageText.closest('.mb-3.flex')
    expect(outerContainer).toHaveClass('flex-row-reverse')
  })
})

