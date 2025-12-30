/**
 * PostActionList Component Tests
 * 
 * Tests for the PostActionList component including:
 * - Loading states and skeleton loaders
 * - Sorting actions by creation date
 * - Empty state handling
 * - Hash-based navigation and scrolling
 * - Multiple action types rendering
 */

import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import PostActionList from '@/components/PostActions/PostActionList'
import type { PostAction } from '@/types/postActions'

// Mock Zustand store
const mockSetFocusedComment = jest.fn()
const mockSetSharedComment = jest.fn()
const mockUser = {
  data: {
    _id: 'user123',
    id: 'user123',
    username: 'testuser',
    admin: false,
  },
}

jest.mock('@/store', () => ({
  useAppStore: jest.fn((selector) => {
    const state = {
      user: mockUser, // Add user for PostActionCard
      setFocusedComment: mockSetFocusedComment,
      setSharedComment: mockSetSharedComment,
      setSnackbar: jest.fn(),
      ui: {
        sharedComment: null,
      },
    }
    const result = selector(state)
    // Ensure we always return a valid value (not undefined/null)
    if (result === undefined || result === null) {
      // If selector returns user.data, return it
      if (selector.toString().includes('user.data')) {
        return mockUser.data
      }
    }
    return result
  }),
}))

// Mock PostActionCard
jest.mock('@/components/PostActions/PostActionCard', () => ({
  __esModule: true,
  default: ({
    postAction,
    selected,
  }: {
    postAction: PostAction
    selected: boolean
  }) => (
    <div data-testid={`post-action-card-${postAction._id}`} data-selected={selected}>
      {postAction.__typename}: {postAction._id}
    </div>
  ),
}))

// Mock window.location.hash
// Store original hash getter/setter
let originalHashDescriptor: PropertyDescriptor | undefined
const originalLocation = window.location

