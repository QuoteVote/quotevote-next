/**
 * Tests for GuestFooter Component
 *
 * Comprehensive tests for the GuestFooter component.
 * Tests component rendering, props, links, responsive behavior, and styling.
 */

import { render, screen } from '../../utils/test-utils';
import { GuestFooter } from '@/components/GuestFooter';

// Note: useResponsive hook is no longer used in the component
// The component now uses Tailwind responsive classes directly

describe('GuestFooter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders footer without crashing', () => {
      const { container } = render(<GuestFooter />);
      expect(container).toBeInTheDocument();
    });

    it('renders brand message with heart icon', () => {
      render(<GuestFooter />);
      expect(screen.getByText('Quote.Vote')).toBeInTheDocument();
      expect(screen.getByText('made with')).toBeInTheDocument();
      expect(screen.getByText('on Earth')).toBeInTheDocument();
      // Check for Heart icon (lucide-react icon)
      const heartIcon = document.querySelector('.lucide-heart');
      expect(heartIcon).toBeInTheDocument();
    });

    it('renders copyright with current year', () => {
      render(<GuestFooter />);
      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(new RegExp(`© ${currentYear} Quote\\.Vote\\. All rights reserved\\.`, 'i'))
      ).toBeInTheDocument();
    });

    it('renders all footer links', () => {
      render(<GuestFooter />);
      expect(screen.getByRole('link', { name: /request invite/i })).toBeInTheDocument();
      // Donate link now includes Mail icon, so we check for the text
      const donateLink = screen.getByRole('link', { name: /donate/i });
      expect(donateLink).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
    });

    it('renders GitHub icon', () => {
      render(<GuestFooter />);
      const githubLink = screen.getByRole('link', { name: /github/i });
      const icon = githubLink.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('Request Invite link has correct href', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /request invite/i });
      expect(link).toHaveAttribute('href', '/auth/request-access');
    });

    it('Donate link has correct href and target', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /donate/i });
      expect(link).toHaveAttribute('href', 'mailto:admin@quote.vote');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('GitHub link has correct href and target', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /github/i });
      expect(link).toHaveAttribute(
        'href',
        'https://github.com/QuoteVote/quotevote-monorepo'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Props', () => {
    it('applies default isRequestAccess prop (false)', () => {
      const { container } = render(<GuestFooter />);
      const footer = container.querySelector('footer');
      // New design uses gradient backgrounds
      expect(footer).toHaveClass('from-white/80', 'via-white/60', 'to-transparent');
    });

    it('applies isRequestAccess prop when true', () => {
      const { container } = render(<GuestFooter isRequestAccess={true} />);
      const footer = container.querySelector('footer');
      // When isRequestAccess is true, uses different gradient
      expect(footer).toHaveClass('from-background', 'to-background/95');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders with responsive layout structure', () => {
      const { container } = render(<GuestFooter />);
      // New design uses flex-col sm:flex-row for responsive layout
      const innerContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(innerContainer).toBeInTheDocument();
    });

    it('has responsive padding classes', () => {
      const { container } = render(<GuestFooter />);
      const innerContainer = container.querySelector('.px-4.sm\\:px-6.lg\\:px-8');
      expect(innerContainer).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct footer classes', () => {
      const { container } = render(<GuestFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('w-full', 'relative', 'border-t');
      expect(footer).toHaveClass('mt-16', 'sm:mt-20');
    });

    it('applies correct link styling classes', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /request invite/i });
      expect(link).toHaveClass(
        'px-5',
        'py-2.5',
        'rounded-lg',
        'transition-all',
        'border'
      );
      // New design uses semi-transparent white background
      expect(link).toHaveClass('group', 'relative', 'overflow-hidden');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic HTML structure', () => {
      const { container } = render(<GuestFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('external links have proper rel attributes', () => {
      render(<GuestFooter />);
      const donateLink = screen.getByRole('link', { name: /donate/i });
      const githubLink = screen.getByRole('link', { name: /github/i });

      expect(donateLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('external links have target="_blank"', () => {
      render(<GuestFooter />);
      const donateLink = screen.getByRole('link', { name: /donate/i });
      const githubLink = screen.getByRole('link', { name: /github/i });

      expect(donateLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Hover Effects', () => {
    it('applies hover styles on Request Invite link', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /request invite/i });
      expect(link).toHaveClass('hover:shadow-md', 'hover:shadow-teal-500/20');
    });

    it('applies hover styles on Donate link', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /donate/i });
      expect(link).toHaveClass('hover:shadow-md', 'hover:shadow-cyan-500/20');
    });

    it('applies hover styles on GitHub link', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /github/i });
      expect(link).toHaveClass('hover:shadow-md', 'hover:shadow-blue-500/20');
    });

    it('has Mail icon in Donate link', () => {
      render(<GuestFooter />);
      const donateLink = screen.getByRole('link', { name: /donate/i });
      const mailIcon = donateLink.querySelector('.lucide-mail');
      expect(mailIcon).toBeInTheDocument();
    });
  });
});

