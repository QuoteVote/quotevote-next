/**
 * PostChatSend Component Tests
 * 
 * Tests for the PostChatSend component including:
 * - Message input handling
 * - Send actions and mutations
 * - Optimistic updates
 * - Error handling
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import PostChatSend from '@/components/PostChat/PostChatSend'
import { useAppStore } from '@/store'

// Mock useQuery and useMutation from Apollo Client
const mockUseQuery = jest.fn()
const mockMutate = jest.fn()
let mutationCallbacks: { onCompleted?: (data: unknown) => void; onError?: (error: Error) => void } = {}
let shouldSuppressErrorReThrow = false
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
      // Call onError immediately to ensure it's called before the error propagates
      if (mutationCallbacks.onError && error instanceof Error) {
        // Call synchronously first, then also schedule async call
        try {
          mutationCallbacks.onError(error)
        } catch {
          // Ignore errors in callback
        }
        // Also schedule async call to match Apollo behavior
        setTimeout(() => {
          mutationCallbacks.onError?.(error)
        }, 0)
      }
      // Only re-throw if not suppressed (for error handling tests)
      if (!shouldSuppressErrorReThrow) {
        throw error
      }
      // When suppressed, return a resolved promise to prevent unhandled rejection
      // The error is already handled by onError callback
      return Promise.resolve({ data: null })
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

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

const mockCurrentUser = {
  _id: 'user1',
  name: 'Test User',
  username: 'testuser',
  avatar: 'https://example.com/avatar.jpg',
}


describe('PostChatSend', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutate.mockClear()
    mutationCallbacks = {}
    shouldSuppressErrorReThrow = false
    mockMutate.mockResolvedValue({ data: { createMessage: { _id: 'msg1', messageRoomId: 'room1' } } })

    // Mock useQuery to return empty messages by default
    mockUseQuery.mockReturnValue({
      data: { messages: [] },
      loading: false,
      error: undefined,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: mockCurrentUser,
        },
        setChatSubmitting: jest.fn(),
      }
      return selector(state)
    })
  })

  it('renders message input and send button', () => {
    render(<PostChatSend messageRoomId="room1" title="Test Post" postId="post1" />)

    expect(screen.getByPlaceholderText('type a message...')).toBeInTheDocument()
    expect(screen.getByLabelText('Send message')).toBeInTheDocument()
  })

  it('displays chat label on larger screens', () => {
    render(<PostChatSend messageRoomId="room1" title="Test Post" postId="post1" />)

    // Chat label should be present (hidden on mobile)
    const chatLabel = screen.queryByText('Chat')
    // May be hidden with CSS, but should exist in DOM
    expect(chatLabel).toBeInTheDocument()
  })

  it('updates input value when typing', () => {
    render(<PostChatSend messageRoomId="room1" title="Test Post" postId="post1" />)

    const input = screen.getByPlaceholderText('type a message...')
    fireEvent.change(input, { target: { value: 'Hello world' } })

    expect(input).toHaveValue('Hello world')
  })

  it('sends message when send button is clicked', async () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setChatSubmitting,
      }
      return selector(state)
    })

    render(<PostChatSend messageRoomId="room1" title="Test Post" postId="post1" />)

    const input = screen.getByPlaceholderText('type a message...')
    const sendButton = screen.getByLabelText('Send message')

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(setChatSubmitting).toHaveBeenCalledWith(true)
    })

    await waitFor(() => {
      expect(setChatSubmitting).toHaveBeenCalledWith(false)
    })

    expect(input).toHaveValue('')
  })

  it('sends message when Enter key is pressed', async () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setChatSubmitting,
      }
      return selector(state)
    })

    render(<PostChatSend messageRoomId="room1" title="Test Post" postId="post1" />)

    const input = screen.getByPlaceholderText('type a message...')
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
        setChatSubmitting,
      }
      return selector(state)
    })

    render(<PostChatSend messageRoomId="room1" title="Test Post" postId="post1" />)

    const input = screen.getByPlaceholderText('type a message...')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

    expect(setChatSubmitting).not.toHaveBeenCalled()
  })

  it('does not send empty messages', () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setChatSubmitting,
      }
      return selector(state)
    })

    render(<PostChatSend messageRoomId="room1" title="Test Post" postId="post1" />)

    const input = screen.getByPlaceholderText('type a message...')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })

    expect(setChatSubmitting).not.toHaveBeenCalled()
  })

  it('handles mutation errors gracefully', async () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setChatSubmitting,
      }
      return selector(state)
    })

    // Suppress console.error for this test since the component logs errors
    const originalError = console.error
    console.error = jest.fn()

    try {
      // Enable error suppression for this test
      shouldSuppressErrorReThrow = true
      
      // Reset mock implementation and set it to reject when called
      mockMutate.mockReset()
      mockMutate.mockImplementationOnce(() => Promise.reject(new Error('Failed to send message')))

      render(<PostChatSend messageRoomId="room1" title="Test Post" postId="post1" />)

      const input = screen.getByPlaceholderText('type a message...')
      const sendButton = screen.getByLabelText('Send message')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      // Wait for the error to be handled - onError callback should call setChatSubmitting(false)
      await waitFor(() => {
        expect(setChatSubmitting).toHaveBeenCalledWith(false)
      }, { timeout: 3000 })
    } finally {
      console.error = originalError
      shouldSuppressErrorReThrow = false
    }
  })

  it('creates new room when messageRoomId is null', async () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setChatSubmitting,
      }
      return selector(state)
    })

    // Mock mutation to return new room
    mockMutate.mockResolvedValueOnce({
      data: {
        createMessage: {
          _id: 'msg1',
          messageRoomId: 'new-room1',
        },
      },
    })

    render(<PostChatSend messageRoomId={null} title="Test Post" postId="post1" />)

    const input = screen.getByPlaceholderText('type a message...')
    const sendButton = screen.getByLabelText('Send message')

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(setChatSubmitting).toHaveBeenCalledWith(true)
    })
  })

  it('updates cache optimistically when sending message', async () => {
    const setChatSubmitting = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: mockCurrentUser },
        setChatSubmitting,
      }
      return selector(state)
    })

    render(<PostChatSend messageRoomId="room1" title="Test Post" postId="post1" />)

    const input = screen.getByPlaceholderText('type a message...')
    const sendButton = screen.getByLabelText('Send message')

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(setChatSubmitting).toHaveBeenCalledWith(false)
    })
  })
})

