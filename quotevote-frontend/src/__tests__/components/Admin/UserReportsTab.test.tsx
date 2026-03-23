import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { resetStore } from '@/__tests__/utils/test-utils'
import UserReportsTab from '@/components/Admin/UserReportsTab'
import { GET_USER_REPORTS } from '@/graphql/queries'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/dashboard/control-panel',
}))

const reportsMock = {
  request: {
    query: GET_USER_REPORTS,
  },
  result: {
    data: {
      getUserReports: [
        {
          _id: 'report-1',
          reportedUser: {
            _id: 'user-2',
            username: 'baduser',
            name: 'Bad User',
            avatar: null,
          },
          reportedBy: {
            _id: 'user-1',
            username: 'gooduser',
            name: 'Good User',
            avatar: null,
          },
          reason: 'spam',
          description: 'Spamming posts',
          severity: 'medium',
          created: '2026-03-10',
          status: 'pending',
        },
      ],
    },
  },
}

const emptyReportsMock = {
  request: {
    query: GET_USER_REPORTS,
  },
  result: {
    data: {
      getUserReports: [],
    },
  },
}

describe('UserReportsTab', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders user reports with data', async () => {
    render(<UserReportsTab />, { mocks: [reportsMock] })

    await waitFor(() => {
      const badusers = screen.getAllByText('@baduser')
      const goodusers = screen.getAllByText('@gooduser')
      expect(badusers.length).toBeGreaterThan(0)
      expect(goodusers.length).toBeGreaterThan(0)
    })
  })

  it('shows reason badge', async () => {
    render(<UserReportsTab />, { mocks: [reportsMock] })

    await waitFor(() => {
      const spamBadges = screen.getAllByText('spam')
      expect(spamBadges.length).toBeGreaterThan(0)
    })
  })

  it('shows disable and dismiss buttons', async () => {
    render(<UserReportsTab />, { mocks: [reportsMock] })

    await waitFor(() => {
      const disableButtons = screen.getAllByText('Disable')
      const dismissButtons = screen.getAllByText('Dismiss')
      expect(disableButtons.length).toBeGreaterThan(0)
      expect(dismissButtons.length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no reports', async () => {
    render(<UserReportsTab />, { mocks: [emptyReportsMock] })

    await waitFor(() => {
      expect(screen.getByText('No user reports')).toBeInTheDocument()
    })
  })

  it('shows count in header', async () => {
    render(<UserReportsTab />, { mocks: [reportsMock] })

    await waitFor(() => {
      expect(screen.getByText('User Reports (1)')).toBeInTheDocument()
    })
  })
})
