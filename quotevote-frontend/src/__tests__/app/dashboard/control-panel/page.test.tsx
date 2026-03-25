import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
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
      expect(screen.getByText('Control Panel')).toBeInTheDocument()
    })
  })

  it('shows all tabs for admin user', async () => {
    useAppStore.getState().setUserData(adminUser)
    render(<ControlPanelClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /invites/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /statistics/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /featured/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /users/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /moderation/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /reports/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /bots/i })).toBeInTheDocument()
    })
  })

  it('renders invite data in the default invites tab', async () => {
    useAppStore.getState().setUserData(adminUser)
    render(<ControlPanelClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      const matches = screen.getAllByText('invited@example.com')
      expect(matches.length).toBeGreaterThan(0)
    })
  })

  it('shows invite count in the invites tab', async () => {
    useAppStore.getState().setUserData(adminUser)
    render(<ControlPanelClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      expect(screen.getByText(/User Invitation Requests \(2\)/)).toBeInTheDocument()
    })
  })
})
