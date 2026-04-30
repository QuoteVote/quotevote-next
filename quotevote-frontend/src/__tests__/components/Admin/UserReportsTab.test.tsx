import { render, screen, waitFor, fireEvent } from '@/__tests__/utils/test-utils'
import { resetStore } from '@/__tests__/utils/test-utils'
import UserReportsTab from '@/components/Admin/UserReportsTab'
import { GET_USER_REPORTS, GET_USERS } from '@/graphql/queries'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/dashboard/control-panel',
}))

const usersMock = {
  request: {
    query: GET_USERS,
    variables: { limit: 1000, offset: 0 },
  },
  result: {
    data: {
      users: [
        { _id: 'user-1', username: 'gooduser', name: 'Good User', contributorBadge: false },
        { _id: 'user-2', username: 'baduser', name: 'Bad User', contributorBadge: false },
      ],
    },
  },
}

const reportsMock = {
  request: {
    query: GET_USER_REPORTS,
    variables: { userId: 'user-2' },
  },
  result: {
    data: {
      getUserReports: [
        {
          _id: 'report-1',
          _reporterId: 'user-1',
          _reportedUserId: 'user-2',
          reason: 'spam',
          description: 'Spamming posts',
          severity: 'medium',
          status: 'pending',
          createdAt: '2026-03-10T00:00:00.000Z',
        },
      ],
    },
  },
}

const emptyReportsMock = {
  request: {
    query: GET_USER_REPORTS,
    variables: { userId: 'user-2' },
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

  it('renders the user lookup panel', async () => {
    render(<UserReportsTab />, { mocks: [usersMock] })

    await waitFor(() => {
      expect(screen.getByText('User Lookup')).toBeInTheDocument()
    })
  })

  it('shows "no user selected" state initially', async () => {
    render(<UserReportsTab />, { mocks: [usersMock] })

    await waitFor(() => {
      expect(screen.getByText('No user selected')).toBeInTheDocument()
    })
  })

  it('shows user list after loading', async () => {
    render(<UserReportsTab />, { mocks: [usersMock] })

    await waitFor(() => {
      expect(screen.getByText('@gooduser')).toBeInTheDocument()
      expect(screen.getByText('@baduser')).toBeInTheDocument()
    })
  })

  it('shows reports after selecting a user', async () => {
    render(<UserReportsTab />, { mocks: [usersMock, reportsMock] })

    await waitFor(() => {
      expect(screen.getByText('@baduser')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByText('@baduser')[0]!)

    await waitFor(() => {
      const spamBadges = screen.getAllByText('spam')
      expect(spamBadges.length).toBeGreaterThan(0)
    })
  })

  it('shows report count after selecting a user', async () => {
    render(<UserReportsTab />, { mocks: [usersMock, reportsMock] })

    await waitFor(() => {
      expect(screen.getByText('@baduser')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByText('@baduser')[0]!)

    await waitFor(() => {
      const reportCountElements = screen.getAllByText(/1 report/)
      expect(reportCountElements.length).toBeGreaterThan(0)
    })
  })

  it('shows empty reports state when user has no reports', async () => {
    render(<UserReportsTab />, { mocks: [usersMock, emptyReportsMock] })

    await waitFor(() => {
      expect(screen.getByText('@baduser')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByText('@baduser')[0]!)

    await waitFor(() => {
      expect(screen.getByText('No reports')).toBeInTheDocument()
    })
  })
})
