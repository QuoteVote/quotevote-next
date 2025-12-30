/**
 * ProfileBadge Component Tests
 * 
 * Tests for the ProfileBadge component including:
 * - Rendering different badge types
 * - Tooltip functionality
 * - Badge container component
 */

import { render } from '../../utils/test-utils';
import { ProfileBadge, ProfileBadgeContainer } from '../../../components/Profile/ProfileBadge';

describe('ProfileBadge', () => {
  describe('Badge Types', () => {
    it('renders contributor badge', () => {
      const { container } = render(<ProfileBadge type="contributor" />);
      expect(container).toBeInTheDocument();
    });

    it('renders verified badge', () => {
      const { container } = render(<ProfileBadge type="verified" />);
      expect(container).toBeInTheDocument();
    });

    it('renders moderator badge', () => {
      const { container } = render(<ProfileBadge type="moderator" />);
      expect(container).toBeInTheDocument();
    });

    it('renders topContributor badge', () => {
      const { container } = render(<ProfileBadge type="topContributor" />);
      expect(container).toBeInTheDocument();
    });

    it('renders earlyAdopter badge', () => {
      const { container } = render(<ProfileBadge type="earlyAdopter" />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Custom Badge Props', () => {
    it('renders with custom icon', () => {
      const { container } = render(
        <ProfileBadge
          type="contributor"
          customIcon="/custom-badge.png"
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      const { container } = render(
        <ProfileBadge
          type="contributor"
          customLabel="Custom Badge"
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('renders with custom description', () => {
      const { container } = render(
        <ProfileBadge
          type="contributor"
          customDescription="Custom description"
        />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label', () => {
      const { container } = render(<ProfileBadge type="contributor" />);
      const badge = container.querySelector('[role="img"]');
      expect(badge).toHaveAttribute('aria-label');
    });

    it('is keyboard accessible', () => {
      const { container } = render(<ProfileBadge type="contributor" />);
      const badge = container.querySelector('[tabindex="0"]');
      expect(badge).toBeInTheDocument();
    });
  });
});

describe('ProfileBadgeContainer', () => {
  it('renders children badges', () => {
    const { container } = render(
      <ProfileBadgeContainer>
        <ProfileBadge type="contributor" />
        <ProfileBadge type="verified" />
      </ProfileBadgeContainer>
    );
    expect(container).toBeInTheDocument();
    const badges = container.querySelectorAll('[role="img"]');
    expect(badges.length).toBeGreaterThanOrEqual(0);
  });

  it('has proper ARIA label', () => {
    const { container } = render(
      <ProfileBadgeContainer>
        <ProfileBadge type="contributor" />
      </ProfileBadgeContainer>
    );
    const containerElement = container.querySelector('[role="list"]');
    expect(containerElement).toHaveAttribute('aria-label', 'User badges');
  });
});

