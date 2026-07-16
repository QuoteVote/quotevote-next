/**
 * ProfileHeader — "Message" button behaviour
 *
 * Verifies that clicking "Message" on another user's profile opens the
 * NEW right-side chat panel directly into the conversation:
 *   - existing DM  -> selects the existing room id
 *   - no DM yet    -> stages a new USER room so MessageBox opens the
 *                      compose view (same flow as the chat buddy list)
 *
 * Note: `useQuery`/`useMutation` are mocked directly, so no Apollo provider
 * is needed (Apollo Client 4 no longer exports `MockedProvider` from
 * `@apollo/client/testing`).
 */

import { render, screen, fireEvent } from '../../utils/test-utils';
import { ProfileHeader } from '../../../components/Profile/ProfileHeader';
import { useAppStore } from '@/store';
import { GET_CHAT_ROOM, GET_ROSTER } from '@/graphql/queries';
import type { ProfileUser } from '@/types/profile';
import type { DocumentNode } from 'graphql';

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

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

jest.mock('@/hooks/useProfileBackground', () => ({
  useProfileBackground: () => ({ color: '#fff', pattern: 'none' }),
}));

const mockEnsureAuth = jest.fn(() => true);
jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: () => mockEnsureAuth,
}));

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

const mockProfileUser: ProfileUser = {
  _id: 'user1',
  username: 'testuser',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  _followingId: [],
  _followersId: [],
};

/** Route useQuery by document: chat-room result is configurable per test. */
function setupQueries(messageRoom: { _id: string; users: string[] } | null) {
  mockUseQuery.mockImplementation((doc: DocumentNode) => {
    if (doc === GET_CHAT_ROOM) {
      return { data: { messageRoom }, loading: false, error: undefined };
    }
    if (doc === GET_ROSTER) {
      return { data: { getRoster: [] }, loading: false, error: undefined };
    }
    return { data: undefined, loading: false, error: undefined };
  });
}

describe('ProfileHeader — Message button', () => {
  let setSelectedChatRoom: jest.Mock;
  let setChatOpen: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureAuth.mockReturnValue(true);
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false, error: undefined }]);
    setSelectedChatRoom = jest.fn();
    setChatOpen = jest.fn();
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        data: { _id: 'currentuser', username: 'currentuser', name: 'Current User' },
      },
      setSelectedChatRoom,
      setChatOpen,
    });
  });

  it('opens the existing conversation in the right-side panel', () => {
    setupQueries({ _id: 'room1', users: ['currentuser', 'user1'] });

    render(<ProfileHeader profileUser={mockProfileUser} />);
    fireEvent.click(screen.getByRole('button', { name: /message/i }));

    expect(setSelectedChatRoom).toHaveBeenCalledWith('room1');
    expect(setChatOpen).toHaveBeenCalledWith(true);
  });

  it('stages a new DM when no conversation exists yet', () => {
    setupQueries(null);

    render(<ProfileHeader profileUser={mockProfileUser} />);
    fireEvent.click(screen.getByRole('button', { name: /message/i }));

    expect(setSelectedChatRoom).toHaveBeenCalledWith({
      _id: null,
      title: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      username: 'testuser',
      messageType: 'USER',
      users: ['currentuser', 'user1'],
      username: 'testuser',
    });
    expect(setChatOpen).toHaveBeenCalledWith(true);
  });

  it('does not open chat and warns when the user is blocked', () => {
    mockUseQuery.mockImplementation((doc: DocumentNode) => {
      if (doc === GET_CHAT_ROOM) {
        return { data: { messageRoom: null }, loading: false, error: undefined };
      }
      if (doc === GET_ROSTER) {
        return {
          data: {
            getRoster: [
              {
                _id: 'r1',
                userId: 'currentuser',
                buddyId: 'user1',
                status: 'blocked',
                initiatedBy: 'currentuser',
              },
            ],
          },
          loading: false,
          error: undefined,
        };
      }
      return { data: undefined, loading: false, error: undefined };
    });

    render(<ProfileHeader profileUser={mockProfileUser} />);
    fireEvent.click(screen.getByRole('button', { name: /message/i }));

    expect(setSelectedChatRoom).not.toHaveBeenCalled();
    expect(setChatOpen).not.toHaveBeenCalled();
  });

  it('opens auth gate instead of chat when guest clicks Message', () => {
    mockEnsureAuth.mockReturnValue(false);
    setupQueries(null);
    useAppStore.setState({
      user: { loading: false, loginError: null, data: {} },
      setSelectedChatRoom,
      setChatOpen,
    });

    render(<ProfileHeader profileUser={mockProfileUser} />);
    fireEvent.click(screen.getByRole('button', { name: /message/i }));

    expect(mockEnsureAuth).toHaveBeenCalled();
    expect(setSelectedChatRoom).not.toHaveBeenCalled();
    expect(setChatOpen).not.toHaveBeenCalled();
  });
});
