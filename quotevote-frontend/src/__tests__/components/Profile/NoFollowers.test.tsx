/**
 * NoFollowers Component Tests
 * 
 * Tests for the NoFollowers component including:
 * - Rendering for followers vs following
 * - Empty state messages
 * - Action buttons
 */

import { render, screen, fireEvent } from '../../utils/test-utils';
import { NoFollowers } from '../../../components/Profile/NoFollowers';

// Stub the create-post form so the dialog content is assertable without
// pulling in SubmitPost's heavy data dependencies.
jest.mock('@/components/SubmitPost/SubmitPost', () => ({
  SubmitPost: () => <div data-testid="submit-post" />,
}));

describe('NoFollowers', () => {
  describe('Followers Filter', () => {
    it('renders followers empty state', () => {
      render(<NoFollowers filter="followers" />);
      expect(
        screen.getByText(/Here you are going to see people that like your ideas/)
      ).toBeInTheDocument();
    });

    it('does not render an empty-state image for followers', () => {
      const { container } = render(<NoFollowers filter="followers" />);
      expect(container.querySelector('img')).toBeNull();
    });

    it('opens the create-post dialog (navbar flow) for followers', () => {
      render(<NoFollowers filter="followers" />);
      const button = screen.getByRole('button', { name: /Create a Post/i });
      expect(button).toBeInTheDocument();
      // Not a navigation link anymore
      expect(screen.queryByRole('link', { name: /Create a Post/i })).toBeNull();

      // Dialog is closed until the button is clicked
      expect(screen.queryByTestId('submit-post')).not.toBeInTheDocument();
      fireEvent.click(button);
      expect(screen.getByTestId('submit-post')).toBeInTheDocument();
    });
  });

  describe('Following Filter', () => {
    it('renders following empty state', () => {
      render(<NoFollowers filter="following" />);
      expect(
        screen.getByText(/Here you are going to see people that you like their ideas/)
      ).toBeInTheDocument();
    });

    it('does not render an empty-state image for following', () => {
      const { container } = render(<NoFollowers filter="following" />);
      expect(container.querySelector('img')).toBeNull();
    });

    it('does not show Find Friends / Go to Search buttons for following', () => {
      render(<NoFollowers filter="following" />);
      expect(screen.queryByRole('link', { name: /Find Friends/i })).toBeNull();
      expect(screen.queryByRole('link', { name: /Go to Search/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Find Friends/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Go to Search/i })).toBeNull();
    });
  });

  describe('Component Structure', () => {
    it('has proper card structure', () => {
      const { container } = render(<NoFollowers filter="followers" />);
      const card = container.querySelector('[id="component-followers-display"]');
      expect(card).toBeInTheDocument();
    });

    it('has centered layout', () => {
      const { container } = render(<NoFollowers filter="followers" />);
      const centeredContent = container.querySelector('.flex.flex-col.items-center');
      expect(centeredContent).toBeInTheDocument();
    });
  });
});

