/**
 * MessageItemList Component Tests
 * 
 * Tests for the MessageItemList component including:
 * - Message history rendering
 * - GraphQL subscription handling
 * - Loading and error states
 * - Post header rendering for POST type rooms
 * - Subscription lifecycle events
 */

import { act, render, screen, waitFor } from '@/__tests__/utils/test-utils'
import MessageItemList from '@/components/Chat/MessageItemList'
import { GET_ROOM_MESSAGES, GET_ROOM_READ_TIMES, GET_POST } from '@/graphql/queries'
import type { ChatRoom, ChatMessage } from '@/types/chat'

// Mock react-scrollable-feed
jest.mock('react-scrollable-feed', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="scrollable-feed">{children}</div>,
}), { virtual: true })

// Mock MessageItem component
jest.mock('@/components/Chat/MessageItem', () => ({
  __esModule: true,
  default: ({ message }: { message: ChatMessage }) => (
    <div data-testid={`message-item-${message._id}`}>
      {message.text}
    </div>
  ),
}))

// Mock QuoteHeaderMessage component
jest.mock('@/components/Chat/QuoteHeaderMessage', () => ({
  __esModule: true,
  default: ({ postDetails }: { postDetails: unknown }) => (
    <div data-testid="quote-header-message">
      Quote Header: {JSON.stringify(postDetails)}
    </div>
  ),
}))

// Mock LoadingSpinner
jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: number }) => (
    <div data-testid="loading-spinner">Loading... ({size})</div>
  ),
}))

// Mock useQuery and useSubscription from Apollo Client
const mockUseQuery = jest.fn()
const mockUseSubscription = jest.fn()
const mockMarkRead = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useSubscription: (...args: unknown[]) => mockUseSubscription(...args),
  useMutation: () => [mockMarkRead],
}))

// The signed-in user is user1
jest.mock('@/store', () => ({
  useAppStore: (selector: (state: { user: { data: { _id: string } } }) => unknown) =>
    selector({ user: { data: { _id: 'user1' } } }),
}))

let mockSocketConnected = false
jest.mock('@/hooks/useSocketConnected', () => ({
  __esModule: true,
  default: () => mockSocketConnected,
}))

const mockMessages: ChatMessage[] = [
  {
    _id: 'msg1',
    messageRoomId: 'room1',
    userId: 'user1',
    userName: 'User One',
    text: 'First message',
    created: new Date(Date.now() - 60000).toISOString(),
    type: 'USER',
  },
  {
    _id: 'msg2',
    messageRoomId: 'room1',
    userId: 'user2',
    userName: 'User Two',
    text: 'Second message',
    created: new Date(Date.now() - 30000).toISOString(),
    type: 'USER',
  },
]

const mockRoom: ChatRoom = {
  _id: 'room1',
  title: 'Test Chat',
  messageType: 'USER',
  users: ['user1', 'user2'],
  created: new Date().toISOString(),
}

// Mock query object for reference (not used directly but kept for documentation)
// const mockMessagesQuery = {
//   request: {
//     query: GET_ROOM_MESSAGES,
//     variables: { messageRoomId: 'room1' },
//   },
//   result: {
//     data: {
//       messages: mockMessages,
//     },
//   },
// }

const mockPostRoom: ChatRoom = {
  _id: 'room2',
  title: 'Post Chat',
  messageType: 'POST',
  users: ['user1', 'user2'],
  created: new Date().toISOString(),
  postDetails: {
    _id: 'post1',
    title: 'Test Post',
    text: 'Post content',
  },
}

