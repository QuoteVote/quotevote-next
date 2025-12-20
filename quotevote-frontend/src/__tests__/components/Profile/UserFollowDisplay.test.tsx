/**
 * UserFollowDisplay Component Tests
 * 
 * Tests for the UserFollowDisplay component including:
 * - Rendering user information
 * - Follow button integration
 * - Avatar display
 * - Link to user profile
 */

import { render, screen } from '../../utils/test-utils';
import { UserFollowDisplay } from '../../../components/Profile/UserFollowDisplay';

// Mock FollowButton
jest.mock('../../../components/CustomButtons/FollowButton', () => ({
  FollowButton: ({ isFollowing, username }: { isFollowing: boolean; username: string }) => (
    <button data-testid="follow-button" data-following={isFollowing}>
      {isFollowing ? 'Unfollow' : 'Follow'} {username}
    </button>
  ),
}));

// Mock Avatar (default export)
jest.mock('../../../components/Avatar', () => ({
  __esModule: true,
  default: ({ src, alt, size }: { src?: string; alt?: string; size?: number }) => (
    <div data-testid="avatar" data-src={src} data-alt={alt} data-size={String(size)}>
      Avatar
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
    const avatar = getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-src', 'https://example.com/avatar.jpg');
    expect(avatar).toHaveAttribute('data-alt', 'testuser');
    expect(avatar).toHaveAttribute('data-size', '50');
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
    expect(link).toHaveAttribute('href', '/profile/testuser');
  });

  it('handles object avatar structure', () => {
    const userWithObjectAvatar = {
      ...mockUser,
      avatar: {
        url: 'https://example.com/avatar2.jpg',
      },
    };
    const { getByTestId } = render(<UserFollowDisplay {...userWithObjectAvatar} />);
    const avatar = getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-src', 'https://example.com/avatar2.jpg');
  });

    it('handles missing avatar gracefully', () => {
      const userWithoutAvatar = {
        ...mockUser,
        avatar: undefined,
      };
      const { getByTestId } = render(<UserFollowDisplay {...userWithoutAvatar} />);
      const avatar = getByTestId('avatar');
      // Avatar src can be undefined or empty string
      const src = avatar.getAttribute('data-src');
      expect(src === '' || src === null || src === undefined).toBe(true);
    });
});

