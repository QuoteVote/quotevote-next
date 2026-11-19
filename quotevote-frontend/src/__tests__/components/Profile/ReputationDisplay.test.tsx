/**
 * ReputationDisplay Component Tests
 * 
 * Tests for the ReputationDisplay component including:
 * - Rendering reputation data
 * - Score calculations and colors
 * - Empty state handling
 * - Refresh functionality
 */

import { render, screen, fireEvent } from '../../utils/test-utils';
import { ReputationDisplay } from '../../../components/Profile/ReputationDisplay';
import type { Reputation } from '@/types/profile';

const mockReputation: Reputation = {
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
};

describe('ReputationDisplay', () => {
  describe('With Reputation Data', () => {
    it('shows the score out of 1000 under a Reputation heading', () => {
      render(<ReputationDisplay reputation={mockReputation} />);
      expect(screen.getByRole('heading', { name: 'Reputation' })).toBeInTheDocument();
      expect(screen.getByText('750')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: '750 of 1000' })).toBeInTheDocument();
    });

    it('shows the Invite Network and Activity scores, without Conduct', () => {
      render(<ReputationDisplay reputation={mockReputation} />);
      expect(screen.getByText('Invite Network')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.queryByText('Conduct')).not.toBeInTheDocument();
      expect(screen.queryByText('250')).not.toBeInTheDocument();
    });

    it('lists the figures behind the score, rounded', () => {
      render(<ReputationDisplay reputation={mockReputation} />);
      const figures: [string, string][] = [
        ['Invited', '8'],
        ['Avg Invitee Rep', '651'],
        ['Posts Created', '20'],
        ['Comments Made', '30'],
      ];
      for (const [label, value] of figures) {
        const term = screen.getByText(label);
        expect(term.nextElementSibling).toHaveTextContent(value);
      }
      for (const removed of [
        'Invites Sent',
        'Invites Accepted',
        'Upvotes Given',
        'Reports Received',
        'Reports Resolved',
      ]) {
        expect(screen.queryByText(removed)).not.toBeInTheDocument();
      }
    });

    it('shows when the score was last calculated', () => {
      render(<ReputationDisplay reputation={mockReputation} />);
      expect(screen.getByText(/^Updated \d{1,2}\/\d{1,2}\/2024$/)).toBeInTheDocument();
    });

    it('says it has not been updated when lastCalculated is invalid', () => {
      render(<ReputationDisplay reputation={{ ...mockReputation, lastCalculated: 'not-a-date' }} />);
      expect(screen.getByText('Not updated yet')).toBeInTheDocument();
    });

    it('parses digit-only epoch strings defensively for lastCalculated', () => {
      const epoch = String(Date.UTC(2024, 5, 15, 12));
      render(<ReputationDisplay reputation={{ ...mockReputation, lastCalculated: epoch }} />);
      expect(screen.getByText(/^Updated 6\/15\/2024$/)).toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', () => {
      const onRefresh = jest.fn();
      render(<ReputationDisplay reputation={mockReputation} onRefresh={onRefresh} />);
      const refreshButton = screen.getByRole('button', { name: 'Refresh reputation' });
      fireEvent.click(refreshButton);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      // #536: called with no arguments, so the click event never reaches a refetch.
      expect(onRefresh).toHaveBeenCalledWith();
    });

    it('disables refresh while loading', () => {
      render(<ReputationDisplay reputation={mockReputation} onRefresh={jest.fn()} loading={true} />);
      expect(screen.getByRole('button', { name: 'Refresh reputation' })).toBeDisabled();
    });
  });

  describe('Score Labels and Colors', () => {
    it('displays "Excellent" for score >= 800', () => {
      const highReputation: Reputation = {
        ...mockReputation,
        overallScore: 850,
      };
      render(<ReputationDisplay reputation={highReputation} />);
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('displays "Good" for score >= 600', () => {
      render(<ReputationDisplay reputation={mockReputation} />);
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('displays "Fair" for score >= 400', () => {
      const fairReputation: Reputation = {
        ...mockReputation,
        overallScore: 450,
      };
      render(<ReputationDisplay reputation={fairReputation} />);
      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    it('displays "Poor" for score < 400', () => {
      const poorReputation: Reputation = {
        ...mockReputation,
        overallScore: 300,
      };
      render(<ReputationDisplay reputation={poorReputation} />);
      expect(screen.getByText('Poor')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no reputation data', () => {
      render(<ReputationDisplay />);
      expect(screen.getByText('No reputation data available')).toBeInTheDocument();
    });

    it('renders empty state when reputation is undefined', () => {
      render(<ReputationDisplay reputation={undefined} />);
      expect(screen.getByText('No reputation data available')).toBeInTheDocument();
    });
  });
});

