/**
 * FollowInfo — list display against the backend's JSON-scalar response.
 *
 * `getUserFollowInfo` is a JSON scalar that returns an array of
 * { id, username, avatar, numFollowers, numFollowing } (same as the
 * monorepo). These tests render FollowInfo for real (direct useQuery mock,
 * no MockedProvider) and verify the list actually displays.
 */

import { render, screen } from '../../utils/test-utils';
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

const mockState = { user: { data: { _id: 'me', _followingId: ['u2'] } } };
jest.mock('@/store', () => ({
  useAppStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading" />,
}));

jest.mock('../../../components/Profile/UserFollowDisplay', () => ({
  UserFollowDisplay: ({ username, isFollowing }: { username: string; isFollowing: boolean }) => (
    <div data-testid="follow-row" data-following={isFollowing}>
      {username}
    </div>
  ),
}));

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
          { id: 'u1', username: 'bob', avatar: null, numFollowers: 1, numFollowing: 2 },
          { id: 'u2', username: 'carol', avatar: null, numFollowers: 3, numFollowing: 4 },
        ],
      },
    });

    render(<FollowInfo filter="followers" />);

    const rows = screen.getAllByTestId('follow-row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('carol')).toBeInTheDocument();
    expect(screen.getByText('2 Followers')).toBeInTheDocument();
    // viewer follows u2 (carol) per mocked _followingId
    expect(screen.getByText('carol').closest('[data-testid="follow-row"]'))
      .toHaveAttribute('data-following', 'true');
    expect(screen.getByText('bob').closest('[data-testid="follow-row"]'))
      .toHaveAttribute('data-following', 'false');
  });

  it('renders the empty state when the array is empty', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { getUserFollowInfo: [] },
    });

    render(<FollowInfo filter="following" />);

    expect(screen.getByTestId('no-followers')).toHaveTextContent('following');
    expect(screen.getByText('0 Following')).toBeInTheDocument();
  });
});
