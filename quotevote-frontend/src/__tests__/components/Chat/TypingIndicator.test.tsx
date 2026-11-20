/**
 * TypingIndicator Component Tests
 * 
 * Tests for the TypingIndicator component including:
 * - Typing event subscription handling
 * - Display of typing users
 * - Presence updates and cleanup
 * - Error handling
 */

import { render, screen, act } from '@/__tests__/utils/test-utils'
import TypingIndicator from '@/components/Chat/TypingIndicator'
import { useAppStore } from '@/store'

// Mock useSubscription from Apollo Client
const mockUseSubscription = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useSubscription: (...args: unknown[]) => mockUseSubscription(...args),
}))

// Mock Zustand store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

const mockCurrentUser = {
  _id: 'user1',
  name: 'Current User',
  username: 'currentuser',
}

describe('TypingIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    // Mock useSubscription to return no data by default
    // This must be set up before any component renders
    mockUseSubscription.mockReturnValue({
      data: null,
      error: null,
      loading: false,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: mockCurrentUser,
        },
      }
      return selector(state as ReturnType<typeof useAppStore>)
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const typingEvent = (
    userId: string,
    name: string | null,
    isTyping = true,
    username: string | null = null
  ) => ({
    data: {
      typing: {
        userId,
        isTyping,
        timestamp: new Date().toISOString(),
        user: { name, username },
      },
    },
    error: null,
    loading: false,
  })

  it('renders nothing when no messageRoomId is provided', () => {
    const { container } = render(<TypingIndicator messageRoomId={null} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText(/typing/i)).not.toBeInTheDocument()
  })

  it('renders nothing when no users are typing', () => {
    const { container } = render(<TypingIndicator messageRoomId="room1" />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('skips the subscription without a room', () => {
    render(<TypingIndicator messageRoomId={null} />)

    expect(mockUseSubscription).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true })
    )
  })

  it('displays single user typing message', () => {
    mockUseSubscription.mockReturnValue(typingEvent('user2', 'Alice'))

    render(<TypingIndicator messageRoomId="room1" />)

    expect(screen.getByRole('status')).toHaveTextContent('Alice is typing…')
  })

  it('falls back to the username, then Someone, when there is no name', () => {
    mockUseSubscription.mockReturnValue(typingEvent('user2', null, true, 'alice'))
    const { unmount } = render(<TypingIndicator messageRoomId="room1" />)
    expect(screen.getByText('alice is typing…')).toBeInTheDocument()
    unmount()

    mockUseSubscription.mockReturnValue(typingEvent('user3', null))
    render(<TypingIndicator messageRoomId="room1" />)
    expect(screen.getByText('Someone is typing…')).toBeInTheDocument()
  })

  it('does not show typing indicator for current user', () => {
    mockUseSubscription.mockReturnValue(typingEvent('user1', 'Current User'))

    const { container } = render(<TypingIndicator messageRoomId="room1" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('cleans up typing users after timeout', () => {
    mockUseSubscription.mockReturnValue(typingEvent('user2', 'Alice'))
    render(<TypingIndicator messageRoomId="room1" />)
    expect(screen.getByText('Alice is typing…')).toBeInTheDocument()

    // Advance time by 11 seconds
    act(() => {
      jest.advanceTimersByTime(11000)
    })

    // Typing indicator should be cleared
    expect(screen.queryByText(/typing/i)).not.toBeInTheDocument()
  })

  it('handles subscription errors gracefully', () => {
    // Component should not crash on subscription errors
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    // Mock useSubscription to return an error
    mockUseSubscription.mockReturnValue({
      data: null,
      error: new Error('Subscription error'),
      loading: false,
    })

    render(<TypingIndicator messageRoomId="room1" />)

    // Component should still render
    expect(screen.queryByText(/typing/i)).not.toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })

  it('renders a status region with three animated dots', () => {
    mockUseSubscription.mockReturnValue(typingEvent('user2', 'Alice'))

    render(<TypingIndicator messageRoomId="room1" />)

    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('qv-typing')
    const dots = indicator.querySelector('.qv-typing-dots')
    expect(dots).toHaveAttribute('aria-hidden', 'true')
    expect(dots?.querySelectorAll('span')).toHaveLength(3)
  })

  it('removes a user when they stop typing', () => {
    mockUseSubscription.mockReturnValue(typingEvent('user2', 'Alice'))
    const { rerender } = render(<TypingIndicator messageRoomId="room1" />)
    expect(screen.getByText('Alice is typing…')).toBeInTheDocument()

    mockUseSubscription.mockReturnValue(typingEvent('user2', 'Alice', false))
    rerender(<TypingIndicator messageRoomId="room1" />)

    expect(screen.queryByText(/typing/i)).not.toBeInTheDocument()
  })

  it('handles multiple typing users correctly', () => {
    mockUseSubscription.mockReturnValue(typingEvent('user2', 'Alice'))
    const { rerender } = render(<TypingIndicator messageRoomId="room1" />)

    mockUseSubscription.mockReturnValue(typingEvent('user3', 'Bob'))
    rerender(<TypingIndicator messageRoomId="room1" />)

    expect(screen.getByRole('status')).toHaveTextContent('2 people are typing…')
  })

  it('does not count the same user twice', () => {
    mockUseSubscription.mockReturnValue(typingEvent('user2', 'Alice'))
    const { rerender } = render(<TypingIndicator messageRoomId="room1" />)

    mockUseSubscription.mockReturnValue(typingEvent('user2', 'Alice'))
    rerender(<TypingIndicator messageRoomId="room1" />)

    expect(screen.getByText('Alice is typing…')).toBeInTheDocument()
  })
})
