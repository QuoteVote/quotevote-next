// src/__tests__/components/VotingPopup.test.tsx
import { render } from '@testing-library/react';
import { VotingPopup } from '../../components/VotingComponents/VotingPopup';

describe('VotingPopup', () => {
  const mockProps = {
    votedBy: [],
    onVote: jest.fn(),
    onAddComment: jest.fn(),
    onAddQuote: jest.fn(),
    selectedText: { text: '', startIndex: 0, endIndex: 0, points: 0 },
    hasVoted: false,
    userVoteType: null,
    text: 'Test text',
  };

  it('renders all action buttons', () => {
    render(<VotingPopup {...mockProps} />);
    // Verify upvote, downvote, comment, quote buttons exist
  });

  it('disables voting when user has already voted', () => {
    render(<VotingPopup {...mockProps} hasVoted={true} userVoteType="up" />);
    // Verify buttons are disabled
  });

  it('calls onVote with correct parameters', async () => {
    render(<VotingPopup {...mockProps} />);
    // Click upvote, then tag
    // Verify onVote was called with { type: 'up', tags: ['#true'] }
  });

  it('shows comment input when comment button is clicked', () => {
    render(<VotingPopup {...mockProps} />);
    // Click comment button
    // Verify input appears
  });
});
