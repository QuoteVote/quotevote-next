/**
 * ProfileHeader — default avatar seed consistency
 *
 * The chat/message header seeds DisplayAvatar with the room title (the other
 * user's display name). The profile header must seed the default avatar with
 * the same value (`name || username`) so an unset avatar looks identical in
 * the profile section and in messages.
 */

import { render, screen } from '../../utils/test-utils';
import { ProfileHeader } from '../../../components/Profile/ProfileHeader';
import { useAppStore } from '@/store';
import { GET_CHAT_ROOM, GET_ROSTER } from '@/graphql/queries';
import type { ProfileUser } from '@/types/profile';
import type { DocumentNode } from 'graphql';

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn(), warning: jest.fn() }),
}));

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Expose the seed (`username` prop) DisplayAvatar receives.
jest.mock('@/components/DisplayAvatar', () => ({
  DisplayAvatar: ({ username }: { username?: string }) => (
    <div data-testid="avatar" data-seed={username ?? ''} />
  ),
}));

jest.mock('../../../components/CustomButtons/FollowButton', () => ({
  FollowButton: () => <button type="button">Follow</button>,
}));

jest.mock('../../../components/Profile/ProfileBadge', () => ({
  ProfileBadge: () => <div />,
  ProfileBadgeContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/hooks/useProfileBackground', () => ({
  useProfileBackground: () => ({ color: '#fff', pattern: 'none' }),
}));

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

function setupQueries() {
  mockUseQuery.mockImplementation((doc: DocumentNode) => {
    if (doc === GET_CHAT_ROOM) {
      return { data: { messageRoom: null }, loading: false, error: undefined };
    }
    if (doc === GET_ROSTER) {
      return { data: { getRoster: [] }, loading: false, error: undefined };
    }
    return { data: undefined, loading: false, error: undefined };
  });
}

const baseUser: ProfileUser = {
  _id: 'user1',
  username: 'testuser',
  name: 'Test User',
  _followingId: [],
  _followersId: [],
};

describe('ProfileHeader — default avatar seed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false, error: undefined }]);
    setupQueries();
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        data: { _id: 'currentuser', username: 'currentuser', name: 'Current User' },
      },
      setSelectedChatRoom: jest.fn(),
      setChatOpen: jest.fn(),
    });
  });

  it('seeds the default avatar with the display name (matches the chat header)', () => {
    render(<ProfileHeader profileUser={baseUser} />);
    // Chat Header seeds DisplayAvatar with room title = the user's name.
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-seed', 'Test User');
  });

  it('falls back to the username when the user has no name', () => {
    render(<ProfileHeader profileUser={{ ...baseUser, name: undefined }} />);
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-seed', 'testuser');
  });
});
