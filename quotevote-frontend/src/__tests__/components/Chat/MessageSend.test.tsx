/**
 * MessageSend Component Tests
 * 
 * Tests for the MessageSend component including:
 * - Message input handling
 * - Send actions and mutations
 * - Blocking states and validation
 * - Typing indicator integration
 * - Error handling
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import MessageSend from '@/components/Chat/MessageSend'
import { useAppStore } from '@/store'
import { GET_ROSTER } from '@/graphql/queries'

// Mock useQuery and useMutation from Apollo Client
const mockUseQuery = jest.fn()
const mockMutate = jest.fn()
let mutationCallbacks: { onCompleted?: (data: unknown) => void; onError?: (error: Error) => void } = {}
const mockUseMutation = jest.fn((_mutation, options) => {
  // Store callbacks for later use
  mutationCallbacks = {
    onCompleted: options?.onCompleted,
    onError: options?.onError,
  }
  
  // Make mutate function call callbacks when invoked
  const mutateFn = async (mutateOptions?: { variables?: unknown }) => {
    try {
      const result = await mockMutate(mutateOptions)
      // Call onCompleted asynchronously to simulate Apollo behavior
      if (mutationCallbacks.onCompleted && result?.data) {
        // Use setTimeout to call in next tick
        setTimeout(() => {
          mutationCallbacks.onCompleted?.(result.data)
        }, 0)
      }
      return result
    } catch (error) {
      // Call onError asynchronously to simulate Apollo behavior
      if (mutationCallbacks.onError && error instanceof Error) {
        // Use setTimeout to call in next tick
        setTimeout(() => {
          mutationCallbacks.onError?.(error)
        }, 0)
      }
      throw error
    }
  }
  
  return [mutateFn, { loading: false, error: null }]
})
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (query: unknown, options?: unknown) => mockUseQuery(query, options),
  useMutation: (mutation: unknown, options?: unknown) => mockUseMutation(mutation, options),
}))

// Mock Zustand store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// Mock useGuestGuard
jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: jest.fn(() => () => true),
}))

// Mock useTypingIndicator
const mockHandleTyping = jest.fn()
const mockStopTyping = jest.fn()
jest.mock('@/hooks/useTypingIndicator', () => ({
  useTypingIndicator: jest.fn(() => ({
    handleTyping: mockHandleTyping,
    stopTyping: mockStopTyping,
  })),
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

const mockCurrentUser = {
  _id: 'user1',
  name: 'Test User',
  username: 'testuser',
  avatar: 'https://example.com/avatar.jpg',
}


describe('MessageSend', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHandleTyping.mockClear()
    mockStopTyping.mockClear()
    mockMutate.mockClear()
    mutationCallbacks = {}
    mockMutate.mockResolvedValue({ data: { createMessage: { _id: 'msg1', messageRoomId: 'room1' } } })

    // Mock useQuery to return roster data by default
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_ROSTER) {
        return {
          data: { roster: { buddies: [], pendingRequests: [], blockedUsers: [] } },
          loading: false,
          error: undefined,
        }
      }
      return { data: undefined, loading: false, error: undefined }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: mockCurrentUser,
        },
        chat: {
          selectedRoom: {
            room: {
              users: ['user1', 'user2'],
            },
          },
        },
        setSnackbar: jest.fn(),
        setChatSubmitting: jest.fn(),
      }
      return selector(state)
    })
  })

  it('renders message input and send button', () => {
    render(<MessageSend messageRoomId="room1" type="USER" />)

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
    expect(screen.getByLabelText('Send message')).toBeInTheDocument()
  })

  it('updates input value when typing', () => {
    render(<MessageSend messageRoomId="room1" type="USER" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Hello world' } })

    expect(input).toHaveValue('Hello world')
  })

  it('calls handleTyping when user types', () => {
    render(<MessageSend messageRoomId="room1" type="USER" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'H' } })

    expect(mockHandleTyping).toHaveBeenCalled()
  })

  it('sends message when send button is clicked', async () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: {
          selectedRoom: {
            room: {
              users: ['user1', 'user2'],
            },
          },
        },
        setSnackbar: jest.fn(),
        setChatSubmitting,
      }
      return selector(state)
    })

    render(<MessageSend messageRoomId="room1" type="USER" />)

    const input = screen.getByPlaceholderText('Type a message...')
    const sendButton = screen.getByLabelText('Send message')

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(setChatSubmitting).toHaveBeenCalledWith(true)
    })

    await waitFor(() => {
      expect(setChatSubmitting).toHaveBeenCalledWith(false)
    })

    expect(mockStopTyping).toHaveBeenCalled()
    expect(input).toHaveValue('')
  })

  it('sends message when Enter key is pressed', async () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: {
          selectedRoom: {
            room: {
              users: ['user1', 'user2'],
            },
          },
        },
        setSnackbar: jest.fn(),
        setChatSubmitting,
      }
      return selector(state)
    })

    render(<MessageSend messageRoomId="room1" type="USER" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })

    await waitFor(() => {
      expect(setChatSubmitting).toHaveBeenCalled()
    })
  })

  it('does not send message when Shift+Enter is pressed', () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: {
          selectedRoom: {
            room: {
              users: ['user1', 'user2'],
            },
          },
        },
        setSnackbar: jest.fn(),
        setChatSubmitting,
      }
      return selector(state)
    })

    render(<MessageSend messageRoomId="room1" type="USER" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

    expect(setChatSubmitting).not.toHaveBeenCalled()
  })

  it('disables send button when input is empty', () => {
    render(<MessageSend messageRoomId="room1" type="USER" />)

    const sendButton = screen.getByLabelText('Send message')
    expect(sendButton).toBeDisabled()
  })

  it('disables input and shows blocked message when user is blocked', async () => {
    // Mock useQuery to return blocked user
    mockUseQuery.mockReturnValueOnce({
      data: {
        roster: {
          buddies: [],
          pendingRequests: [],
          blockedUsers: [{ id: 'user2', username: 'blockeduser' }],
        },
      },
      loading: false,
      error: undefined,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: {
          selectedRoom: {
            room: {
              users: ['user1', 'user2'],
            },
          },
        },
        setSnackbar: jest.fn(),
        setChatSubmitting: jest.fn(),
      }
      return selector(state)
    })

    render(<MessageSend messageRoomId="room1" type="USER" />)

    await waitFor(() => {
      const input = screen.getByPlaceholderText('You cannot send messages to this user')
      expect(input).toBeDisabled()
    })
  })

  it('handles mutation errors and shows snackbar', async () => {
    const setSnackbar = jest.fn()
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: {
          selectedRoom: {
            room: {
              users: ['user1', 'user2'],
            },
          },
        },
        setSnackbar,
        setChatSubmitting,
      }
      return selector(state)
    })

    // Suppress console.error for this test since the component logs errors
    const originalError = console.error
    console.error = jest.fn()

    try {
      // Mock mutation to throw error
      mockMutate.mockRejectedValueOnce(new Error('Failed to send message'))

      render(<MessageSend messageRoomId="room1" type="USER" />)

      const input = screen.getByPlaceholderText('Type a message...')
      const sendButton = screen.getByLabelText('Send message')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(setSnackbar).toHaveBeenCalledWith(
          expect.objectContaining({
            open: true,
            type: 'danger',
          })
        )
        expect(setChatSubmitting).toHaveBeenCalledWith(false)
      })
    } finally {
      console.error = originalError
    }
  })

  it('does not send empty messages', () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        chat: {
          selectedRoom: {
            room: {
              users: ['user1', 'user2'],
            },
          },
        },
        setSnackbar: jest.fn(),
        setChatSubmitting,
      }
      return selector(state)
    })

    render(<MessageSend messageRoomId="room1" type="USER" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })

    expect(setChatSubmitting).not.toHaveBeenCalled()
  })
})

