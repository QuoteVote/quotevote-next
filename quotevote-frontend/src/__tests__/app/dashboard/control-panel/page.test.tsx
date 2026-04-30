import { render, screen, waitFor, fireEvent } from '@/__tests__/utils/test-utils'
import { resetStore } from '@/__tests__/utils/test-utils'
import { useAppStore } from '@/store/useAppStore'
import { USER_INVITE_REQUESTS } from '@/graphql/queries'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/dashboard/control-panel',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock responsive hook
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({ isSmallScreen: false, theme: { palette: { primary: { main: '#52b274' } } } }),
}))

let ControlPanelClient: React.ComponentType
beforeAll(async () => {
  const mod = await import('@/app/dashboard/control-panel/ControlPanelClient')
  ControlPanelClient = mod.default
})

const adminUser = {
  id: 'admin-1',
  _id: 'admin-1',
  username: 'admin',
  name: 'Admin User',
  email: 'admin@example.com',
  admin: true,
}

const regularUser = {
  id: 'user-1',
  _id: 'user-1',
  username: 'regular',
  name: 'Regular User',
  email: 'user@example.com',
  admin: false,
}

const inviteRequestsMock = {
  request: {
    query: USER_INVITE_REQUESTS,
  },
  result: {
    data: {
      userInviteRequests: [
        { _id: 'inv-1', email: 'invited@example.com', joined: '2026-01-15', status: '1' },
        { _id: 'inv-2', email: 'accepted@example.com', joined: '2026-02-20', status: '4' },
      ],
    },
  },
}

describe('Control Panel Page', () => {
  beforeEach(() => {
    resetStore()
    mockPush.mockClear()
  })

  it('denies access for non-admin users', () => {
    useAppStore.getState().setUserData(regularUser)
    render(<ControlPanelClient />)
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('renders control panel title for admin users', async () => {
    useAppStore.getState().setUserData(adminUser)
    render(<ControlPanelClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      // "Control Panel" appears in both mobile bar and desktop sidebar
      const titles = screen.getAllByText('Control Panel')
      expect(titles.length).toBeGreaterThan(0)
    })
  })

  it('shows all nav items for admin user', async () => {
    useAppStore.getState().setUserData(adminUser)
    render(<ControlPanelClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      // Nav labels appear in both mobile and desktop layouts
      expect(screen.getAllByText('Invites').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Statistics').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Featured').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Users').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Moderation').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Reports').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Bots').length).toBeGreaterThan(0)
    })
  })

  it('renders invite data after navigating to invites tab', async () => {
    useAppStore.getState().setUserData(adminUser)
    render(<ControlPanelClient />, { mocks: [inviteRequestsMock] })

    // Navigate to invites tab (appears in both mobile and desktop)
    await waitFor(() => {
      const invitesButtons = screen.getAllByText('Invites')
      expect(invitesButtons.length).toBeGreaterThan(0)
    })

    const invitesButtons = screen.getAllByText('Invites')
    fireEvent.click(invitesButtons[0]!)

    await waitFor(() => {
      const matches = screen.getAllByText('invited@example.com')
      expect(matches.length).toBeGreaterThan(0)
    })
  })

  it('shows invite count after navigating to invites tab', async () => {
    useAppStore.getState().setUserData(adminUser)
    render(<ControlPanelClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      const invitesButtons = screen.getAllByText('Invites')
      expect(invitesButtons.length).toBeGreaterThan(0)
    })

    const invitesButtons = screen.getAllByText('Invites')
    fireEvent.click(invitesButtons[0]!)

    await waitFor(() => {
      // Content renders in both mobile and desktop layouts
      const matches = screen.getAllByText('2 total requests')
      expect(matches.length).toBeGreaterThan(0)
    })
  })
})
