/**
 * ChatList Component Tests
 *
 * Tests for the ChatList component including:
 * - Rendering chat rooms (USER type direct messages)
 * - Rendering group rooms (POST type)
 * - Filtering by search query
 * - Filtering by filterType ('chats' vs 'groups')
 * - Loading state
 * - Empty state (no rooms found)
 * - Room selection (calls setSelectedChatRoom)
 * - Unread message badge
 * - Sorting by most recent activity
 * - #531: search by message text, @person and #tag; the tag chip in place of "Group"
 * - #601: message text searched on the server, a page at a time
 */

import { act, render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import ChatList from '@/components/Chat/ChatList'
import { useAppStore } from '@/store'
import { GET_BUDDY_LIST, GET_CHAT_ROOMS, GET_CHAT_ROOM_SEARCH_DATA, SEARCH_MESSAGES } from '@/graphql/queries'

// ─── Tags (the post's group) ───────────────────────────────────────────────
const mockTags: Record<string, { tagId: string; title: string }> = {}
jest.mock('@/hooks/useConversationTags', () => ({
  useConversationTags: () => mockTags,
}))

// ─── Apollo mocks ──────────────────────────────────────────────────────────
const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: <T,>(value: T) => value,
}))

// ─── Zustand store mock ────────────────────────────────────────────────────
jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

// ─── Avatar mock ───────────────────────────────────────────────────────────
jest.mock('@/components/Avatar', () => ({
  __esModule: true,
  default: ({ src, alt }: { src?: string; alt: string }) => (
    <img data-testid="avatar" src={src} alt={alt} />
  ),
}))

// ─── DisplayAvatar mock (used by ChatList) ─────────────────────────────────
jest.mock('@/components/DisplayAvatar', () => ({
  __esModule: true,
  DisplayAvatar: ({ avatar, username }: { avatar?: string | Record<string, unknown>; username: string; size?: number; className?: string }) => {
    const src = typeof avatar === 'string' ? avatar : `https://avataaars.io/?seed=${username}`
    return <img data-testid="avatar" src={src} alt={`${username}'s avatar`} />
  },
}))

// ─── LoadingSpinner mock ───────────────────────────────────────────────────
jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: number }) => (
    <div data-testid="loading-spinner" data-size={size}>
      Loading...
    </div>
  ),
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

// ─── Test data ────────────────────────────────────────────────────────────

const dmRoom = {
  _id: 'room-dm-1',
  title: 'Jane Doe',
  messageType: 'USER',
  users: ['user1', 'user2'],
  created: new Date(Date.now() - 60_000).toISOString(),
  avatar: 'https://example.com/jane.jpg',
}

const groupRoom = {
  _id: 'room-group-1',
  title: 'Interesting Quote',
  messageType: 'POST',
  users: ['user1', 'user2', 'user3'],
  created: new Date(Date.now() - 120_000).toISOString(),
  postDetails: {
    _id: 'post1',
    title: 'Interesting Quote',
    text: 'Some post text here.',
    url: '/post/general/interesting-quote/post1',
  },
  avatar: null,
}

const dmRoomWithUnread = {
  ...dmRoom,
  _id: 'room-dm-2',
  title: 'Unread Chat',
  unreadMessages: 5,
}

// ─── beforeEach default setup ─────────────────────────────────────────────