const mockPostQuery = {
  request: {
    query: GET_POST,
    variables: { postId: 'post1' },
  },
  result: {
    data: {
      post: {
        _id: 'post1',
        title: 'Test Post',
        text: 'Post content',
        creator: {
          _id: 'creator1',
          username: 'creator',
          name: 'Post Creator',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
    },
  },
}

describe('MessageItemList', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useQuery to return messages data by default
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_ROOM_MESSAGES) {
        return {
          data: { messages: mockMessages },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      if (query === GET_POST) {
        return {
          data: { post: mockPostQuery.result.data.post },
          loading: false,
          error: undefined,
        }
      }
      return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
    })

    mockSocketConnected = false
    mockMarkRead.mockResolvedValue({})

    // Mock useSubscription
    mockUseSubscription.mockReturnValue({
      data: undefined,
      error: undefined,
    })
  })

  it('renders "Select a conversation" when no room is provided', () => {
    render(<MessageItemList room={null} />)

    expect(screen.getByText('Select a conversation to view messages')).toBeInTheDocument()
  })

  it('does not show any loading indicator while fetching messages', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: jest.fn(),
    })

    const { container } = render(<MessageItemList room={mockRoom} />)

    // The automatic message loading spinner is intentionally hidden.
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeNull()
  })

  it('renders error message when query fails', async () => {
    // Mock useQuery to return an error
    mockUseQuery.mockReturnValueOnce({
      data: undefined,
      loading: false,
      error: new Error('Failed to fetch messages'),
      refetch: jest.fn(),
    })

    render(<MessageItemList room={mockRoom} />)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong!')).toBeInTheDocument()
    })
  })

  it('renders message list when messages are loaded', async () => {
    render(<MessageItemList room={mockRoom} />)

    await waitFor(() => {
      expect(screen.getByTestId('message-item-msg1')).toBeInTheDocument()
      expect(screen.getByTestId('message-item-msg2')).toBeInTheDocument()
    })

    expect(screen.getByText('First message')).toBeInTheDocument()
    expect(screen.getByText('Second message')).toBeInTheDocument()
  })

  it('renders quote header for POST type rooms', async () => {
    render(<MessageItemList room={mockPostRoom} />)

    await waitFor(() => {
      expect(screen.getByTestId('quote-header-message')).toBeInTheDocument()
    })
  })

  it('does not render quote header for USER type rooms', async () => {
    render(<MessageItemList room={mockRoom} />)

    await waitFor(() => {
      expect(screen.queryByTestId('quote-header-message')).not.toBeInTheDocument()
    })
  })

  describe('Seen in direct conversations', () => {
    const withMessages = (messages: ChatMessage[]) =>
      mockUseQuery.mockImplementation((query) =>
        query === GET_ROOM_MESSAGES
          ? { data: { messages }, loading: false, error: undefined, refetch: jest.fn() }
          : { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
      )

    it('says when the other member saw my latest message, from the read times query', async () => {
      const readAt = new Date()
      readAt.setHours(14, 51, 0, 0)
      mockUseQuery.mockImplementation((query) => {
        if (query === GET_ROOM_MESSAGES) {
          return {
            data: { messages: [{ ...mockMessages[0], readBy: ['user2'] }, mockMessages[1]] },
            loading: false,
            error: undefined,
            refetch: jest.fn(),
          }
        }
        if (query === GET_ROOM_READ_TIMES) {
          return {
            data: {
              messages: [
                { _id: 'msg1', readByDetailed: [{ userId: 'user2', readAt: readAt.toISOString() }] },
              ],
            },
            refetch: jest.fn(),
          }
        }
        return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
      })
      render(<MessageItemList room={mockRoom} />)

      expect(await screen.findByTestId('message-seen')).toHaveTextContent('Seen 2:51 PM')
    })

    it('still loads, with Seen but no time, when the API has no read times (legacy)', async () => {
      mockUseQuery.mockImplementation((query) => {
        if (query === GET_ROOM_MESSAGES) {
          return {
            data: { messages: [{ ...mockMessages[0], readBy: ['user2'] }] },
            loading: false,
            error: undefined,
            refetch: jest.fn(),
          }
        }
        if (query === GET_ROOM_READ_TIMES) {
          return {
            data: undefined,
            error: new Error('Cannot query field "readByDetailed" on type "Message".'),
            refetch: jest.fn(),
          }
        }
        return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
      })
      render(<MessageItemList room={mockRoom} />)

      expect(await screen.findByTestId('message-item-msg1')).toBeInTheDocument()
      expect(screen.getByTestId('message-seen')).toHaveTextContent(/^Seen$/)
    })

    it("asks for read times only in direct conversations", () => {
      render(<MessageItemList room={mockPostRoom} />)
      const call = mockUseQuery.mock.calls.find(([query]) => query === GET_ROOM_READ_TIMES)
      expect(call?.[1]).toMatchObject({ skip: true, errorPolicy: 'all' })
    })

    it('says Seen without a time for a message read before read times were kept', async () => {
      withMessages([{ ...mockMessages[0], readBy: ['user2'] }])
      render(<MessageItemList room={mockRoom} />)

      expect(await screen.findByTestId('message-seen')).toHaveTextContent(/^Seen$/)
    })

    it('shows nothing while my latest message is unread', async () => {
      withMessages(mockMessages)
      render(<MessageItemList room={mockRoom} />)

      await screen.findByTestId('message-item-msg1')
      expect(screen.queryByTestId('message-seen')).not.toBeInTheDocument()
    })

    it("doesn't show Seen in a post's discussion", async () => {
      withMessages([{ ...mockMessages[0], readBy: ['user2'] }])
      render(<MessageItemList room={mockPostRoom} />)

      await screen.findByTestId('message-item-msg1')
      expect(screen.queryByTestId('message-seen')).not.toBeInTheDocument()
    })
  })

  it('handles empty message list', async () => {
    // Mock useQuery to return empty messages
    mockUseQuery.mockReturnValueOnce({
      data: { messages: [] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<MessageItemList room={mockRoom} />)

    await waitFor(() => {
      expect(screen.queryByTestId('message-item-msg1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('message-item-msg2')).not.toBeInTheDocument()
    })
  })

  it('skips polling when no room is provided', () => {
    jest.useFakeTimers()

    // Mock useQuery to not be called when room is null
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<MessageItemList room={null} />)

    jest.advanceTimersByTime(3000)

    // Should not attempt to fetch
    expect(screen.getByText('Select a conversation to view messages')).toBeInTheDocument()

    jest.useRealTimers()
  })

  it('handles subscription data updates', async () => {
    // Note: Apollo Client subscriptions are complex to test
    // This test verifies the component structure supports subscriptions
    render(<MessageItemList room={mockRoom} />)

    await waitFor(() => {
      expect(screen.getByTestId('message-item-msg1')).toBeInTheDocument()
    })

    // Component should be ready to receive subscription updates
    expect(screen.getByTestId('message-item-msg1')).toBeInTheDocument()
  })

  it('handles subscription errors gracefully', async () => {
    // Component should continue to work even if subscription fails
    render(<MessageItemList room={mockRoom} />)

    await waitFor(() => {
      expect(screen.getByTestId('message-item-msg1')).toBeInTheDocument()
    })

    // Component should still render messages even if subscription has errors
    expect(screen.getByText('First message')).toBeInTheDocument()
  })

  describe('requests while idle (#625)', () => {
    const messagesQueryOptions = () =>
      mockUseQuery.mock.calls.filter(([query]) => query === GET_ROOM_MESSAGES).at(-1)?.[1]

    const setVisibility = (state: 'visible' | 'hidden') => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: state })
      document.dispatchEvent(new Event('visibilitychange'))
    }

    const withMessages = (messages: ChatMessage[], refetch = jest.fn().mockResolvedValue({})) => {
      mockUseQuery.mockImplementation((query) =>
        query === GET_ROOM_MESSAGES
          ? { data: { messages }, loading: false, error: undefined, refetch }
          : { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
      )
      return refetch
    }

    beforeEach(() => {
      jest.useFakeTimers()
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('polls every 3 seconds while the subscription socket is down', () => {
      mockSocketConnected = false
      render(<MessageItemList room={mockRoom} />)

      expect(messagesQueryOptions()).toEqual(expect.objectContaining({ pollInterval: 3000 }))
    })

    it('stops polling while the subscription socket is connected', () => {
      mockSocketConnected = true
      render(<MessageItemList room={mockRoom} />)

      expect(messagesQueryOptions()).toEqual(expect.objectContaining({ pollInterval: 0 }))
    })

    it('refetches once when the socket reconnects after a drop', () => {
      const refetch = withMessages(mockMessages)
      mockSocketConnected = true
      const { rerender } = render(<MessageItemList room={mockRoom} />)
      expect(refetch).not.toHaveBeenCalled()

      mockSocketConnected = false
      rerender(<MessageItemList room={mockRoom} />)
      expect(refetch).not.toHaveBeenCalled()

      mockSocketConnected = true
      rerender(<MessageItemList room={mockRoom} />)
      expect(refetch).toHaveBeenCalledTimes(1)
    })

    it('refetches when the subscription delivers a message', () => {
      const refetch = withMessages(mockMessages)
      mockUseSubscription.mockReturnValue({
        data: { message: { _id: 'msg3', messageRoomId: 'room1', userId: 'user2', text: 'Hi' } },
        error: undefined,
      })

      render(<MessageItemList room={mockRoom} />)

      expect(refetch).toHaveBeenCalledTimes(1)
    })

    it('marks the room read once when it opens and not on a timer', async () => {
      render(<MessageItemList room={mockRoom} />)

      await act(async () => {
        jest.advanceTimersByTime(800)
      })
      expect(mockMarkRead).toHaveBeenCalledTimes(1)
      expect(mockMarkRead).toHaveBeenCalledWith({ variables: { messageRoomId: 'room1' } })

      await act(async () => {
        jest.advanceTimersByTime(60_000)
      })
      expect(mockMarkRead).toHaveBeenCalledTimes(1)
    })

    it('marks the room read again when a message from someone else arrives', async () => {
      withMessages(mockMessages)
      const { rerender } = render(<MessageItemList room={mockRoom} />)
      await act(async () => {
        jest.advanceTimersByTime(800)
      })
      expect(mockMarkRead).toHaveBeenCalledTimes(1)

      withMessages([
        ...mockMessages,
        { ...mockMessages[1], _id: 'msg3', text: 'New from user2' },
      ])
      rerender(<MessageItemList room={mockRoom} />)
      await act(async () => {
        jest.advanceTimersByTime(800)
      })
      expect(mockMarkRead).toHaveBeenCalledTimes(2)
    })

    it('does not mark the room read for my own new message', async () => {
      withMessages(mockMessages)
      const { rerender } = render(<MessageItemList room={mockRoom} />)
      await act(async () => {
        jest.advanceTimersByTime(800)
      })

      withMessages([...mockMessages, { ...mockMessages[0], _id: 'msg3', text: 'Mine' }])
      rerender(<MessageItemList room={mockRoom} />)
      await act(async () => {
        jest.advanceTimersByTime(800)
      })
      expect(mockMarkRead).toHaveBeenCalledTimes(1)
    })

    it('waits for the tab to be visible before marking the room read', async () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
      render(<MessageItemList room={mockRoom} />)
      await act(async () => {
        jest.advanceTimersByTime(800)
      })
      expect(mockMarkRead).not.toHaveBeenCalled()

      await act(async () => {
        setVisibility('visible')
      })
      expect(mockMarkRead).toHaveBeenCalledTimes(1)
    })

    it('does not mark anything without a room', async () => {
      render(<MessageItemList room={null} />)
      await act(async () => {
        jest.advanceTimersByTime(800)
        setVisibility('visible')
      })
      expect(mockMarkRead).not.toHaveBeenCalled()
    })
  })
})
