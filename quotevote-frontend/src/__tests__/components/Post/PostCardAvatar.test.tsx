/**
 * PostCard — default avatar seed consistency
 *
 * The post card must seed the default avatar with the same value the
 * profile/chat use (display name, falling back to username) so an unset
 * avatar looks identical across the post card, profile and messages.
 * The visible author label still shows the username.
 */

import { render, screen } from '../../utils/test-utils'
import PostCard from '../../../components/Post/PostCard'
import type { PostCardProps } from '@/types/post'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const mockState = {
  setSelectedPost: jest.fn(),
  user: { data: { _id: 'currentuser' } },
}
jest.mock('@/store', () => ({
  useAppStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}))

jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: () => () => true,
}))

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: () => ({ data: undefined, loading: false, error: undefined }),
  useMutation: () => [jest.fn(), { loading: false, error: undefined }],
}))

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }),
}))

jest.mock('@/components/HighlightText/HighlightText', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <span>{text}</span>,
}))

jest.mock('@/components/DisplayAvatar', () => ({
  DisplayAvatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-seed={username ?? ''} />
  ),
}))

const baseProps: PostCardProps = {
  _id: 'post1',
  text: 'This is the post content.',
  title: 'Test Post Title',
  url: 'https://example.com/post',
  created: '2024-01-15T10:30:00Z',
  creator: {
    _id: 'user1',
    username: 'testuser',
    name: 'Test User',
    avatar: undefined,
  },
  votes: [],
  comments: [],
  quotes: [],
  approvedBy: [],
  rejectedBy: [],
  bookmarkedBy: [],
  activityType: 'POSTED',
  limitText: false,
}

describe('PostCard — default avatar seed', () => {
  beforeEach(() => jest.clearAllMocks())

  it('seeds the default avatar with the display name (matches profile/chat)', () => {
    render(<PostCard {...baseProps} />)
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-seed', 'Test User')
  })

  it('falls back to the username when the creator has no name', () => {
    render(
      <PostCard {...baseProps} creator={{ ...baseProps.creator!, name: undefined }} />
    )
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-seed', 'testuser')
  })

  it('still shows the username as the visible author label', () => {
    render(<PostCard {...baseProps} />)
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })
})
