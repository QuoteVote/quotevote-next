/**
 * NoFollowers Component Tests
 * 
 * Tests for the NoFollowers component including:
 * - Rendering for followers vs following
 * - Empty state messages
 * - Action buttons
 */

import { render, screen } from '../../utils/test-utils';
import { NoFollowers } from '../../../components/Profile/NoFollowers';

describe('NoFollowers', () => {
  describe('Followers Filter', () => {
    it('renders followers empty state', () => {
      render(<NoFollowers filter="followers" />);
      expect(
        screen.getByText(/Here you are going to see people that like your ideas/)
      ).toBeInTheDocument();
    });

    it('displays correct image for followers', () => {
      const { container } = render(<NoFollowers filter="followers" />);
      const image = container.querySelector('img[alt="EmptyFollowers"]');
      expect(image).toBeInTheDocument();
    });

    it('shows create post button for followers', () => {
      render(<NoFollowers filter="followers" />);
      const button = screen.getByRole('link', { name: /Create a Post/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/submit');
    });
  });

  describe('Following Filter', () => {
    it('renders following empty state', () => {
      render(<NoFollowers filter="following" />);
      expect(
        screen.getByText(/Here you are going to see people that you like their ideas/)
      ).toBeInTheDocument();
    });

    it('displays correct image for following', () => {
      const { container } = render(<NoFollowers filter="following" />);
      const image = container.querySelector('img[alt="EmptyFollowing"]');
      expect(image).toBeInTheDocument();
    });

    it('shows find friends and search buttons for following', () => {
      render(<NoFollowers filter="following" />);
      const findFriendsButton = screen.getByRole('link', { name: /Find Friends/i });
      const searchButton = screen.getByRole('link', { name: /Go to Search/i });
      
      expect(findFriendsButton).toBeInTheDocument();
      expect(findFriendsButton).toHaveAttribute('href', '/search');
      
      expect(searchButton).toBeInTheDocument();
      expect(searchButton).toHaveAttribute('href', '/search');
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

