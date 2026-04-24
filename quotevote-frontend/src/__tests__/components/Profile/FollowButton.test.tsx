import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock Apollo useMutation
const mockFollowMutation = jest.fn().mockResolvedValue({ data: { followUser: { _id: 'profile-user-id' } } });
jest.mock('@apollo/client/react', () => ({
  useMutation: () => [mockFollowMutation, { loading: false }],
}));

// Mock the store
const mockUpdateFollowing = jest.fn();
jest.mock('@/store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      user: {
        data: {
          id: 'current-user-id',
          _id: 'current-user-id',
          _followingId: [],
          username: 'testuser',
        },
      },
      updateFollowing: mockUpdateFollowing,
    }),
}));

// Mock useGuestGuard
jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: () => () => true,
}));

import { FollowButton } from '@/components/CustomButtons/FollowButton';

describe('FollowButton', () => {
  beforeEach(() => {
    mockUpdateFollowing.mockClear();
    mockFollowMutation.mockClear();
  });

  it('renders Follow button when not following', () => {
    render(
      <FollowButton
        isFollowing={false}
        profileUserId="profile-user-id"
        username="targetuser"
      />
    );
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('renders Un-Follow button when following', () => {
    render(
      <FollowButton
        isFollowing={true}
        profileUserId="profile-user-id"
        username="targetuser"
      />
    );
    expect(screen.getByText('Un-Follow')).toBeInTheDocument();
  });

  it('calls optimistic update on follow click', async () => {
    render(
      <FollowButton
        isFollowing={false}
        profileUserId="profile-user-id"
        username="targetuser"
      />
    );

    fireEvent.click(screen.getByText('Follow'));

    await waitFor(() => {
      expect(mockUpdateFollowing).toHaveBeenCalledWith(['profile-user-id']);
    });
  });

  it('calls mutation with correct variables on follow', async () => {
    render(
      <FollowButton
        isFollowing={false}
        profileUserId="profile-user-id"
        username="targetuser"
      />
    );

    fireEvent.click(screen.getByText('Follow'));

    await waitFor(() => {
      expect(mockFollowMutation).toHaveBeenCalledWith({
        variables: { user_id: 'profile-user-id', action: 'follow' },
      });
    });
  });

  it('renders icon-only button when showIcon is true', () => {
    render(
      <FollowButton
        isFollowing={false}
        profileUserId="profile-user-id"
        username="targetuser"
        showIcon
      />
    );
    expect(screen.getByLabelText('Follow')).toBeInTheDocument();
  });

  it('renders unfollow icon when showIcon is true and following', () => {
    render(
      <FollowButton
        isFollowing={true}
        profileUserId="profile-user-id"
        username="targetuser"
        showIcon
      />
    );
    expect(screen.getByLabelText('Unfollow')).toBeInTheDocument();
  });
});
