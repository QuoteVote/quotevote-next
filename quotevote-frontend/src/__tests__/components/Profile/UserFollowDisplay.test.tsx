/**
 * UserFollowDisplay Component Tests
 */

import { render, screen } from '../../utils/test-utils';
import { UserFollowDisplay } from '../../../components/Profile/UserFollowDisplay';

jest.mock('../../../components/CustomButtons/FollowButton', () => ({
  FollowButton: ({ isFollowing, username }: { isFollowing: boolean; username: string }) => (
    <button data-testid="follow-button" data-following={isFollowing}>
      {isFollowing ? 'Unfollow' : 'Follow'} {username}
    </button>
  ),
}));

jest.mock('../../../components/DisplayAvatar', () => ({
  DisplayAvatar: ({
    avatar,
    username,
    size,
  }: {
    avatar?: unknown;
    username?: string;
    size?: number;
  }) => (
    <div
      data-testid="display-avatar"
      data-avatar={JSON.stringify(avatar)}
      data-username={username}
      data-size={String(size)}
    >
      DisplayAvatar
    </div>
  ),
}));

const mockUser = {
  id: 'user1',
  username: 'testuser',
  avatar: 'https://example.com/avatar.jpg',
  numFollowers: 10,
  numFollowing: 5,
  isFollowing: false,
  profileUserId: 'currentuser',
};

describe('UserFollowDisplay', () => {
  it('renders user username', () => {
    render(<UserFollowDisplay {...mockUser} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('renders follower and following counts', () => {
    render(<UserFollowDisplay {...mockUser} />);
    expect(screen.getByText(/10 followers 5 following/)).toBeInTheDocument();
  });

  it('renders avatar with correct props', () => {
    const { getByTestId } = render(<UserFollowDisplay {...mockUser} />);
    const avatar = getByTestId('display-avatar');
    expect(avatar).toHaveAttribute('data-username', 'testuser');
    expect(avatar).toHaveAttribute('data-size', '50');
    expect(avatar).toHaveAttribute('data-avatar', '"https://example.com/avatar.jpg"');
  });

  it('renders follow button when not following', () => {
    render(<UserFollowDisplay {...mockUser} isFollowing={false} />);
    const followButton = screen.getByTestId('follow-button');
    expect(followButton).toHaveAttribute('data-following', 'false');
    expect(screen.getByText(/Follow testuser/)).toBeInTheDocument();
  });

  it('renders unfollow button when following', () => {
    render(<UserFollowDisplay {...mockUser} isFollowing={true} />);
    const followButton = screen.getByTestId('follow-button');
    expect(followButton).toHaveAttribute('data-following', 'true');
    expect(screen.getByText(/Unfollow testuser/)).toBeInTheDocument();
  });

  it('has link to user profile', () => {
    render(<UserFollowDisplay {...mockUser} />);
    const link = screen.getByText('testuser').closest('a');
    expect(link).toHaveAttribute('href', '/dashboard/profile/testuser');
  });

  it('handles object avatar structure', () => {
    const userWithObjectAvatar = {
      ...mockUser,
      avatar: { url: 'https://example.com/avatar2.jpg' },
    };
    const { getByTestId } = render(<UserFollowDisplay {...userWithObjectAvatar} />);
    const avatar = getByTestId('display-avatar');
    expect(avatar).toHaveAttribute(
      'data-avatar',
      JSON.stringify({ url: 'https://example.com/avatar2.jpg' })
    );
  });

  it('handles missing avatar gracefully (shows default cartoon)', () => {
    const { getByTestId } = render(
      <UserFollowDisplay {...mockUser} avatar={undefined} />
    );
    // DisplayAvatar always renders — it generates a default when no avatar is set
    expect(getByTestId('display-avatar')).toBeInTheDocument();
    expect(getByTestId('display-avatar')).toHaveAttribute('data-username', 'testuser');
  });
});
