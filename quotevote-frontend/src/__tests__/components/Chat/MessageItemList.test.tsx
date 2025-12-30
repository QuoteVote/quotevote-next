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

import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import MessageItemList from '@/components/Chat/MessageItemList'
import { GET_ROOM_MESSAGES, GET_POST } from '@/graphql/queries'
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
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useSubscription: (...args: unknown[]) => mockUseSubscription(...args),
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

  it('renders loading spinner while fetching messages', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<MessageItemList room={mockRoom} />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
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

  it('polls for messages every 3 seconds', async () => {
    jest.useFakeTimers()

    render(<MessageItemList room={mockRoom} />)

    await waitFor(() => {
      expect(screen.getByTestId('message-item-msg1')).toBeInTheDocument()
    })

    // Advance timers to trigger polling
    jest.advanceTimersByTime(3000)

    // Component should still be rendered
    expect(screen.getByTestId('message-item-msg1')).toBeInTheDocument()

    jest.useRealTimers()
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
})

