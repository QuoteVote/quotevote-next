/**
 * ProfileView Component Tests
 *
 * Tests for the ProfileView component including:
 * - Rendering with profile data
 * - Loading state
 * - Empty/invalid user state
 * - RC1-006: Taxonomy & Labels (All, Posts, Voted, Commented, Quoted)
 * - RC1-007: Multi-select activity filters, union filtering, All reset
 */

import { renderToString } from 'react-dom/server.node';
import { render, screen, within, act, waitFor, resetStore } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { ProfileView } from '../../../components/Profile/ProfileView';
import { useAppStore } from '@/store';
import type { ProfileUser } from '@/types/profile';

const mockOpenAuthModal = jest.fn();
jest.mock('@/context/AuthModalContext', () => ({
  ...jest.requireActual('@/context/AuthModalContext'),
  useAuthModal: () => ({ openAuthModal: mockOpenAuthModal }),
}));

/** Most tests run signed in; the guest view has its own block (#620). */
function signIn() {
  useAppStore.setState((s) => ({ user: { ...s.user, data: { _id: 'viewer-id', username: 'viewer' } } }));
}

// Mock child components
jest.mock('../../../components/Profile/ProfileHeader', () => ({
  ProfileHeader: ({ profileUser }: { profileUser: ProfileUser }) => (
    <div data-testid="profile-header">
      Header for {profileUser.username}
    </div>
  ),
}));

