/**
 * ProfileHeader — availability indicator and status message (#468)
 *
 * - Available / Away / Do Not Disturb draw a small colored dot on the lower-right
 *   edge of the profile avatar; Invisible (the default) draws nothing
 * - the status message shows in the profile header for those three statuses only
 * - your own profile follows the status you picked; someone else's is read with
 *   `getPresence`, and anything not public is never shown
 *
 * `useQuery` is mocked directly (Apollo Client 4 no longer exports
 * `MockedProvider` from `@apollo/client/testing`), so these tests really render
 * the header instead of falling into the error boundary.
 */

import { render, screen, act } from '../../utils/test-utils'
import { ProfileHeader } from '../../../components/Profile/ProfileHeader'
import { useAppStore } from '@/store'
import { GET_CHAT_ROOM, GET_ROSTER, GET_USER_PRESENCE } from '@/graphql/queries'
import type { ProfileUser } from '@/types/profile'
import type { DocumentNode } from 'graphql'

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/components/DisplayAvatar', () => ({
  DisplayAvatar: () => <div data-testid="avatar" />,
}))

jest.mock('../../../components/CustomButtons/FollowButton', () => ({
  FollowButton: () => <button type="button">Follow</button>,
}))

jest.mock('../../../components/Profile/ProfileBadge', () => ({
  ProfileBadge: () => <div />,
  ProfileBadgeContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('@/hooks/useProfileBackground', () => ({
  useProfileBackground: () => ({ color: '#fff', pattern: 'none' }),
}))

jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: () => jest.fn(() => true),
}))

const mockUseQuery = jest.fn()
const mockUseMutation = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

const ownProfile: ProfileUser = {
  _id: 'currentuser',
  username: 'currentuser',
  name: 'Current User',
  _followingId: [],
  _followersId: [],
}

const otherProfile: ProfileUser = {
  _id: 'user1',
  username: 'testuser',
  name: 'Test User',
  _followingId: [],
  _followersId: [],
}

/** What `getPresence` returns for the profile being viewed (undefined = nothing / failed). */
let presenceResult: { data?: unknown; error?: Error } | undefined

function givePresence(status: string, statusMessage = '') {
  presenceResult = { data: { getPresence: { userId: 'user1', status, statusMessage, lastSeen: null } } }
}

function setOwnStatus(status: string, message = '') {
  act(() => {
    useAppStore.setState((state) => ({
      chat: { ...state.chat, userStatus: status, userStatusMessage: message },
    }))
  })
}

const indicator = () => screen.queryByTestId('profile-status-indicator')
const statusMessage = () => screen.queryByTestId('profile-status-message')

