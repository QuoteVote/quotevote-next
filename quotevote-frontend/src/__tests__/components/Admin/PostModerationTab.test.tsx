import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { resetStore } from '@/__tests__/utils/test-utils'
import { useAppStore } from '@/store/useAppStore'
import PostModerationTab from '@/components/Admin/PostModerationTab'
import { GET_TOP_POSTS } from '@/graphql/queries'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/dashboard/control-panel',
}))

const adminUser = {
  id: 'admin-1',
  _id: 'admin-1',
  username: 'admin',
  admin: true,
}

const postsMock = {
  request: {
    query: GET_TOP_POSTS,
    variables: {
      limit: 50,
      offset: 0,
      searchKey: '',
      startDateRange: null,
      endDateRange: null,
      friendsOnly: false,
      interactions: false,
    },
  },
  result: {
    data: {
      posts: {
        entities: [
          {
            _id: 'post-1',
            userId: 'user-1',
            groupId: 'group-1',
            title: 'Unapproved Post',
            text: 'This post needs moderation',
            upvotes: 0,
            downvotes: 0,
            bookmarkedBy: [],
            created: '2026-03-15',
            url: '/post-1',
            citationUrl: null,
            rejectedBy: [],
            approvedBy: [],
            creator: { _id: 'user-1', name: 'Author', username: 'author', avatar: null, contributorBadge: false },
            votes: [],
            comments: [],
            quotes: [],
            messageRoom: null,
          },
          {
            _id: 'post-2',
            userId: 'user-2',
            groupId: 'group-1',
            title: 'Approved Post',
            text: 'Already approved',
            upvotes: 5,
            downvotes: 0,
            bookmarkedBy: [],
            created: '2026-03-10',
            url: '/post-2',
            citationUrl: null,
            rejectedBy: [],
            approvedBy: ['admin-1'],
            creator: { _id: 'user-2', name: 'Author 2', username: 'author2', avatar: null, contributorBadge: false },
            votes: [],
            comments: [],
            quotes: [],
            messageRoom: null,
          },
        ],
        pagination: { total_count: 2, limit: 50, offset: 0 },
      },
    },
  },
}

describe('PostModerationTab', () => {
  beforeEach(() => {
    resetStore()
    useAppStore.getState().setUserData(adminUser)
  })

  it('renders pending posts for moderation', async () => {
    render(<PostModerationTab />, { mocks: [postsMock] })

    await waitFor(() => {
      const matches = screen.getAllByText('Unapproved Post')
      expect(matches.length).toBeGreaterThan(0)
    })
  })

  it('shows only unapproved posts', async () => {
    render(<PostModerationTab />, { mocks: [postsMock] })

    await waitFor(() => {
      const matches = screen.getAllByText('Unapproved Post')
      expect(matches.length).toBeGreaterThan(0)
      // The approved post should not be in the moderation list
      expect(screen.queryByText('Approved Post')).not.toBeInTheDocument()
    })
  })

  it('shows pending count', async () => {
    render(<PostModerationTab />, { mocks: [postsMock] })

    await waitFor(() => {
      // Pending count and label are rendered in separate spans
      expect(screen.getByText('posts pending review')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('shows approve and reject buttons', async () => {
    render(<PostModerationTab />, { mocks: [postsMock] })

    await waitFor(() => {
      const approveButtons = screen.getAllByText('Approve')
      const rejectButtons = screen.getAllByText('Reject')
      expect(approveButtons.length).toBeGreaterThan(0)
      expect(rejectButtons.length).toBeGreaterThan(0)
    })
  })
})
