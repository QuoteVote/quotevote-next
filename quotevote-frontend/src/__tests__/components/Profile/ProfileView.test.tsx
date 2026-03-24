/**
 * ProfileView Component Tests
 *
 * Tests for the ProfileView component including:
 * - Rendering with profile data
 * - Loading state
 * - Empty/invalid user state
 * - Component composition with tabs
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

jest.mock('@/components/UserPosts', () => ({
  UserPosts: ({ userId }: { userId: string }) => (
    <div data-testid="user-posts">Posts for {userId}</div>
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

    it('has link to search page', () => {
      render(<ProfileView profileUser={undefined} />);
      const link = screen.getByText('Return to homepage.');
      expect(link.closest('a')).toHaveAttribute('href', '/search');
    });
  });

  describe('Valid Profile', () => {
    it('renders profile header', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('profile-header')).toBeInTheDocument();
      });
      expect(screen.getByText(/Header for testuser/)).toBeInTheDocument();
    });

    it('renders tabs with Posts, Activity, and About', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Posts' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument();
      });
    });

    it('shows Posts tab content by default', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('user-posts')).toBeInTheDocument();
      });
    });

    it('shows reputation display when About tab is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      const aboutTab = screen.getByRole('tab', { name: 'About' });
      await user.click(aboutTab);
      await waitFor(() => {
        expect(screen.getByTestId('reputation-display')).toBeInTheDocument();
      });
      expect(screen.getByText('Reputation')).toBeInTheDocument();
    });

    it('shows activity filters when Activity tab is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      const activityTab = screen.getByRole('tab', { name: 'Activity' });
      await user.click(activityTab);
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });
    });

    it('does not render reputation display when reputation is missing and About tab clicked', async () => {
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
        expect(screen.getByText('No additional information available')).toBeInTheDocument();
      });
    });

    it('renders user posts placeholder', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      // UserPosts component is now rendered (not a placeholder)
      await waitFor(() => {
        expect(
          screen.queryByText(/User posts will be displayed here/)
        ).not.toBeInTheDocument();
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
      const contentContainer = container!.querySelector('.space-y-6');
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

    it('renders UserPosts component with correct userId', async () => {
      await act(async () => {
        render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('user-posts')).toBeInTheDocument();
        expect(screen.getByText('Posts for user1')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('renders profile header and tabs together', async () => {
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
      const spaceYContainer = container!.querySelector('.space-y-6');
      expect(spaceYContainer).toBeInTheDocument();
    });
  });
});
