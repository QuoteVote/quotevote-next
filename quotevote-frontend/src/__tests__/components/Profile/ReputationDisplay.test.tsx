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
    it('renders reputation score', () => {
      render(<ReputationDisplay reputation={mockReputation} />);
      expect(screen.getByText('Reputation Score')).toBeInTheDocument();
      expect(screen.getByText('750')).toBeInTheDocument();
    });

    it('displays score breakdown', () => {
      render(<ReputationDisplay reputation={mockReputation} />);
      expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument(); // inviteNetworkScore
      expect(screen.getByText('250')).toBeInTheDocument(); // conductScore
      expect(screen.getByText('300')).toBeInTheDocument(); // activityScore
    });

    it('displays detailed metrics', () => {
      render(<ReputationDisplay reputation={mockReputation} />);
      expect(screen.getByText('Detailed Metrics')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // totalInvitesSent
      expect(screen.getByText('20')).toBeInTheDocument(); // totalPosts
      expect(screen.getByText('30')).toBeInTheDocument(); // totalComments
    });

    it('displays last calculated date', () => {
      render(<ReputationDisplay reputation={mockReputation} />);
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', () => {
      const onRefresh = jest.fn();
      render(<ReputationDisplay reputation={mockReputation} onRefresh={onRefresh} />);
      
      // Find button by aria-label or tooltip trigger
      const refreshButton = screen.getByRole('button');
      fireEvent.click(refreshButton);
      
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('shows loading state on refresh button when loading', () => {
      render(<ReputationDisplay reputation={mockReputation} loading={true} />);
      const refreshButton = screen.getByRole('button');
      expect(refreshButton).toBeDisabled();
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

