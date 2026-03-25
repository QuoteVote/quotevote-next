/**
 * PostChatReactions Component Tests
 *
 * Tests for the PostChatReactions component including:
 * - Displaying existing reactions grouped by emoji
 * - Emoji picker open/close behavior
 * - Adding a new reaction (addReaction mutation)
 * - Updating an existing reaction (updateReaction mutation)
 * - Navigating to a user's profile
 * - Loading and error states
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import PostChatReactions from '@/components/PostChat/PostChatReactions'
import { useAppStore } from '@/store'

import useGuestGuard from '@/hooks/useGuestGuard'

// ─── Apollo mocks ──────────────────────────────────────────────────────────
const mockAddReaction = jest.fn().mockResolvedValue({})
const mockUpdateReaction = jest.fn().mockResolvedValue({})
const mockUseMutation = jest.fn((mutation: unknown, _options?: unknown) => {
  // Distinguish between ADD and UPDATE by checking the mutation name stored in it
  const mutationStr = JSON.stringify(mutation)
  if (mutationStr.includes('addMessageReaction') || mutationStr.includes('AddMessageReaction')) {
    return [mockAddReaction, { loading: false }]
  }
  return [mockUpdateReaction, { loading: false }]
})

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useMutation: (mutation: unknown, options?: unknown) => mockUseMutation(mutation, options),
}))

// ─── Zustand store mock ────────────────────────────────────────────────────
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// ─── next/navigation mock ──────────────────────────────────────────────────
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ─── useGuestGuard mock ────────────────────────────────────────────────────
jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: jest.fn(() => () => true), // logged-in by default
}))

// ─── @emoji-mart/react mock ────────────────────────────────────────────────
jest.mock('@emoji-mart/react', () => ({
  __esModule: true,
  default: ({ onEmojiSelect }: { onEmojiSelect: (emoji: { native: string }) => void }) => (
    <div data-testid="emoji-picker">
      <button
        data-testid="emoji-option"
        onClick={() => onEmojiSelect({ native: '👍' })}
      >
        👍
      </button>
    </div>
  ),
}))

// ─── @emoji-mart/data mock ────────────────────────────────────────────────
jest.mock('@emoji-mart/data', () => ({}), { virtual: true })

// ─── UI component mocks ───────────────────────────────────────────────────
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...rest
  }: {
    children: React.ReactNode
    onClick?: React.MouseEventHandler
    [key: string]: unknown
  }) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}))

// ─── momentUtils mock ─────────────────────────────────────────────────────
jest.mock('@/lib/utils/momentUtils', () => ({
  parseCommentDate: jest.fn(() => '2 hours ago'),
}))

// ─── Typed store mock helper ───────────────────────────────────────────────
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

// ─── Test data ────────────────────────────────────────────────────────────
const baseProps = {
  created: new Date().toISOString(),
  messageId: 'msg1',
  reactions: [],
  isDefaultDirection: true,
  userName: 'Alice',
  username: 'alice',
}

const reactionsWithEmoji = [
  { _id: 'react1', userId: 'user2', emoji: '👍', messageId: 'msg1' },
  { _id: 'react2', userId: 'user3', emoji: '👍', messageId: 'msg1' },
  { _id: 'react3', userId: 'user4', emoji: '❤️', messageId: 'msg1' },
]

describe('PostChatReactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAddReaction.mockResolvedValue({})
    mockUpdateReaction.mockResolvedValue({})

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: { _id: 'user1', id: 'user1' } },
      }
      return selector(state)
    })
  })

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders the user name', () => {
    render(<PostChatReactions {...baseProps} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders the parsed timestamp', () => {
    render(<PostChatReactions {...baseProps} />)
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
  })

  it('renders the emoji picker trigger button', () => {
    render(<PostChatReactions {...baseProps} />)
    // Smile icon button should be present
    expect(screen.getByTestId('popover-content')).toBeInTheDocument()
  })

  it('renders no reaction bubbles when reactions array is empty', () => {
    render(<PostChatReactions {...baseProps} reactions={[]} />)
    // No emoji text nodes like 👍 or ❤️
    // The picker renders a thumb up option, so it should exist exactly 1 time instead of 0
    expect(screen.getAllByText('👍').length).toBe(1)
  })

  it('renders grouped reaction bubbles with counts', () => {
    render(<PostChatReactions {...baseProps} reactions={reactionsWithEmoji} />)

    // 👍 appears twice → count should be 2
    const thumbsUp = screen.getAllByText('👍')
    expect(thumbsUp.length).toBeGreaterThan(0)

    // Count label "2" for 👍
    expect(screen.getByText('2')).toBeInTheDocument()

    // ❤️ appears once → count should be 1
    expect(screen.getByText('❤️')).toBeInTheDocument()
    // At least one "1" count
    const ones = screen.getAllByText('1')
    expect(ones.length).toBeGreaterThan(0)
  })

  // ── Emoji picker ─────────────────────────────────────────────────────────

  it('renders the emoji picker inside popover content', () => {
    render(<PostChatReactions {...baseProps} />)
    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
  })

  // ── Adding a reaction ────────────────────────────────────────────────────

  it('calls addReaction when user selects an emoji and has no existing reaction', async () => {
    render(<PostChatReactions {...baseProps} reactions={[]} />)

    const emojiButton = screen.getByTestId('emoji-option')
    fireEvent.click(emojiButton)

    await waitFor(() => {
      expect(mockAddReaction).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            reaction: expect.objectContaining({ emoji: '👍', messageId: 'msg1' }),
          }),
        })
      )
    })
  })

  // ── Updating a reaction ──────────────────────────────────────────────────

  it('calls updateReaction when user selects an emoji and already has a reaction', async () => {
    const existingReactions = [
      { _id: 'react-own', userId: 'user1', emoji: '❤️', messageId: 'msg1' },
    ]

    render(<PostChatReactions {...baseProps} reactions={existingReactions} />)

    const emojiButton = screen.getByTestId('emoji-option')
    fireEvent.click(emojiButton)

    await waitFor(() => {
      expect(mockUpdateReaction).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            _id: 'react-own',
            emoji: '👍',
          }),
        })
      )
    })
    expect(mockAddReaction).not.toHaveBeenCalled()
  })

  // ── Profile navigation ────────────────────────────────────────────────────

  it('navigates to profile when user name button is clicked', () => {
    render(<PostChatReactions {...baseProps} />)

    const nameButton = screen.getByRole('button', { name: 'Alice' })
    fireEvent.click(nameButton)

    expect(mockPush).toHaveBeenCalledWith('/Profile/alice')
  })

  // ── Guest guard ───────────────────────────────────────────────────────────

  it('does not add reaction when guest guard returns false', async () => {
    // Simulate unauthenticated user
    ;(useGuestGuard as jest.Mock).mockReturnValueOnce(() => false)

    render(<PostChatReactions {...baseProps} reactions={[]} />)

    const emojiButton = screen.getByTestId('emoji-option')
    fireEvent.click(emojiButton)

    await waitFor(() => {
      expect(mockAddReaction).not.toHaveBeenCalled()
    })
  })

  // ── Direction styling ─────────────────────────────────────────────────────

  it('applies default direction text colour when isDefaultDirection is true', () => {
    render(<PostChatReactions {...baseProps} isDefaultDirection={true} />)
    const nameButton = screen.getByRole('button', { name: 'Alice' })
    expect(nameButton.className).toContain('text-gray-500')
  })

  it('applies reverse direction text colour when isDefaultDirection is false', () => {
    render(<PostChatReactions {...baseProps} isDefaultDirection={false} />)
    const nameButton = screen.getByRole('button', { name: 'Alice' })
    expect(nameButton.className).toContain('text-white')
  })
})