describe('ChatList', () => {
  const mockSetSelectedChatRoom = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: { _id: 'user1' } },
        chat: { selectedRoom: null },
        setSelectedChatRoom: mockSetSelectedChatRoom,
      }
      return selector(state)
    })
    Object.keys(mockTags).forEach((key) => delete mockTags[key])

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_CHAT_ROOMS) {
        return {
          data: { messageRooms: [dmRoom, groupRoom] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
    })
  })

  // ── Loading state ────────────────────────────────────────────────────────

  it('renders loading spinner when loading and no cached data', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  // ── DM (chats) filter ─────────────────────────────────────────────────────

  it('renders direct message rooms when filterType is "chats"', async () => {
    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    // Group room should NOT appear in the chats tab
    expect(screen.queryByText('Interesting Quote')).not.toBeInTheDocument()
  })

  it('shows no DM or Group label, since the tab already says which it is (#531)', async () => {
    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
    expect(screen.queryByText('DM')).not.toBeInTheDocument()
    expect(screen.getByText('Direct message')).toBeInTheDocument()
  })

  // ── Group filter ──────────────────────────────────────────────────────────

  it('renders group rooms when filterType is "groups"', async () => {
    render(<ChatList filterType="groups" />)

    await waitFor(() => {
      expect(screen.getByText('Interesting Quote')).toBeInTheDocument()
    })

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
  })

  it('shows the post\'s tag instead of a generic Group label (#531)', async () => {
    mockTags['post1'] = { tagId: 'g1', title: 'Climate' }
    render(<ChatList filterType="groups" />)

    const tag = await screen.findByTestId('discussion-tag')
    expect(tag).toHaveTextContent('Climate')
    expect(tag).toHaveAccessibleName('Show discussions tagged #Climate')
    expect(screen.queryByText('Group')).not.toBeInTheDocument()
  })

  it('has no tag chip when the post has no tag', async () => {
    render(<ChatList filterType="groups" />)

    await waitFor(() => {
      expect(screen.getByText('Interesting Quote')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('discussion-tag')).not.toBeInTheDocument()
    expect(screen.queryByText('Group')).not.toBeInTheDocument()
  })

  it('filters the list by the tag when the tag is clicked, without opening the room (#531)', async () => {
    mockTags['post1'] = { tagId: 'g1', title: 'Local News' }
    const onSearchChange = jest.fn()
    render(<ChatList filterType="groups" onSearchChange={onSearchChange} />)

    fireEvent.click(await screen.findByTestId('discussion-tag'))

    expect(onSearchChange).toHaveBeenCalledWith('#LocalNews')
    expect(mockSetSelectedChatRoom).not.toHaveBeenCalled()
  })

  // ── Search filter ─────────────────────────────────────────────────────────

  it('filters rooms by search query (case-insensitive)', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [dmRoom, groupRoom] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" search="jane" />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
  })

  it('shows empty state when search matches nothing', async () => {
    render(<ChatList filterType="chats" search="zzznomatch" />)

    await waitFor(() => {
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
      // Empty state message
      expect(screen.getByText('No chats match “zzznomatch”')).toBeInTheDocument()
    })
  })

  it('offers Clear search when nothing matches', async () => {
    const onSearchChange = jest.fn()
    render(<ChatList filterType="chats" search="zzznomatch" onSearchChange={onSearchChange} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Clear search' }))
    expect(onSearchChange).toHaveBeenCalledWith('')
  })

  // ── #531: message text, @person, #tag ─────────────────────────────────────

  const serverMessages = [
    { _id: 'm1', messageRoomId: 'room-dm-1', created: '2026-11-01T10:00:00Z', snippet: 'Are you coming to the town hall on Thursday?' },
    { _id: 'm3', messageRoomId: 'room-group-1', created: '2026-11-01T09:00:00Z', snippet: 'Vacancy data from the survey would help.' },
  ]

  const withSearchData = (extra: Record<string, unknown> = {}) => {
    mockUseQuery.mockImplementation((query, options) => {
      if (query === SEARCH_MESSAGES) {
        if (options?.skip) return { data: undefined, loading: false }
        const text = String(options?.variables?.text).toLowerCase()
        return {
          data: {
            searchMessages: {
              results: serverMessages.filter((m) => m.snippet.toLowerCase().includes(text)),
              nextCursor: null,
            },
          },
          loading: false,
        }
      }
      if (query === GET_CHAT_ROOMS) {
        return { data: { messageRooms: [dmRoom, groupRoom] }, loading: false, refetch: jest.fn() }
      }
      if (query === GET_CHAT_ROOM_SEARCH_DATA) {
        return {
          data: {
            messageRooms: [
              {
                _id: 'room-dm-1',
                messages: [
                  { _id: 'm1', userId: 'user2', user: { _id: 'user2', username: 'janed', name: 'Jane Doe' } },
                  { _id: 'm2', userId: 'user1', user: { _id: 'user1', username: 'me', name: 'Me Myself' } },
                ],
              },
              {
                _id: 'room-group-1',
                messages: [
                  { _id: 'm3', userId: 'user3', user: { _id: 'user3', username: 'sam', name: 'Sam Rivera' } },
                ],
              },
            ],
          },
          loading: false,
        }
      }
      if (query === GET_BUDDY_LIST) {
        return { data: { getBuddyList: [{ user: { _id: 'user2', username: 'janed', name: 'Jane Doe' } }] }, loading: false }
      }
      return { data: undefined, loading: false, refetch: jest.fn(), ...extra }
    })
  }

  it('finds a conversation by the text of its messages, and shows the matching message', async () => {
    withSearchData()
    render(<ChatList filterType="chats" search="town hall" />)

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Are you coming to the town hall on Thursday?')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 chat found')
  })

  it('finds a discussion by message text', async () => {
    withSearchData()
    render(<ChatList filterType="groups" search="vacancy" />)
    expect(await screen.findByText('Interesting Quote')).toBeInTheDocument()
  })

  it('finds conversations by @username or a word of the name', async () => {
    withSearchData()
    const { rerender } = render(<ChatList filterType="chats" search="@janed" />)
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()

    rerender(<ChatList filterType="groups" search="@sam" />)
    expect(await screen.findByText('Interesting Quote')).toBeInTheDocument()

    rerender(<ChatList filterType="groups" search="@rivera" />)
    expect(await screen.findByText('Interesting Quote')).toBeInTheDocument()
  })

  it('does not match @you against every conversation', async () => {
    withSearchData()
    render(<ChatList filterType="chats" search="@me" />)
    expect(await screen.findByText('No chats match “@me”')).toBeInTheDocument()
  })

  it('finds discussions by #tag, from its first letters and in any case', async () => {
    mockTags['post1'] = { tagId: 'g1', title: 'Climate' }
    const { rerender } = render(<ChatList filterType="groups" search="#clim" />)
    expect(await screen.findByText('Interesting Quote')).toBeInTheDocument()

    rerender(<ChatList filterType="groups" search="#CLIMATE" />)
    expect(screen.getByText('Interesting Quote')).toBeInTheDocument()

    rerender(<ChatList filterType="groups" search="#housing" />)
    expect(await screen.findByText('No discussions match “#housing”')).toBeInTheDocument()
  })

  it('combines terms: #tag and text must both match', async () => {
    mockTags['post1'] = { tagId: 'g1', title: 'Climate' }
    withSearchData()
    const { rerender } = render(<ChatList filterType="groups" search="#climate vacancy" />)
    expect(await screen.findByText('Interesting Quote')).toBeInTheDocument()

    rerender(<ChatList filterType="groups" search="#climate parking" />)
    expect(await screen.findByText('No discussions match “#climate parking”')).toBeInTheDocument()
  })

  it('treats a lone @ or # as no search yet', async () => {
    render(<ChatList filterType="chats" search="@" />)
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
  })

  it('runs no message search or author query without a search', () => {
    render(<ChatList filterType="chats" />)
    expect(mockUseQuery).toHaveBeenCalledWith(
      GET_CHAT_ROOM_SEARCH_DATA,
      expect.objectContaining({ skip: true })
    )
    expect(mockUseQuery).toHaveBeenCalledWith(
      SEARCH_MESSAGES,
      expect.objectContaining({ skip: true })
    )
  })

  // ── #601: message text searched on the server ─────────────────────────────

  const withServerSearch = (result: Record<string, unknown>) => {
    mockUseQuery.mockImplementation((query, options) => {
      if (query === GET_CHAT_ROOMS) {
        return { data: { messageRooms: [dmRoom, groupRoom] }, loading: false, refetch: jest.fn() }
      }
      if (query === SEARCH_MESSAGES && !options?.skip) return { loading: false, ...result }
      return { data: undefined, loading: false, refetch: jest.fn() }
    })
  }

  const page = (results: typeof serverMessages, nextCursor: string | null = null) => ({
    data: { searchMessages: { results, nextCursor } },
  })

  it('sends the text without @person or #tag terms to the server', () => {
    withSearchData()
    render(<ChatList filterType="chats" search="town hall @janed #news" />)
    expect(mockUseQuery).toHaveBeenCalledWith(
      SEARCH_MESSAGES,
      expect.objectContaining({ skip: false, variables: expect.objectContaining({ text: 'town hall' }) })
    )
  })

  it('does not load every message for a plain text search', () => {
    withSearchData()
    render(<ChatList filterType="chats" search="town hall" />)
    expect(mockUseQuery).toHaveBeenCalledWith(
      GET_CHAT_ROOM_SEARCH_DATA,
      expect.objectContaining({ skip: true })
    )
  })

  it('does not ask for message text just to find a person', () => {
    const printed = JSON.stringify(GET_CHAT_ROOM_SEARCH_DATA)
    expect(printed).toContain('"userId"')
    expect(printed).not.toContain('"text"')
  })

  it('counts the other matches in a conversation', async () => {
    withServerSearch(page([
      serverMessages[0],
      { ...serverMessages[0], _id: 'm5', snippet: 'town hall again' },
      { ...serverMessages[0], _id: 'm6', snippet: 'another town hall' },
    ].map((m) => ({ ...m, snippet: m.snippet.toLowerCase() }))))
    render(<ChatList filterType="chats" search="town hall" />)

    expect(await screen.findByTestId('chat-search-more-matches')).toHaveTextContent('+2 more matches')
    expect(screen.getAllByTestId('chat-search-result')).toHaveLength(1)
  })

  it('shows searching, not "no match", until the server answers', () => {
    withServerSearch({ data: undefined, loading: true })
    render(<ChatList filterType="chats" search="town hall" />)

    expect(screen.getByTestId('chat-search-pending')).toBeInTheDocument()
    expect(screen.queryByTestId('chat-empty-search-state')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Searching messages')
  })

  it('keeps title matches on screen while messages are searched', () => {
    withServerSearch({ data: undefined, loading: true })
    render(<ChatList filterType="chats" search="jane" />)

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByTestId('chat-search-pending')).toBeInTheDocument()
  })

  it('offers a retry when the search fails', () => {
    const refetch = jest.fn()
    withServerSearch({ data: undefined, error: new Error('boom'), refetch })
    render(<ChatList filterType="chats" search="town hall" />)

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't search message text.")
    expect(screen.queryByTestId('chat-empty-search-state')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('shows the empty state when the server finds nothing', async () => {
    withServerSearch(page([]))
    render(<ChatList filterType="chats" search="zzznomatch" />)
    expect(await screen.findByTestId('chat-empty-search-state')).toBeInTheDocument()
  })

  it('loads the next page from the button, with the cursor', async () => {
    const fetchMore = jest.fn().mockResolvedValue({})
    withServerSearch({ ...page([serverMessages[0]], 'cursor-1'), fetchMore })
    render(<ChatList filterType="chats" search="town hall" />)

    fireEvent.click(screen.getByTestId('chat-search-load-more'))
    await waitFor(() => expect(fetchMore).toHaveBeenCalledTimes(1))
    expect(fetchMore.mock.calls[0][0].variables).toEqual(
      expect.objectContaining({ text: 'town hall', cursor: 'cursor-1' })
    )
    await waitFor(() => expect(screen.getByTestId('chat-search-load-more')).toBeEnabled())
  })

  it('says so and offers a retry when the next page fails', async () => {
    const fetchMore = jest.fn().mockRejectedValue(new Error('boom'))
    withServerSearch({ ...page([serverMessages[0]], 'cursor-1'), fetchMore })
    render(<ChatList filterType="chats" search="town hall" />)

    fireEvent.click(screen.getByTestId('chat-search-load-more'))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load more results.")
    expect(screen.getByTestId('chat-search-load-more')).toHaveTextContent('Try again')
  })

  describe('loading on scroll', () => {
    const RealObserver = global.IntersectionObserver
    let notify: (isIntersecting: boolean) => void

    beforeEach(() => {
      global.IntersectionObserver = class {
        constructor(callback: IntersectionObserverCallback) {
          notify = (isIntersecting) =>
            callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
        }
        observe() {}
        disconnect() {}
        unobserve() {}
        takeRecords() {
          return []
        }
      } as unknown as typeof IntersectionObserver
    })

    afterEach(() => {
      global.IntersectionObserver = RealObserver
    })

    it('loads the next page when the end of the list comes into view', async () => {
      const fetchMore = jest.fn(() => new Promise(() => {}))
      withServerSearch({ ...page([serverMessages[0]], 'cursor-1'), fetchMore })
      render(<ChatList filterType="chats" search="town hall" />)

      expect(fetchMore).not.toHaveBeenCalled()
      await act(async () => notify(true))
      expect(fetchMore).toHaveBeenCalled()
    })

    it('does not retry on its own after a page fails', async () => {
      const fetchMore = jest.fn().mockRejectedValue(new Error('boom'))
      withServerSearch({ ...page([serverMessages[0]], 'cursor-1'), fetchMore })
      render(<ChatList filterType="chats" search="town hall" />)

      await act(async () => notify(true))
      await screen.findByRole('alert')
      expect(fetchMore).toHaveBeenCalledTimes(1)
    })

    it('keeps looking when a page only has matches in the other tab', async () => {
      const fetchMore = jest.fn(() => new Promise(() => {}))
      withServerSearch({ ...page([serverMessages[1]], 'cursor-1'), fetchMore })
      render(<ChatList filterType="chats" search="vacancy" />)

      expect(screen.queryByTestId('chat-empty-search-state')).not.toBeInTheDocument()
      await act(async () => notify(true))
      expect(fetchMore).toHaveBeenCalled()
    })
  })

  // ── Room selection ────────────────────────────────────────────────────────

  it('calls setSelectedChatRoom with room._id when a room is clicked', async () => {
    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    const roomButton = screen.getByTestId('discussion-thread')
    fireEvent.click(roomButton)

    expect(mockSetSelectedChatRoom).toHaveBeenCalledWith('room-dm-1')
  })

  it('opens a discussion from anywhere on its title, with no link nested in the button (#531)', async () => {
    render(<ChatList filterType="groups" />)

    fireEvent.click(await screen.findByText('Interesting Quote'))
    expect(mockSetSelectedChatRoom).toHaveBeenCalledWith('room-group-1')
    expect(screen.getByTestId('discussion-thread').querySelector('a')).toBeNull()
  })

  // ── Selected room highlight ──────────────────────────────────────────────

  it('applies selected styling to the currently active room', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: { _id: 'user1' } },
        chat: { selectedRoom: 'room-dm-1' },
        setSelectedChatRoom: mockSetSelectedChatRoom,
      }
      return selector(state)
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      const roomButton = screen.getByTestId('discussion-thread')
      expect(roomButton).toHaveAttribute('aria-current', 'true')
      expect(roomButton.parentElement?.className).toContain('border-[#2f7a4c]')
    })
  })

  // ── Unread message badge ─────────────────────────────────────────────────

  it('renders unread count badge when a room has unread messages', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [dmRoomWithUnread] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('renders "99+" badge when unread count exceeds 99', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [{ ...dmRoomWithUnread, unreadMessages: 150 }] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument()
    })
  })

  it('does not render unread badge when unreadMessages is 0', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [{ ...dmRoom, unreadMessages: 0 }] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  // ── Empty state messages ─────────────────────────────────────────────────

  it('shows "No chats yet" heading when there are no chats', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      expect(screen.getByText('No chats yet')).toBeInTheDocument()
    })
  })

  it('shows "No discussions yet" heading when there are no discussions', async () => {
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="groups" />)

    await waitFor(() => {
      expect(screen.getByText('No discussions yet')).toBeInTheDocument()
    })
  })

  // ── Avatar rendering ──────────────────────────────────────────────────────

  it('renders an avatar image when the room has an avatar URL', async () => {
    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      const avatarImg = screen.getByTestId('avatar')
      expect(avatarImg).toBeInTheDocument()
      expect(avatarImg).toHaveAttribute('src', 'https://example.com/jane.jpg')
    })
  })

  it('renders a fallback icon when the room has no avatar', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        messageRooms: [{ ...dmRoom, avatar: null }],
      },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    render(<ChatList filterType="chats" />)

    await waitFor(() => {
      // When no avatar, DisplayAvatar still renders a cartoon avatar image
      expect(screen.getByTestId('avatar')).toBeInTheDocument()
    })
  })

  // ── Query invocation ─────────────────────────────────────────────────────

  it('calls useQuery with GET_CHAT_ROOMS', () => {
    render(<ChatList filterType="chats" />)
    expect(mockUseQuery).toHaveBeenCalledWith(
      GET_CHAT_ROOMS,
      expect.objectContaining({ fetchPolicy: 'cache-and-network' })
    )
  })
})
