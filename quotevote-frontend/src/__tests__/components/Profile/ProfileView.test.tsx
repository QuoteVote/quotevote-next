/**
 * ProfileView Component Tests
 * 
 * Tests for the ProfileView component including:
 * - Rendering with profile data
 * - Loading state
 * - Empty/invalid user state
 * - Component composition
 */

import { render, screen, act, waitFor } from '../../utils/test-utils';
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

    it('renders reputation display when reputation exists', async () => {
      await act(async () => {
      render(<ProfileView profileUser={mockProfileUser} />);
      });
      await waitFor(() => {
      expect(screen.getByTestId('reputation-display')).toBeInTheDocument();
      });
      expect(screen.getByText('Reputation')).toBeInTheDocument();
    });

    it('does not render reputation display when reputation is missing', async () => {
      const userWithoutReputation: ProfileUser = {
        ...mockProfileUser,
        reputation: undefined,
      };
      await act(async () => {
      render(<ProfileView profileUser={userWithoutReputation} />);
      });
      await waitFor(() => {
      expect(screen.queryByTestId('reputation-display')).not.toBeInTheDocument();
      });
    });

    it('renders user posts placeholder', async () => {
      await act(async () => {
      render(<ProfileView profileUser={mockProfileUser} />);
      });
      // UserPosts component is now rendered (not a placeholder)
      // The actual component will be tested in UserPosts.test.tsx
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
      const mainContainer = container!.querySelector('.flex.flex-col.items-center');
      expect(mainContainer).toBeInTheDocument();
    });

    it('has max-width constraint', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<ProfileView profileUser={mockProfileUser} />);
        container = result.container;
      });
      const contentContainer = container!.querySelector('.max-w-4xl');
      expect(contentContainer).toBeInTheDocument();
    });
  });
});