describe('ProfileHeader — availability status (#468)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    presenceResult = undefined
    useAppStore.getState().resetStore()
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        data: { _id: 'currentuser', username: 'currentuser', name: 'Current User' },
      },
    })
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false, error: undefined }])
    mockUseQuery.mockImplementation((doc: DocumentNode) => {
      if (doc === GET_CHAT_ROOM) return { data: { messageRoom: null }, loading: false, error: undefined }
      if (doc === GET_ROSTER) return { data: { getRoster: [] }, loading: false, error: undefined }
      if (doc === GET_USER_PRESENCE) return { loading: false, ...presenceResult }
      return { data: undefined, loading: false, error: undefined }
    })
  })

  describe('your own profile', () => {
    it('really renders the header (not the error boundary)', () => {
      render(<ProfileHeader profileUser={ownProfile} />)

      expect(screen.getByText('@currentuser')).toBeInTheDocument()
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
    })

    it.each([
      ['online', 'Available'],
      ['away', 'Away'],
      ['dnd', 'Do Not Disturb'],
    ])('draws a %s indicator labelled "%s" on the avatar', (status, label) => {
      setOwnStatus(status)
      render(<ProfileHeader profileUser={ownProfile} />)

      const dot = indicator()
      expect(dot).toBeInTheDocument()
      expect(dot).toHaveAttribute('data-status', status)
      expect(dot).toHaveAttribute('role', 'img')
      expect(dot).toHaveAttribute('aria-label', `Status: ${label}`)
      expect(dot).toHaveAttribute('title', label)
    })

    it('puts the indicator on the lower-right edge of the avatar', () => {
      setOwnStatus('away')
      render(<ProfileHeader profileUser={ownProfile} />)

      const dot = indicator() as HTMLElement
      const avatarBox = screen.getByTestId('avatar').parentElement as HTMLElement
      expect(avatarBox).toContainElement(dot)
      expect(avatarBox.className).toContain('relative')
      expect(dot.className).toContain('absolute')
      expect(dot.className).toContain('bottom-1')
      expect(dot.className).toContain('right-1')
    })

    it('uses green, yellow and red for Available, Away and Do Not Disturb', () => {
      const colors: Record<string, string> = {
        online: 'bg-[#52b274]',
        away: 'bg-[#facc15]',
        dnd: 'bg-[#ef4444]',
      }
      for (const [status, color] of Object.entries(colors)) {
        setOwnStatus(status)
        const { unmount } = render(<ProfileHeader profileUser={ownProfile} />)
        expect(indicator()?.className).toContain(color)
        unmount()
      }
    })

    it('shows the status message in the profile header', () => {
      setOwnStatus('away', "I'm away on holiday but will be checking back in due time, please leave a message")
      render(<ProfileHeader profileUser={ownProfile} />)

      const message = statusMessage() as HTMLElement
      expect(message).toHaveTextContent(
        "I'm away on holiday but will be checking back in due time, please leave a message"
      )
      // It sits in the header banner, next to the cover.
      expect(screen.getByTestId('profile-cover').parentElement).toContainElement(message)
    })

    it('shows the indicator but no message block when there is no message', () => {
      setOwnStatus('online', '')
      render(<ProfileHeader profileUser={ownProfile} />)

      expect(indicator()).toBeInTheDocument()
      expect(statusMessage()).not.toBeInTheDocument()
    })

    it('treats a blank message as no message', () => {
      setOwnStatus('dnd', '   ')
      render(<ProfileHeader profileUser={ownProfile} />)

      expect(indicator()).toBeInTheDocument()
      expect(statusMessage()).not.toBeInTheDocument()
    })

    it('shows no indicator and no message while Invisible', () => {
      setOwnStatus('invisible', '')
      render(<ProfileHeader profileUser={ownProfile} />)

      expect(indicator()).not.toBeInTheDocument()
      expect(statusMessage()).not.toBeInTheDocument()
    })

    it('does not show an old message while Invisible, even if one is still stored', () => {
      setOwnStatus('invisible', 'Left over message')
      render(<ProfileHeader profileUser={ownProfile} />)

      expect(indicator()).not.toBeInTheDocument()
      expect(screen.queryByText('Left over message')).not.toBeInTheDocument()
    })

    it('shows nothing for a brand new user, because Invisible is the default', () => {
      render(<ProfileHeader profileUser={ownProfile} />)

      expect(indicator()).not.toBeInTheDocument()
      expect(statusMessage()).not.toBeInTheDocument()
    })

    it('follows the status as it changes, and keeps it until it changes again', () => {
      render(<ProfileHeader profileUser={ownProfile} />)
      expect(indicator()).not.toBeInTheDocument()

      setOwnStatus('online', 'Around')
      expect(indicator()).toHaveAttribute('data-status', 'online')
      expect(statusMessage()).toHaveTextContent('Around')

      setOwnStatus('dnd', 'Heads down')
      expect(indicator()).toHaveAttribute('data-status', 'dnd')
      expect(statusMessage()).toHaveTextContent('Heads down')

      setOwnStatus('invisible', '')
      expect(indicator()).not.toBeInTheDocument()
      expect(statusMessage()).not.toBeInTheDocument()
    })

    it('does not ask the server for your own presence', () => {
      render(<ProfileHeader profileUser={ownProfile} />)

      expect(mockUseQuery).toHaveBeenCalledWith(
        GET_USER_PRESENCE,
        expect.objectContaining({ skip: true })
      )
    })

    it('no longer shows the old status pill or the word "Online"', () => {
      setOwnStatus('online', '')
      render(<ProfileHeader profileUser={ownProfile} />)

      expect(screen.queryByText('Online')).not.toBeInTheDocument()
      expect(screen.queryByText('Available')).not.toBeInTheDocument()
    })
  })

  describe("someone else's profile", () => {
    it.each([
      ['online', 'Available'],
      ['away', 'Away'],
      ['dnd', 'Do Not Disturb'],
    ])('draws their %s indicator ("%s") and message', (status, label) => {
      givePresence(status, 'Hello from them')
      render(<ProfileHeader profileUser={otherProfile} />)

      expect(indicator()).toHaveAttribute('data-status', status)
      expect(indicator()).toHaveAttribute('aria-label', `Status: ${label}`)
      expect(statusMessage()).toHaveTextContent('Hello from them')
    })

    it('reads their presence by user id', () => {
      givePresence('online')
      render(<ProfileHeader profileUser={otherProfile} />)

      expect(mockUseQuery).toHaveBeenCalledWith(
        GET_USER_PRESENCE,
        expect.objectContaining({ variables: { userId: 'user1' }, skip: false })
      )
    })

    it('hides an Invisible user\'s indicator and message, even though the API sends the message', () => {
      givePresence('invisible', 'Secret plans')
      render(<ProfileHeader profileUser={otherProfile} />)

      expect(indicator()).not.toBeInTheDocument()
      expect(statusMessage()).not.toBeInTheDocument()
      expect(screen.queryByText('Secret plans')).not.toBeInTheDocument()
    })

    it('shows nothing for an offline user', () => {
      givePresence('offline', 'Gone')
      render(<ProfileHeader profileUser={otherProfile} />)

      expect(indicator()).not.toBeInTheDocument()
      expect(screen.queryByText('Gone')).not.toBeInTheDocument()
    })

    it('still renders the profile when the presence request fails', () => {
      presenceResult = { data: undefined, error: new Error('Unknown field getPresence') }
      render(<ProfileHeader profileUser={otherProfile} />)

      expect(screen.getByText('@testuser')).toBeInTheDocument()
      expect(indicator()).not.toBeInTheDocument()
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
    })

    it('shows nothing while their presence is still loading', () => {
      presenceResult = { data: undefined }
      render(<ProfileHeader profileUser={otherProfile} />)

      expect(screen.getByText('@testuser')).toBeInTheDocument()
      expect(indicator()).not.toBeInTheDocument()
    })

    it('does not borrow your own status', () => {
      setOwnStatus('dnd', 'My own message')
      presenceResult = { data: undefined }
      render(<ProfileHeader profileUser={otherProfile} />)

      expect(indicator()).not.toBeInTheDocument()
      expect(screen.queryByText('My own message')).not.toBeInTheDocument()
    })
  })
})