jest.mock('../../../components/Profile/ReputationDisplay', () => ({
  ReputationDisplay: ({ reputation }: { reputation?: unknown }) => (
    <div data-testid="reputation-display">
      {reputation ? 'Reputation' : 'No Reputation'}
    </div>
  ),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Set by a test to make the list report that the API is only giving a guest posts.
let mockMembersOnly = false;
jest.mock('@/components/Activity/PaginatedActivityList', () => ({
  PaginatedActivityList: ({
    activityEvent = [],
    publicFallback = false,
    onMembersOnlyChange,
  }: {
    activityEvent?: string[];
    publicFallback?: boolean;
    onMembersOnlyChange?: (membersOnly: boolean) => void;
  }) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(() => {
      onMembersOnlyChange?.(publicFallback && mockMembersOnly);
    }, [onMembersOnlyChange, publicFallback]);
    return (
      <div
        data-testid="paginated-activity-list"
        data-events={activityEvent.join(',')}
        data-public-fallback={String(publicFallback)}
      >
        {activityEvent.length === 0 ? 'ALL' : activityEvent.join(',')}
      </div>
    );
  },
}));

const mockProfileUser: ProfileUser = {
  _id: 'user1',
  username: 'testuser',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  contributorBadge: true,
  _followingId: ['user2'],
  _followersId: ['user3', 'user4'],
  reputation: {
    _id: 'rep1',
    overallScore: 750,
    inviteNetworkScore: 200,
    conductScore: 250,
    activityScore: 300,
    metrics: {
      totalInvitesSent: 10,
      totalInvitesAccepted: 8,
      totalInvitesDeclined: 2,
      averageInviteeReputation: 650.5,
      totalReportsReceived: 1,
      totalReportsResolved: 1,
      totalUpvotes: 50,
      totalDownvotes: 5,
      totalPosts: 20,
      totalComments: 30,
    },
    lastCalculated: '2024-01-01T00:00:00Z',
  },
};

describe('ProfileView', () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
    mockOpenAuthModal.mockClear();
    signIn();
  });

  describe('Loading State', () => {
    it('renders loading spinner when loading', () => {
      render(<ProfileView loading={true} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Invalid User State', () => {
    it('renders invalid user message when no profileUser', () => {
      render(<ProfileView profileUser={undefined} />);
      expect(screen.getByText('Invalid user')).toBeInTheDocument();
      expect(screen.getByText('Return to homepage.')).toBeInTheDocument();
    });

    it('has link to home page', () => {
      render(<ProfileView profileUser={undefined} />);
      const link = screen.getByText('Return to homepage.');
      expect(link.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Query error state (#440)', () => {
    it('renders a recoverable error instead of Invalid user', () => {
      render(
        <ProfileView
          errorMessage="This profile could not be loaded. Try again, or return to Explore."
        />
      );
      expect(screen.getByText(/couldn.t load this profile/i)).toBeInTheDocument();
      expect(screen.queryByText('Invalid user')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to explore/i })).toHaveAttribute(
        'href',
        '/'
      );
    });
  });

  describe('Valid Profile - RC1-006 Filter Taxonomy & RC1-007 Multi-Select', () => {
    it('renders profile header', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('profile-header')).toBeInTheDocument();
      });
      expect(screen.getByText(/Header for testuser/)).toBeInTheDocument();
    });

    it('renders the five activity tabs without an About tab', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Posts' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Voted' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Commented' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Quoted' })).toBeInTheDocument();
        expect(screen.queryByRole('tab', { name: 'About' })).not.toBeInTheDocument();
      });
    });

    it('keeps reputation visible after removing the About tab', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('reputation-display')).toBeInTheDocument();
        expect(screen.getByTestId('profile-activity-section')).toBeInTheDocument();
      });
    });

    it('shows All activity by default with All button active', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        const allButton = screen.getByRole('button', { name: 'All' });
        expect(allButton).toHaveAttribute('aria-pressed', 'true');
        expect(allButton).toHaveAttribute('data-state', 'active');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('ALL');
      });
    });

    it('filters by single activity type when Posts is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      const postsButton = screen.getByRole('button', { name: 'Posts' });
      await user.click(postsButton);

      await waitFor(() => {
        expect(postsButton).toHaveAttribute('aria-pressed', 'true');
        expect(postsButton).toHaveAttribute('data-state', 'active');
        expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('POSTED');
      });
    });

    it('filters by single activity type when Voted, Commented, and Quoted are clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const votedButton = screen.getByRole('button', { name: 'Voted' });
      await user.click(votedButton);
      await waitFor(() => {
        expect(votedButton).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('VOTED');
      });

      const allButton = screen.getByRole('button', { name: 'All' });
      await user.click(allButton);
      await waitFor(() => {
        expect(allButton).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('ALL');
      });

      const commentedButton = screen.getByRole('button', { name: 'Commented' });
      await user.click(commentedButton);
      await waitFor(() => {
        expect(commentedButton).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('COMMENTED');
      });
    });

    it('supports selecting multiple filters simultaneously (union of Posts and Commented)', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const postsButton = screen.getByRole('button', { name: 'Posts' });
      const commentedButton = screen.getByRole('button', { name: 'Commented' });

      await user.click(postsButton);
      await user.click(commentedButton);

      await waitFor(() => {
        expect(postsButton).toHaveAttribute('aria-pressed', 'true');
        expect(commentedButton).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: 'Voted' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: 'Quoted' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByTestId('paginated-activity-list')).toHaveAttribute(
          'data-events',
          'POSTED,COMMENTED'
        );
      });
    });

    it('toggles off a selected filter and updates union query', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const postsButton = screen.getByRole('button', { name: 'Posts' });
      const commentedButton = screen.getByRole('button', { name: 'Commented' });

      await user.click(postsButton);
      await user.click(commentedButton);
      await waitFor(() => {
        expect(screen.getByTestId('paginated-activity-list')).toHaveAttribute(
          'data-events',
          'POSTED,COMMENTED'
        );
      });

      // Untoggle Posts
      await user.click(postsButton);
      await waitFor(() => {
        expect(postsButton).toHaveAttribute('aria-pressed', 'false');
        expect(commentedButton).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveAttribute(
          'data-events',
          'COMMENTED'
        );
      });
    });

    it('reverts to All when all specific active filters are unchecked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const postsButton = screen.getByRole('button', { name: 'Posts' });
      await user.click(postsButton);
      await waitFor(() => {
        expect(postsButton).toHaveAttribute('aria-pressed', 'true');
      });

      // Uncheck Posts
      await user.click(postsButton);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('ALL');
      });
    });

    it('resets multi-selection to All when All button is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const postsButton = screen.getByRole('button', { name: 'Posts' });
      const votedButton = screen.getByRole('button', { name: 'Voted' });
      const allButton = screen.getByRole('button', { name: 'All' });

      await user.click(postsButton);
      await user.click(votedButton);

      await waitFor(() => {
        expect(postsButton).toHaveAttribute('aria-pressed', 'true');
        expect(votedButton).toHaveAttribute('aria-pressed', 'true');
      });

      await user.click(allButton);
      await waitFor(() => {
        expect(allButton).toHaveAttribute('aria-pressed', 'true');
        expect(postsButton).toHaveAttribute('aria-pressed', 'false');
        expect(votedButton).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('ALL');
      });
    });

  });

  describe('Layout', () => {
    it('has proper container structure', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<ProfileView profileUser={mockProfileUser} />);
        container = result.container;
      });
      const mainContainer = container!.querySelector('.w-full');
      expect(mainContainer).toBeInTheDocument();
    });

    it('puts the banner first, then the member column and the activity', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      const banner = screen.getByRole('region', { name: 'Profile banner' });
      const member = screen.getByRole('complementary', { name: 'About this member' });
      expect(banner.compareDocumentPosition(member) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(member).toContainElement(screen.getByTestId('profile-header'));
      expect(screen.getByRole('main')).toContainElement(screen.getByTestId('profile-activity-section'));
    });
  });

  describe('Edge Cases', () => {
    it('handles profile user with minimal data', async () => {
      const minimalUser: ProfileUser = {
        _id: 'user1',
        username: 'minimaluser',
      };
      await act(async () => {
        render(<ProfileView profileUser={minimalUser} />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('profile-header')).toBeInTheDocument();
      });
    });

    it('handles profile user with empty arrays for following/followers', async () => {
      const userWithEmptyArrays: ProfileUser = {
        ...mockProfileUser,
        _followingId: [],
        _followersId: [],
      };
      await act(async () => {
        render(<ProfileView profileUser={userWithEmptyArrays} />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('profile-header')).toBeInTheDocument();
      });
    });

    it('keeps the activity list visible when reputation is missing', async () => {
      const userWithNullReputation: ProfileUser = {
        ...mockProfileUser,
        reputation: undefined,
      };
      await act(async () => {
        render(<ProfileView profileUser={userWithNullReputation} />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('profile-activity-section')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('renders profile header and filter group together', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('profile-header')).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Show' })).toBeInTheDocument();
      });
    });

    it('keeps reputation in the member column, under the profile card', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      const member = screen.getByRole('complementary', { name: 'About this member' });
      expect(member).toContainElement(screen.getByTestId('profile-reputation-section'));
    });
  });

  describe('#536: activity filter is a labelled chip filter, not tabs', () => {
    it('labels the group "Show" and starts on All', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      const group = screen.getByRole('group', { name: 'Show' });
      expect(within(group).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
      for (const label of ['Posts', 'Voted', 'Commented', 'Quoted']) {
        expect(within(group).getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false');
      }
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    });

    it('combines filters, uses a readable active color, and Clear goes back to All', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const voted = screen.getByRole('button', { name: 'Voted' });
      const quoted = screen.getByRole('button', { name: 'Quoted' });
      await user.click(voted);
      await user.click(quoted);
      expect(voted).toHaveAttribute('aria-pressed', 'true');
      expect(quoted).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
      // The design's active chip: ink fill with surface-coloured text, never brand-green text.
      expect(voted.className).toContain('bg-[var(--shell-ink)]');
      expect(voted.className).not.toContain('text-[#52b274]');

      await user.click(screen.getByRole('button', { name: 'Clear' }));
      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
      expect(voted).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('#620: signed-out visitors see the activity list', () => {
    beforeEach(() => {
      resetStore();
      mockMembersOnly = false;
    });

    it('gives a guest the same filters and activity list as a member, with the public fallback on', () => {
      render(<ProfileView profileUser={mockProfileUser} />);
      expect(screen.getByTestId('profile-activity-filters')).toBeInTheDocument();
      expect(screen.getByTestId('paginated-activity-list')).toHaveAttribute(
        'data-public-fallback',
        'true'
      );
      // The full activity is available, so there is nothing to explain.
      expect(screen.queryByTestId('activity-signin')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /^Sign in to see/ })).not.toBeInTheDocument();
      expect(screen.getByTestId('reputation-display')).toBeInTheDocument();
    });

    it('explains that only posts are shown while the API keeps the rest for members', async () => {
      mockMembersOnly = true;
      render(<ProfileView profileUser={mockProfileUser} />);
      expect(await screen.findByTestId('activity-signin')).toHaveTextContent(
        "Showing Test User's posts. Sign in to see their votes, comments and quotes too."
      );
      await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }));
      expect(mockOpenAuthModal).toHaveBeenCalledWith({ view: 'login' });
      expect(screen.getByRole('link', { name: 'Request an invite' })).toHaveAttribute(
        'href',
        '/auths/request-access'
      );
    });

    it('falls back to the username when the person has no name', async () => {
      mockMembersOnly = true;
      render(<ProfileView profileUser={{ ...mockProfileUser, name: undefined }} />);
      expect(await screen.findByTestId('activity-signin')).toHaveTextContent(
        "Showing testuser's posts."
      );
    });

    it('drops the note and the fallback once the visitor signs in', async () => {
      mockMembersOnly = true;
      render(<ProfileView profileUser={mockProfileUser} />);
      await screen.findByTestId('activity-signin');
      act(() => signIn());
      expect(screen.getByTestId('paginated-activity-list')).toHaveAttribute(
        'data-public-fallback',
        'false'
      );
      await waitFor(() => expect(screen.queryByTestId('activity-signin')).not.toBeInTheDocument());
    });

    it('renders a neutral loading state on the server, where the session is unknown', () => {
      signIn();
      const html = renderToString(<ProfileView profileUser={mockProfileUser} />);
      expect(html).toContain('Loading activity');
      expect(html).not.toContain('Showing Test User');
      expect(html).not.toContain('paginated-activity-list');
    });
  });
});
