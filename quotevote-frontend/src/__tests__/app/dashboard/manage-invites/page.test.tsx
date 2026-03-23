import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { resetStore } from '@/__tests__/utils/test-utils'
import { USER_INVITE_REQUESTS } from '@/graphql/queries'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/dashboard/manage-invites',
  useSearchParams: () => new URLSearchParams(),
}))

let ManageInvitesClient: React.ComponentType
beforeAll(async () => {
  const mod = await import('@/app/dashboard/manage-invites/ManageInvitesClient')
  ManageInvitesClient = mod.default
})

const inviteRequestsMock = {
  request: {
    query: USER_INVITE_REQUESTS,
  },
  result: {
    data: {
      userInviteRequests: [
        { _id: 'inv-1', email: 'pending@example.com', joined: '2026-01-15', status: '1' },
        { _id: 'inv-2', email: 'accepted@example.com', joined: '2026-02-20', status: '4' },
        { _id: 'inv-3', email: 'declined@example.com', joined: '2026-03-01', status: '2' },
      ],
    },
  },
}

const emptyInvitesMock = {
  request: {
    query: USER_INVITE_REQUESTS,
  },
  result: {
    data: {
      userInviteRequests: [],
    },
  },
}

describe('Manage Invites Page', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders the page title', async () => {
    render(<ManageInvitesClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      expect(screen.getByText('Manage Invites')).toBeInTheDocument()
    })
  })

  it('renders tabs for received and sent', async () => {
    render(<ManageInvitesClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /received requests/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /sent invites/i })).toBeInTheDocument()
    })
  })

  it('shows invite data', async () => {
    render(<ManageInvitesClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      const matches = screen.getAllByText('pending@example.com')
      expect(matches.length).toBeGreaterThan(0)
    })
  })

  it('shows correct counts in tab labels', async () => {
    render(<ManageInvitesClient />, { mocks: [inviteRequestsMock] })

    await waitFor(() => {
      // Received: 2 (status 1 and 2), Sent: 1 (status 4)
      expect(screen.getByText(/received requests \(2\)/i)).toBeInTheDocument()
      expect(screen.getByText(/sent invites \(1\)/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no invites', async () => {
    render(<ManageInvitesClient />, { mocks: [emptyInvitesMock] })

    await waitFor(() => {
      expect(screen.getByText('No invite requests')).toBeInTheDocument()
    })
  })
})
