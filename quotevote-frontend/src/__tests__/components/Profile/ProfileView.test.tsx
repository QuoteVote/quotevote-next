/**
 * ProfileView Component Tests
 *
 * Tests for the ProfileView component including:
 * - Rendering with profile data
 * - Loading state
 * - Empty/invalid user state
 * - RC1-006: Taxonomy & Labels (All, Posts, Voted, Commented, Quoted, About)
 * - RC1-007: Multi-select activity filters, union filtering, All reset
 */

import { render, screen, act, waitFor } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { ProfileView } from '../../../components/Profile/ProfileView';
import type { ProfileUser } from '@/types/profile';

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

jest.mock('@/components/Activity/PaginatedActivityList', () => ({
  PaginatedActivityList: ({ activityEvent = [] }: { activityEvent?: string[] }) => (
    <div
      data-testid="paginated-activity-list"
      data-events={activityEvent.join(',')}
    >
      {activityEvent.length === 0 ? 'ALL' : activityEvent.join(',')}
    </div>
  ),
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
        '/dashboard/explore'
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

    it('renders all six filter buttons with expected labels: All, Posts, Voted, Commented, Quoted, About', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Posts' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Voted' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Commented' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Quoted' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument();
      });
    });

    it('shows All activity by default with All button active', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        const allButton = screen.getByRole('tab', { name: 'All' });
        expect(allButton).toHaveAttribute('aria-selected', 'true');
        expect(allButton).toHaveAttribute('data-state', 'active');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('ALL');
      });
    });

    it('filters by single activity type when Posts is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      const postsButton = screen.getByRole('tab', { name: 'Posts' });
      await user.click(postsButton);

      await waitFor(() => {
        expect(postsButton).toHaveAttribute('aria-selected', 'true');
        expect(postsButton).toHaveAttribute('data-state', 'active');
        expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('POSTED');
      });
    });

    it('filters by single activity type when Voted, Commented, and Quoted are clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const votedButton = screen.getByRole('tab', { name: 'Voted' });
      await user.click(votedButton);
      await waitFor(() => {
        expect(votedButton).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('VOTED');
      });

      const allButton = screen.getByRole('tab', { name: 'All' });
      await user.click(allButton);
      await waitFor(() => {
        expect(allButton).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('ALL');
      });

      const commentedButton = screen.getByRole('tab', { name: 'Commented' });
      await user.click(commentedButton);
      await waitFor(() => {
        expect(commentedButton).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('COMMENTED');
      });
    });

    it('supports selecting multiple filters simultaneously (union of Posts and Commented)', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const postsButton = screen.getByRole('tab', { name: 'Posts' });
      const commentedButton = screen.getByRole('tab', { name: 'Commented' });

      await user.click(postsButton);
      await user.click(commentedButton);

      await waitFor(() => {
        expect(postsButton).toHaveAttribute('aria-selected', 'true');
        expect(commentedButton).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByRole('tab', { name: 'Voted' })).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByRole('tab', { name: 'Quoted' })).toHaveAttribute('aria-selected', 'false');
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

      const postsButton = screen.getByRole('tab', { name: 'Posts' });
      const commentedButton = screen.getByRole('tab', { name: 'Commented' });

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
        expect(postsButton).toHaveAttribute('aria-selected', 'false');
        expect(commentedButton).toHaveAttribute('aria-selected', 'true');
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

      const postsButton = screen.getByRole('tab', { name: 'Posts' });
      await user.click(postsButton);
      await waitFor(() => {
        expect(postsButton).toHaveAttribute('aria-selected', 'true');
      });

      // Uncheck Posts
      await user.click(postsButton);
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('ALL');
      });
    });

    it('resets multi-selection to All when All button is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const postsButton = screen.getByRole('tab', { name: 'Posts' });
      const votedButton = screen.getByRole('tab', { name: 'Voted' });
      const allButton = screen.getByRole('tab', { name: 'All' });

      await user.click(postsButton);
      await user.click(votedButton);

      await waitFor(() => {
        expect(postsButton).toHaveAttribute('aria-selected', 'true');
        expect(votedButton).toHaveAttribute('aria-selected', 'true');
      });

      await user.click(allButton);
      await waitFor(() => {
        expect(allButton).toHaveAttribute('aria-selected', 'true');
        expect(postsButton).toHaveAttribute('aria-selected', 'false');
        expect(votedButton).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('ALL');
      });
    });

    it('shows reputation display and bio when About tab is clicked', async () => {
      const user = userEvent.setup();
      const userWithBio: ProfileUser = {
        ...mockProfileUser,
        bio: 'I care about thoughtful dialogue.',
      };
      await act(async () => {
        render(<ProfileView profileUser={userWithBio} />);
      });
      const aboutTab = screen.getByRole('tab', { name: 'About' });
      await user.click(aboutTab);
      await waitFor(() => {
        expect(aboutTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('reputation-display')).toBeInTheDocument();
        expect(screen.getByText('I care about thoughtful dialogue.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'About', level: 3 })).toBeInTheDocument();
        expect(screen.queryByTestId('paginated-activity-list')).not.toBeInTheDocument();
      });
    });

    it('shows empty about state when reputation is missing and About tab clicked', async () => {
      const user = userEvent.setup();
      const userWithoutReputation: ProfileUser = {
        ...mockProfileUser,
        reputation: undefined,
      };
      await act(async () => {
        render(<ProfileView profileUser={userWithoutReputation} />);
      });
      const aboutTab = screen.getByRole('tab', { name: 'About' });
      await user.click(aboutTab);
      await waitFor(() => {
        expect(screen.queryByTestId('reputation-display')).not.toBeInTheDocument();
        expect(screen.getByText('No about text yet')).toBeInTheDocument();
      });
    });

    it('switches back from About view to Activity view when an activity filter is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const aboutTab = screen.getByRole('tab', { name: 'About' });
      await user.click(aboutTab);
      await waitFor(() => {
        expect(screen.getByTestId('profile-about-section')).toBeInTheDocument();
      });

      const quotedButton = screen.getByRole('tab', { name: 'Quoted' });
      await user.click(quotedButton);
      await waitFor(() => {
        expect(screen.getByTestId('profile-activity-section')).toBeInTheDocument();
        expect(quotedButton).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('paginated-activity-list')).toHaveTextContent('QUOTED');
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

    it('has vertical spacing', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<ProfileView profileUser={mockProfileUser} />);
        container = result.container;
      });
      const contentContainer = container!.querySelector('.pb-8');
      expect(contentContainer).toBeInTheDocument();
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

    it('handles profile user with null reputation gracefully', async () => {
      const user = userEvent.setup();
      const userWithNullReputation: ProfileUser = {
        ...mockProfileUser,
        reputation: undefined,
      };
      await act(async () => {
        render(<ProfileView profileUser={userWithNullReputation} />);
      });
      const aboutTab = screen.getByRole('tab', { name: 'About' });
      await user.click(aboutTab);
      await waitFor(() => {
        expect(screen.queryByTestId('reputation-display')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('renders profile header and tablist together', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('profile-header')).toBeInTheDocument();
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });

    it('maintains proper spacing between components', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<ProfileView profileUser={mockProfileUser} />);
        container = result.container;
      });
      const spaceYContainer = container!.querySelector('.pb-8');
      expect(spaceYContainer).toBeInTheDocument();
    });
  });

  describe('RC1-009: Activity Button Colors by Type', () => {
    it('applies activity-specific color classes when filters are active', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });

      const votedButton = screen.getByRole('tab', { name: 'Voted' });
      await user.click(votedButton);
      await waitFor(() => {
        expect(votedButton.className).toContain('border-[#52b274]');
        expect(votedButton.className).toContain('text-[#52b274]');
      });

      const commentedButton = screen.getByRole('tab', { name: 'Commented' });
      await user.click(commentedButton);
      await waitFor(() => {
        expect(commentedButton.className).toContain('border-[#ca8a04]');
        expect(commentedButton.className).toContain('text-[#ca8a04]');
      });

      const quotedButton = screen.getByRole('tab', { name: 'Quoted' });
      await user.click(quotedButton);
      await waitFor(() => {
        expect(quotedButton.className).toContain('border-[#c026d3]');
        expect(quotedButton.className).toContain('text-[#c026d3]');
      });
    });
  });
});

