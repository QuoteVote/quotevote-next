/**
 * Public directory at `/` (#454)
 *
 * Covers: compact header, search/filters, Latest default,
 * and no marketing landing sections.
 */

import { type ReactNode } from 'react'
import { render, screen } from '../utils/test-utils'
import { PublicDirectoryContent } from '@/app/components/PublicDirectory/PublicDirectoryContent'
import { AuthAwareHome } from '@/app/components/AuthAwareHome'
import { useAppStore } from '@/store'
import { useQuery } from '@apollo/client/react'

const mockPush = jest.fn()
const mockReplace = jest.fn()
let mockSearch = ''

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(mockSearch),
}))

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: jest.fn(() => ({
    data: {
      posts: { entities: [], pagination: { total_count: 0, limit: 20, offset: 0 } },
      tags: [],
    },
    loading: false,
    error: undefined,
    refetch: jest.fn(),
    fetchMore: jest.fn(),
  })),
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
}))

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: <T,>(value: T) => value,
}))

jest.mock('@/components/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

function renderDirectory() {
  return render(<PublicDirectoryContent />)
}

describe('Public directory (`/`)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAppStore.getState().clearUserData()
  })

  it('renders the public directory instead of the marketing landing page', () => {
    renderDirectory()
    expect(screen.getByTestId('public-directory')).toBeInTheDocument()
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument()
    expect(screen.queryByText(/share ideas/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/featured posts/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/our mission/i)).not.toBeInTheDocument()
  })

  it('shows compact navigation with About, Request Invite, and Menu', () => {
    renderDirectory()
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(
      screen.getByRole('link', { name: 'Request an invite to join Quote.Vote' })
    ).toHaveAttribute('href', '/auths/request-access')
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })

  it('places Search, Filters and Date range above the posts (#515)', () => {
    renderDirectory()
    expect(screen.getByTestId('directory-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('directory-search')).toHaveAttribute(
      'placeholder',
      'Search quotes, topics and sources'
    )
    // iOS Safari zooms focused inputs under 16px; text-base keeps mobile at 16px
    expect(screen.getByTestId('directory-search')).toHaveClass('text-base')
    expect(screen.queryByTestId('filter-latest')).not.toBeInTheDocument()
    expect(screen.getByTestId('filter-filters')).toBeInTheDocument()
    expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument()
    expect(screen.getByTestId('filter-date')).toBeInTheDocument()
  })

  it('shows a short body preview on directory cards without Show More (#474)', () => {
    const { useQuery } = jest.requireMock('@apollo/client/react') as {
      useQuery: jest.Mock
    }
    const defaultImpl = useQuery.getMockImplementation()
    useQuery.mockImplementation(() => ({
      data: {
        posts: {
          entities: [
            {
              _id: 'p1',
              title: 'Directory Quote',
              text: 'A short preview of the post body for guests.',
              url: '/post/general/directory-quote/p1',
              created: '2024-01-15T10:30:00Z',
              creator: { username: 'alice', name: 'Alice' },
              votes: [],
              comments: [],
              quotes: [],
              approvedBy: [],
              rejectedBy: [],
              bookmarkedBy: [],
            },
          ],
          pagination: { total_count: 1, limit: 20, offset: 0 },
        },
        tags: [],
      },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
      fetchMore: jest.fn(),
    }))

    try {
      renderDirectory()
      expect(
        screen.getByText('A short preview of the post body for guests.')
      ).toBeInTheDocument()
      expect(screen.queryByText('Show More')).not.toBeInTheDocument()
    } finally {
      if (defaultImpl) useQuery.mockImplementation(defaultImpl)
    }
  })

  it('keeps nav, search, and filters pinned above the scrolling post list on mobile', () => {
    renderDirectory()
    const chrome = screen.getByTestId('directory-sticky-chrome')
    const scroll = screen.getByTestId('directory-scroll')
    expect(chrome).toContainElement(screen.getByRole('navigation', { name: 'Main navigation' }))
    expect(chrome).toContainElement(screen.getByTestId('directory-toolbar'))
    expect(chrome).toHaveClass('shrink-0')
    expect(screen.getByTestId('public-directory')).toHaveClass(
      'h-dvh',
      'overflow-hidden',
      'md:h-auto',
      'md:overflow-visible'
    )
    expect(scroll).toHaveClass('overflow-y-auto', 'md:overflow-visible')
    expect(scroll).not.toContainElement(screen.getByTestId('directory-toolbar'))
  })

  it('does not redirect signed-in users since root is home', () => {
    useAppStore.getState().setUserData({
      _id: 'user-1',
      username: 'tester',
      name: 'Tester',
    })
    renderDirectory()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe('Authenticated directory (`/`)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearch = ''
    useAppStore.getState().setUserData({
      _id: 'user-1',
      username: 'tester',
      name: 'Tester',
    })
  })

  it('keeps search and filters pinned above the scrolling post list on mobile', () => {
    render(<AuthAwareHome />)
    const chrome = screen.getByTestId('directory-sticky-chrome')
    const scroll = screen.getByTestId('directory-scroll')
    expect(screen.getByTestId('authenticated-directory')).toBeInTheDocument()
    expect(chrome).toContainElement(screen.getByTestId('directory-toolbar'))
    expect(chrome).toHaveClass('shrink-0')
    expect(screen.getByTestId('authenticated-directory')).toHaveClass(
      'h-full',
      'overflow-hidden',
      'md:h-auto',
      'md:overflow-visible'
    )
    expect(scroll).toHaveClass('overflow-y-auto', 'md:overflow-visible')
    expect(scroll).not.toContainElement(screen.getByTestId('directory-toolbar'))
  })

  it('passes friendsOnly to the posts query when ?following=true', () => {
    mockSearch = 'following=true'
    render(<AuthAwareHome />)
    const calls = (useQuery as unknown as jest.Mock).mock.calls
    expect(calls.some(([, opts]) => opts?.variables?.friendsOnly === true)).toBe(true)
  })

  it('does not set friendsOnly without the param', () => {
    render(<AuthAwareHome />)
    const calls = (useQuery as unknown as jest.Mock).mock.calls
    expect(calls.some(([, opts]) => opts?.variables?.friendsOnly === true)).toBe(false)
  })
})
