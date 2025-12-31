/**
 * Tests for GuestFooter Component
 *
 * Comprehensive tests for the GuestFooter component.
 * Tests component rendering, props, links, responsive behavior, and styling.
 */

import { render, screen } from '../../utils/test-utils';
import { GuestFooter } from '@/components/GuestFooter';

// Mock useResponsive hook
const mockUseResponsive = jest.fn();
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockUseResponsive(),
}));

describe('GuestFooter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to desktop view
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      breakpoint: 'lg',
    });
  });

  describe('Rendering', () => {
    it('renders footer without crashing', () => {
      const { container } = render(<GuestFooter />);
      expect(container).toBeInTheDocument();
    });

    it('renders brand message with heart emoji', () => {
      render(<GuestFooter />);
      expect(screen.getByText(/Quote\.Vote made with/i)).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText(/on Earth/i)).toBeInTheDocument();
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
      expect(screen.getByRole('link', { name: /donate/i })).toBeInTheDocument();
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
      expect(footer).toHaveClass('bg-transparent');
    });

    it('applies isRequestAccess prop when true', () => {
      const { container } = render(<GuestFooter isRequestAccess={true} />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('bg-background');
    });
  });

  describe('Responsive Behavior', () => {
    it('applies mobile styles when isMobile is true', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        breakpoint: 'xs',
      });

      const { container } = render(<GuestFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('flex-col', 'gap-5');
      expect(footer).toHaveClass('text-center');
    });

    it('applies desktop styles when isMobile is false', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        breakpoint: 'lg',
      });

      const { container } = render(<GuestFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('flex-row', 'gap-0');
      expect(footer).toHaveClass('sm:text-left');
    });
  });

  describe('Styling', () => {
    it('applies correct footer classes', () => {
      const { container } = render(<GuestFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('w-full', 'mt-[60px]', 'mb-5', 'min-h-[48px]', 'border-t');
    });

    it('applies correct link styling classes', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /request invite/i });
      expect(link).toHaveClass(
        'px-4',
        'py-2',
        'rounded-md',
        'transition-all',
        'border',
        'bg-transparent'
      );
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
      expect(link).toHaveClass('hover:-translate-y-[1px]');
    });

    it('applies hover styles on Donate link', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /donate/i });
      expect(link).toHaveClass('hover:-translate-y-[1px]');
    });

    it('applies hover styles on GitHub link', () => {
      render(<GuestFooter />);
      const link = screen.getByRole('link', { name: /github/i });
      expect(link).toHaveClass('hover:-translate-y-[1px]');
    });
  });
});