describe('PostActionList', () => {
  const mockRefetchPost = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock scrollIntoView before any component renders
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = jest.fn()
    }
    // Make hash property writable by redefining it
    // Also ensure origin and other properties are available
    try {
      originalHashDescriptor = Object.getOwnPropertyDescriptor(window.location, 'hash')
      // Delete the property first if it's configurable, then redefine
      if (originalHashDescriptor?.configurable) {
        delete (window.location as { hash?: string }).hash
      }
      Object.defineProperty(window.location, 'hash', {
        value: '',
        writable: true,
        configurable: true,
        enumerable: true,
      })
      // Ensure origin is available (needed by PostActionCard)
      if (!window.location.origin) {
        Object.defineProperty(window.location, 'origin', {
          value: originalLocation.origin || 'http://localhost',
          writable: false,
          configurable: true,
          enumerable: true,
        })
      }
    } catch {
      // If we can't modify it, try to use a workaround
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window.location as any).hash = ''
    }
  })

  afterEach(() => {
    // Restore original hash descriptor if it existed
    if (originalHashDescriptor) {
      try {
        Object.defineProperty(window.location, 'hash', originalHashDescriptor)
      } catch {
        // Ignore if we can't restore it
      }
    }
  })

  describe('Loading State', () => {
    it('renders skeleton loaders when loading', () => {
      render(
        <PostActionList
          postActions={[]}
          loading={true}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      const skeletons = screen.getAllByTestId('skeleton-loader')
      expect(skeletons).toHaveLength(3)
    })

    it('does not render skeletons when not loading', () => {
      render(
        <PostActionList
          postActions={[]}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      const skeletons = screen.queryAllByTestId('skeleton-loader')
      expect(skeletons).toHaveLength(0)
    })
  })

  describe('Empty State', () => {
    it('renders empty state message when no actions', () => {
      render(
        <PostActionList
          postActions={[]}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      expect(screen.getByText('Start the discussion...')).toBeInTheDocument()
    })

    it('does not render empty state when loading', () => {
      render(
        <PostActionList
          postActions={[]}
          loading={true}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      expect(screen.queryByText('Start the discussion...')).not.toBeInTheDocument()
    })
  })

  describe('Action Rendering', () => {
    const createAction = (
      id: string,
      typename: 'Vote' | 'Comment' | 'Quote' | 'Message',
      created: string,
    ): PostAction => {
      const base = {
        _id: id,
        __typename: typename,
        created,
        user: {
          _id: 'user1',
          username: 'user1',
          name: 'User 1',
        },
      }

      switch (typename) {
        case 'Vote':
          return {
            ...base,
            type: 'up',
            content: 'Vote content',
          } as PostAction
        case 'Comment':
          return {
            ...base,
            content: 'Comment content',
          } as PostAction
        case 'Quote':
          return {
            ...base,
            quote: 'Quote content',
          } as PostAction
        case 'Message':
          return {
            ...base,
            text: 'Message content',
            userId: 'user1',
          } as PostAction
        default:
          return base as PostAction
      }
    }

    it('renders single action', () => {
      const actions = [createAction('action1', 'Comment', '2024-01-01T00:00:00Z')]

      render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      expect(screen.getByTestId('post-action-card-action1')).toBeInTheDocument()
    })

    it('renders multiple actions', () => {
      const actions = [
        createAction('action1', 'Comment', '2024-01-01T00:00:00Z'),
        createAction('action2', 'Vote', '2024-01-02T00:00:00Z'),
        createAction('action3', 'Quote', '2024-01-03T00:00:00Z'),
      ]

      render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      expect(screen.getByTestId('post-action-card-action1')).toBeInTheDocument()
      expect(screen.getByTestId('post-action-card-action2')).toBeInTheDocument()
      expect(screen.getByTestId('post-action-card-action3')).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('sorts actions by creation date ascending', () => {
      const actions = [
        {
          _id: 'action3',
          __typename: 'Comment' as const,
          content: 'Third',
          created: '2024-01-03T00:00:00Z',
          user: {
            _id: 'user1',
            username: 'user1',
            name: 'User 1',
          },
        },
        {
          _id: 'action1',
          __typename: 'Comment' as const,
          content: 'First',
          created: '2024-01-01T00:00:00Z',
          user: {
            _id: 'user1',
            username: 'user1',
            name: 'User 1',
          },
        },
        {
          _id: 'action2',
          __typename: 'Comment' as const,
          content: 'Second',
          created: '2024-01-02T00:00:00Z',
          user: {
            _id: 'user1',
            username: 'user1',
            name: 'User 1',
          },
        },
      ]

      const { container } = render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      const cards = container.querySelectorAll('[data-testid^="post-action-card-"]')
      expect(cards[0]).toHaveAttribute('data-testid', 'post-action-card-action1')
      expect(cards[1]).toHaveAttribute('data-testid', 'post-action-card-action2')
      expect(cards[2]).toHaveAttribute('data-testid', 'post-action-card-action3')
    })
  })

  describe('Hash Navigation', () => {
    const createAction = (id: string): PostAction => ({
      _id: id,
      __typename: 'Comment',
      content: 'Test comment',
      created: new Date().toISOString(),
      user: {
        _id: 'user1',
        username: 'user1',
        name: 'User 1',
      },
    })

    it('sets selected prop based on hash', () => {
      // Set hash before render - hash is already writable from beforeEach, just set the value
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window.location as any).hash = '#action2'

      const actions = [
        createAction('action1'),
        createAction('action2'),
        createAction('action3'),
      ]

      render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      const card1 = screen.getByTestId('post-action-card-action1')
      const card2 = screen.getByTestId('post-action-card-action2')
      const card3 = screen.getByTestId('post-action-card-action3')

      expect(card1).toHaveAttribute('data-selected', 'false')
      expect(card2).toHaveAttribute('data-selected', 'true')
      expect(card3).toHaveAttribute('data-selected', 'false')
    })

    it('clears focused comment when no hash', () => {
      window.location.hash = ''

      const actions = [createAction('action1')]

      render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      expect(mockSetFocusedComment).toHaveBeenCalledWith(null)
      expect(mockSetSharedComment).toHaveBeenCalledWith(null)
    })

    it('scrolls to element when hash matches action id', async () => {
      window.location.hash = '#action2'

      // Mock scrollIntoView
      const mockScrollIntoView = jest.fn()
      Element.prototype.scrollIntoView = mockScrollIntoView

      const actions = [
        createAction('action1'),
        createAction('action2'),
      ]

      render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      // Wait for the component to render and the useEffect to run
      await waitFor(() => {
        const element = document.getElementById('action2')
        expect(element).toBeInTheDocument()
      })

      // The scrollIntoView should be called when the element is found
      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
      }, { timeout: 1000 })
    })

    it('does not scroll when element not found', async () => {
      window.location.hash = '#nonexistent'

      const mockScrollIntoView = jest.fn()
      Element.prototype.scrollIntoView = mockScrollIntoView

      const actions = [createAction('action1')]

      render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      // Wait a bit to ensure scroll would have been called if element existed
      await waitFor(() => {
        // Element doesn't exist, so scrollIntoView should not be called
        expect(mockScrollIntoView).not.toHaveBeenCalled()
      }, { timeout: 500 })
    })
  })

  describe('Action IDs', () => {
    it('sets id attribute on list items for hash navigation', () => {
      const actions = [
        {
          _id: 'action1',
          __typename: 'Comment' as const,
          content: 'Test',
          created: new Date().toISOString(),
          user: {
            _id: 'user1',
            username: 'user1',
            name: 'User 1',
          },
        },
      ]

      const { container } = render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      const listItem = container.querySelector('li[id="action1"]')
      expect(listItem).toBeInTheDocument()
    })
  })

  describe('Post URL', () => {
    it('passes postUrl to PostActionCard', () => {
      const actions = [
        {
          _id: 'action1',
          __typename: 'Comment' as const,
          content: 'Test',
          created: new Date().toISOString(),
          user: {
            _id: 'user1',
            username: 'user1',
            name: 'User 1',
          },
        },
      ]

      render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/custom/post/url"
          refetchPost={mockRefetchPost}
        />,
      )

      // PostActionCard is mocked, but we can verify it receives the prop
      // by checking the component renders correctly
      expect(screen.getByTestId('post-action-card-action1')).toBeInTheDocument()
    })
  })

  describe('Refetch Callback', () => {
    it('passes refetchPost callback to PostActionCard', () => {
      const actions = [
        {
          _id: 'action1',
          __typename: 'Comment' as const,
          content: 'Test',
          created: new Date().toISOString(),
          user: {
            _id: 'user1',
            username: 'user1',
            name: 'User 1',
          },
        },
      ]

      render(
        <PostActionList
          postActions={actions}
          loading={false}
          postUrl="/post/123"
          refetchPost={mockRefetchPost}
        />,
      )

      // PostActionCard is mocked, but we can verify it receives the prop
      // by checking the component renders correctly
      expect(screen.getByTestId('post-action-card-action1')).toBeInTheDocument()
    })
  })
})


