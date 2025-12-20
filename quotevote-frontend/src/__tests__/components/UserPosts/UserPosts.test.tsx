/**
 * UserPosts Component Tests
 * 
 * Basic tests for the UserPosts component
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import { UserPosts } from '@/components/UserPosts'
import { useAppStore } from '@/store'
import type { Post } from '@/types/post'
import React from 'react'

// Mock Apollo Client
const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

// Mock queries
jest.mock('@/graphql/queries', () => ({
  GET_TOP_POSTS: { kind: 'Document', definitions: [] },
}))

// Mock hooks
jest.mock('@/hooks/usePagination', () => ({
  usePagination: () => ({
    currentPage: 1,
    pageSize: 15,
    handlePageChange: jest.fn(),
    handlePageSizeChange: jest.fn(),
    resetToFirstPage: jest.fn(),
    calculatePagination: jest.fn(),
  }),
}))

// Mock ErrorBoundary to pass through children
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock child components
jest.mock('@/components/UserPosts/PostCard', () => ({
  PostCard: ({ post }: { post: Post }) => (
    <div data-testid={`post-card-${post._id}`}>{post.title}</div>
  ),
}))

jest.mock('@/components/common/PaginatedList', () => ({
  PaginatedList: ({ children, data, loading, error, renderEmpty, renderError, renderLoading }: {
    children?: React.ReactNode
    data?: unknown[]
    loading?: boolean
    error?: Error | { message?: string }
    renderEmpty?: () => React.ReactNode
    renderError?: (error: Error | { message?: string }) => React.ReactNode
    renderLoading?: () => React.ReactNode
  }) => {
    if (loading && renderLoading) return renderLoading()
    if (error && renderError) return renderError(error)
    if ((!data || data.length === 0) && renderEmpty) return renderEmpty()
    return <div data-testid="paginated-list">{children}</div>
  },
}))

describe('UserPosts Component', () => {
  const mockUserId = 'user123'
  const mockRefetch = jest.fn()

  // Mock window.scrollTo to prevent console errors in tests
  beforeAll(() => {
    Object.defineProperty(window, 'scrollTo', {
      writable: true,
      value: jest.fn(),
    })
  })

  const mockPosts: Post[] = [
    {
      _id: 'post1',
      userId: mockUserId,
      created: '2024-01-01T00:00:00Z',
      title: 'Test Post 1',
      text: 'Content 1',
      upvotes: 10,
      downvotes: 2,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    useAppStore.setState({
      ui: {
        ...useAppStore.getState().ui,
        hiddenPosts: [],
      },
    })

    mockUseQuery.mockReturnValue({
      loading: false,
      error: null,
      data: {
        posts: {
          entities: mockPosts,
          pagination: { total_count: 1, limit: 15, offset: 0 },
        },
      },
      refetch: mockRefetch,
    })
  })

  it('renders successfully with posts', async () => {
    await act(async () => {
      render(<UserPosts userId={mockUserId} />)
    })
    await waitFor(() => {
      expect(screen.getByTestId('paginated-list')).toBeInTheDocument()
    })
  })

  it('shows loading state', async () => {
    mockUseQuery.mockReturnValue({
      loading: true,
      error: null,
      data: undefined,
      refetch: mockRefetch,
    })

    let container: HTMLElement
    await act(async () => {
      const result = render(<UserPosts userId={mockUserId} />)
      container = result.container
    })
    // Loading state shows skeleton cards with animate-pulse
    const skeletonCards = container!.querySelectorAll('.animate-pulse')
    expect(skeletonCards.length).toBeGreaterThan(0)
  })

  it('shows error state', async () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: new Error('Test error'),
      data: undefined,
      refetch: mockRefetch,
    })

    await act(async () => {
      render(<UserPosts userId={mockUserId} />)
    })
    await waitFor(() => {
      expect(screen.getByText(/error loading posts/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no posts', async () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: null,
      data: {
        posts: {
          entities: [],
          pagination: { total_count: 0, limit: 15, offset: 0 },
        },
      },
      refetch: mockRefetch,
    })

    await act(async () => {
      render(<UserPosts userId={mockUserId} />)
    })
    await waitFor(() => {
      expect(screen.getByText(/no posts found/i)).toBeInTheDocument()
    })
  })

  it('renders post cards', async () => {
    await act(async () => {
      render(<UserPosts userId={mockUserId} />)
    })
    await waitFor(() => {
      expect(screen.getByTestId('post-card-post1')).toBeInTheDocument()
    })
  })

  it('calls useQuery with userId', async () => {
    await act(async () => {
      render(<UserPosts userId={mockUserId} />)
    })
    expect(mockUseQuery).toHaveBeenCalled()
    const callArgs = mockUseQuery.mock.calls[0]
    expect(callArgs[1].variables.userId).toBe(mockUserId)
  })
})
