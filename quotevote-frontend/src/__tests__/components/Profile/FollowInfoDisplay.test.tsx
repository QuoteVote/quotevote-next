/**
 * FollowInfo — list display against the backend's JSON-scalar response.
 *
 * `getUserFollowInfo` is a JSON scalar that returns an array of
 * { id, username, avatar, numFollowers, numFollowing } (same as the
 * monorepo). These tests render FollowInfo for real (direct useQuery mock,
 * no MockedProvider) and verify the list actually displays.
 */

import { render, screen, within } from '../../utils/test-utils';
import { FollowInfo } from '../../../components/Profile/FollowInfo';

const mockUseQuery = jest.fn();
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ username: 'alice' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

const mockState = {
  user: { data: { _id: 'me', username: 'me', _followingId: ['u2'] } },
  chat: { presenceMap: {} },
  setSelectedChatRoom: jest.fn(),
  setChatOpen: jest.fn(),
};
jest.mock('@/store', () => ({
  useAppStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading" />,
}));

jest.mock('@/components/CustomButtons/FollowButton', () => ({
  FollowButton: ({ username, isFollowing }: { username: string; isFollowing: boolean }) => (
    <button type="button" data-testid="follow-row" data-following={isFollowing}>
      {isFollowing ? 'Following' : 'Follow'} {username}
    </button>
  ),
}));

jest.mock('@/components/DisplayAvatar', () => ({ DisplayAvatar: () => <span /> }));

jest.mock('../../../components/Profile/NoFollowers', () => ({
  NoFollowers: ({ filter }: { filter: string }) => (
    <div data-testid="no-followers">{filter}</div>
  ),
}));

describe('FollowInfo — JSON scalar list display', () => {
  beforeEach(() => jest.clearAllMocks());

  it('queries with a nullable filter and no selection set', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined });
    render(<FollowInfo filter="followers" />);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ variables: { username: 'alice', filter: 'followers' } })
    );
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders the followers list from the scalar array', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: {
        getUserFollowInfo: [
          { id: 'u1', username: 'bob', name: 'Bob Stone', avatar: null, numFollowers: 1, numFollowing: 2 },
          { id: 'u2', username: 'carol', avatar: null, numFollowers: 3, numFollowing: 4 },
          { id: 'me', username: 'me', avatar: null, numFollowers: 0, numFollowing: 0 },
        ],
      },
    });

    render(<FollowInfo filter="followers" />);

    expect(screen.getAllByTestId('user-follow-display')).toHaveLength(3);
    // The display name leads, with the username under it; no name falls back to the username.
    expect(screen.getByRole('link', { name: 'Bob Stone' })).toHaveAttribute('href', '/profile/bob');
    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'carol' })).toHaveAttribute('href', '/profile/carol');
    expect(screen.getByRole('heading', { level: 1, name: '3 Followers' })).toBeInTheDocument();
    // Viewer follows u2 (carol) per the mocked _followingId; no Follow button on your own row.
    const buttons = screen.getAllByTestId('follow-row');
    expect(buttons).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Following carol' })).toHaveAttribute('data-following', 'true');
    expect(screen.getByRole('button', { name: 'Follow bob' })).toHaveAttribute('data-following', 'false');
    // Tabs between the two lists, the current one marked.
    const tabs = screen.getByRole('navigation', { name: 'Followers and following' });
    expect(within(tabs).getByRole('link', { name: /^Followers/ })).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getByRole('link', { name: /^Following/ })).toHaveAttribute('href', '/profile/alice/following');
  });

  it('renders the empty state when the array is empty', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { getUserFollowInfo: [] },
    });

    render(<FollowInfo filter="following" />);

    expect(screen.getByTestId('no-followers')).toHaveTextContent('following');
    expect(screen.getByRole('heading', { level: 1, name: '0 Following' })).toBeInTheDocument();
  });
});
