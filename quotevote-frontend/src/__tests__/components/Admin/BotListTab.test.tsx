import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { resetStore } from '@/__tests__/utils/test-utils'
import BotListTab from '@/components/Admin/BotListTab'
import { GET_BOT_REPORTED_USERS } from '@/graphql/queries'

// Mock responsive hook
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({ isSmallScreen: false }),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/dashboard/control-panel',
}))

const botReportsMock = {
  request: {
    query: GET_BOT_REPORTED_USERS,
    variables: { sortBy: 'botReports', limit: 100 },
  },
  result: {
    data: {
      getBotReportedUsers: [
        {
          _id: 'bot-1',
          name: 'Bot User',
          username: 'botuser',
          email: 'bot@example.com',
          botReports: 7,
          accountStatus: 'active',
          lastBotReportDate: '2026-03-01',
          joined: '2025-01-01',
          avatar: null,
          contributorBadge: false,
        },
        {
          _id: 'bot-2',
          name: 'Disabled Bot',
          username: 'disabledbot',
          email: 'disabled@example.com',
          botReports: 3,
          accountStatus: 'disabled',
          lastBotReportDate: '2026-02-15',
          joined: '2025-06-01',
          avatar: null,
          contributorBadge: false,
        },
      ],
    },
  },
}

const emptyBotReportsMock = {
  request: {
    query: GET_BOT_REPORTED_USERS,
    variables: { sortBy: 'botReports', limit: 100 },
  },
  result: {
    data: {
      getBotReportedUsers: [],
    },
  },
}

describe('BotListTab', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders bot reports with user data', async () => {
    render(<BotListTab />, { mocks: [botReportsMock] })

    await waitFor(() => {
      expect(screen.getByText('botuser')).toBeInTheDocument()
      expect(screen.getByText('bot@example.com')).toBeInTheDocument()
    })
  })

  it('shows report count badges', async () => {
    render(<BotListTab />, { mocks: [botReportsMock] })

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('shows disable button for active users', async () => {
    render(<BotListTab />, { mocks: [botReportsMock] })

    await waitFor(() => {
      const disableButtons = screen.getAllByText('Disable')
      expect(disableButtons.length).toBeGreaterThan(0)
    })
  })

  it('shows enable button for disabled users', async () => {
    render(<BotListTab />, { mocks: [botReportsMock] })

    await waitFor(() => {
      const enableButtons = screen.getAllByText('Enable')
      expect(enableButtons.length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no reports', async () => {
    render(<BotListTab />, { mocks: [emptyBotReportsMock] })

    await waitFor(() => {
      expect(screen.getByText('No bot reports found')).toBeInTheDocument()
    })
  })

  it('shows sort selector', async () => {
    render(<BotListTab />, { mocks: [botReportsMock] })

    await waitFor(() => {
      expect(screen.getByText('Sort By:')).toBeInTheDocument()
    })
  })
})
