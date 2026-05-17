/**
 * ProfileHeader — cover banner background
 *
 * Another user's profile defaults to the brand green zigzag cover.
 * Your own profile uses the customizable (color, pattern) preference.
 */

import { render, screen } from '../../utils/test-utils';
import { ProfileHeader } from '../../../components/Profile/ProfileHeader';
import { useAppStore } from '@/store';
import { GET_CHAT_ROOM, GET_ROSTER } from '@/graphql/queries';
import {
  DEFAULT_PROFILE_BG_COLOR,
  DEFAULT_PROFILE_BG_PATTERN,
  getProfileBackgroundStyle,
} from '@/lib/utils/profileBackground';
import type { ProfileUser } from '@/types/profile';
import type { DocumentNode } from 'graphql';

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn(), warning: jest.fn() }),
}));

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock('@/components/DisplayAvatar', () => ({
  DisplayAvatar: () => <div data-testid="avatar" />,
}));

jest.mock('../../../components/CustomButtons/FollowButton', () => ({
  FollowButton: () => <button type="button">Follow</button>,
}));

jest.mock('../../../components/Profile/ProfileBadge', () => ({
  ProfileBadge: () => <div />,
  ProfileBadgeContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Distinct custom preference so the own-profile case is distinguishable.
const CUSTOM_BG = { color: '#ec4899', pattern: 'dots' as const };
jest.mock('@/hooks/useProfileBackground', () => ({
  useProfileBackground: () => CUSTOM_BG,
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

const otherUser: ProfileUser = {
  _id: 'user1',
  username: 'testuser',
  name: 'Test User',
  _followingId: [],
  _followersId: [],
};

describe('ProfileHeader — cover banner background', () => {
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

  it("defaults another user's cover to the brand green zigzag", () => {
    render(<ProfileHeader profileUser={otherUser} />);

    const cover = screen.getByTestId('profile-cover');
    const expected = getProfileBackgroundStyle(
      DEFAULT_PROFILE_BG_COLOR,
      DEFAULT_PROFILE_BG_PATTERN
    );

    // #52b274 → rgb(82, 178, 116) in jsdom
    expect(cover).toHaveStyle({ backgroundColor: 'rgb(82, 178, 116)' });
    expect(cover.getAttribute('style')).toContain('linear-gradient');
    expect(DEFAULT_PROFILE_BG_PATTERN).toBe('zigzag');
    expect(expected.backgroundColor).toBe(DEFAULT_PROFILE_BG_COLOR);
  });

  it('uses the customizable preference on your own profile', () => {
    render(
      <ProfileHeader profileUser={{ ...otherUser, _id: 'currentuser' }} />
    );

    const cover = screen.getByTestId('profile-cover');
    // Custom pink (#ec4899 → rgb(236, 72, 153)), not the default green.
    expect(cover).toHaveStyle({ backgroundColor: 'rgb(236, 72, 153)' });
  });
});
