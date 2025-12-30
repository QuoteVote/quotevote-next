/**
 * ChatContent Component Tests
 * 
 * Tests for the ChatContent component including:
 * - Tab switching (chats, groups, buddies)
 * - Room selection and display
 * - Search functionality
 * - Add buddy mode
 * - Status editor
 */

import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import ChatContent from '@/components/Chat/ChatContent'
import { useAppStore } from '@/store'

// Mock useQuery from Apollo Client
const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

// Mock Zustand store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// Mock usePresenceHeartbeat
jest.mock('@/hooks/usePresenceHeartbeat', () => ({
  usePresenceHeartbeat: jest.fn(),
}))

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, 'aria-label': ariaLabel, ...props }: { children: React.ReactNode; onClick?: () => void; 'aria-label'?: string; [key: string]: unknown }) => (
    <button onClick={onClick} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
}))

// Mock child components
jest.mock('@/components/Chat/ChatSearchInput', () => ({
  __esModule: true,
  default: ({ setSearch }: { setSearch: (value: string) => void }) => (
    <input
      data-testid="chat-search-input"
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
  ),
}))

jest.mock('@/components/Chat/ChatTabs', () => ({
  __esModule: true,
  default: ({ 
    value, 
    onChange 
  }: { 
    value: string; 
    onChange: (event: unknown, newValue: string) => void 
  }) => (
    <div data-testid="chat-tabs">
      <button onClick={(e) => onChange(e, 'chats')} data-active={value === 'chats'}>
        Chats
      </button>
      <button onClick={(e) => onChange(e, 'groups')} data-active={value === 'groups'}>
        Groups
      </button>
      <button onClick={(e) => onChange(e, 'buddies')} data-active={value === 'buddies'}>
        Buddies
      </button>
    </div>
  ),
}))

jest.mock('@/components/Chat/ChatList', () => ({
  __esModule: true,
  default: ({ search, filterType }: { search: string; filterType: string }) => (
    <div data-testid="chat-list" data-search={search} data-filter={filterType}>
      Chat List ({filterType})
    </div>
  ),
}))

jest.mock('@/components/Chat/MessageBox', () => ({
  __esModule: true,
  default: () => <div data-testid="message-box">Message Box</div>,
}))

jest.mock('@/components/BuddyList/BuddyListWithPresence', () => ({
  __esModule: true,
  default: ({ search }: { search: string }) => (
    <div data-testid="buddy-list-with-presence" data-search={search}>
      Buddy List
    </div>
  ),
}))

jest.mock('@/components/Chat/UserSearchResults', () => ({
  __esModule: true,
  default: ({ searchQuery }: { searchQuery: string }) => (
    <div data-testid="user-search-results" data-query={searchQuery}>
      User Search Results
    </div>
  ),
}))

jest.mock('@/components/Chat/StatusEditor', () => ({
  __esModule: true,
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    open ? (
      <div data-testid="status-editor">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

describe('ChatContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useQuery to return empty rooms by default
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [] },
      loading: false,
      error: undefined,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: {
            _id: 'user1',
            name: 'Test User',
            username: 'testuser',
          },
        },
        chat: {
          selectedRoom: null,
          buddyList: [],
          presenceMap: {},
          userStatus: 'online',
          userStatusMessage: '',
        },
      }
      return selector(state as ReturnType<typeof useAppStore>)
    })
  })

  it('renders chat tabs and search input', () => {
    render(<ChatContent />)

    expect(screen.getByTestId('chat-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('chat-search-input')).toBeInTheDocument()
  })

  it('displays chat list when chats tab is active', () => {
    render(<ChatContent />)

    expect(screen.getByTestId('chat-list')).toBeInTheDocument()
    expect(screen.getByTestId('chat-list')).toHaveAttribute('data-filter', 'chats')
  })

  it('switches to groups tab when groups button is clicked', () => {
    render(<ChatContent />)

    const groupsButton = screen.getByText('Groups')
    fireEvent.click(groupsButton)

    expect(screen.getByTestId('chat-list')).toHaveAttribute('data-filter', 'groups')
  })

  it('switches to buddies tab when buddies button is clicked', () => {
    render(<ChatContent />)

    const buddiesButton = screen.getByText('Buddies')
    fireEvent.click(buddiesButton)

    expect(screen.getByTestId('buddy-list-with-presence')).toBeInTheDocument()
  })

  it('displays message box when room is selected', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        chat: {
          selectedRoom: 'room1',
          buddyList: [],
          presenceMap: {},
          userStatus: 'online',
          userStatusMessage: '',
        },
      }
      return selector(state as ReturnType<typeof useAppStore>)
    })

    render(<ChatContent />)

    expect(screen.getByTestId('message-box')).toBeInTheDocument()
    expect(screen.queryByTestId('chat-list')).not.toBeInTheDocument()
  })

  it('filters chat list by search query', () => {
    render(<ChatContent />)

    const searchInput = screen.getByTestId('chat-search-input')
    fireEvent.change(searchInput, { target: { value: 'test search' } })

    expect(screen.getByTestId('chat-list')).toHaveAttribute('data-search', 'test search')
  })

  it('shows add buddy mode when add buddy button is clicked', () => {
    render(<ChatContent />)

    // Switch to buddies tab first
    const buddiesButton = screen.getByText('Buddies')
    fireEvent.click(buddiesButton)

    // Find and click add buddy button
    const addBuddyButton = screen.getByText('Add New Buddy')
    fireEvent.click(addBuddyButton)

    expect(screen.getByTestId('user-search-results')).toBeInTheDocument()
    expect(screen.queryByTestId('buddy-list-with-presence')).not.toBeInTheDocument()
  })

  it('opens status editor when status is clicked', () => {
    render(<ChatContent />)

    // Find status settings button - it might be rendered as a button with aria-label
    const statusButton = screen.queryByLabelText('Set status') || screen.getByRole('button', { name: /set status/i })
    fireEvent.click(statusButton)

    // Status editor should open
    expect(screen.getByTestId('status-editor')).toBeInTheDocument()
  })

  it('displays user status with correct styling', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: {
            _id: 'user1',
            name: 'Test User',
            username: 'testuser',
          },
        },
        chat: {
          selectedRoom: null,
          buddyList: [],
          presenceMap: {},
          userStatus: 'away',
          userStatusMessage: 'Away message',
        },
      }
      return selector(state as ReturnType<typeof useAppStore>)
    })

    render(<ChatContent />)

    // Status should be displayed (UserStatusDisplay shows the status message or label)
    // The status message is displayed in the UserStatusDisplay component
    expect(screen.getByText('Away message')).toBeInTheDocument()
  })

  it('handles empty buddy list', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: {
            _id: 'user1',
            name: 'Test User',
            username: 'testuser',
          },
        },
        chat: {
          selectedRoom: null,
          buddyList: [],
          presenceMap: {},
          userStatus: 'online',
          userStatusMessage: '',
        },
      }
      return selector(state as ReturnType<typeof useAppStore>)
    })

    render(<ChatContent />)

    const buddiesButton = screen.getByText('Buddies')
    fireEvent.click(buddiesButton)

    expect(screen.getByTestId('buddy-list-with-presence')).toBeInTheDocument()
  })
})

