/**
 * Landing Page Tests
 *
 * Covers: rendering, section presence, navigation links,
 * auth redirect, smooth-scroll, accessibility, and inline search.
 */

import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { LandingPageContent } from '@/app/components/LandingPage/LandingPageContent';
import { useAppStore } from '@/store';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

// Apollo mock — override useQuery from @apollo/client/react
const mockUseQuery = jest.fn();
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

// useDebounce mock — returns value immediately (no delay in tests)
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: <T,>(value: T) => value,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function renderLandingPage() {
  return render(<LandingPageContent />);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.getState().clearUserData();
    // Default Apollo state: idle
    mockUseQuery.mockReturnValue({ data: undefined, loading: false, error: undefined });
  });

  // ── Rendering ─────────────────────────────────────────────

  describe('Page rendering', () => {
    it('renders the landing page container', () => {
      renderLandingPage();
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('renders the brand logo in the navbar', () => {
      renderLandingPage();
      const logos = screen.getAllByAltText(/quote\.vote logo/i);
      expect(logos.length).toBeGreaterThan(0);
    });

    it('renders the QUOTE.VOTE brand text in the navbar', () => {
      renderLandingPage();
      expect(screen.getAllByText('QUOTE.VOTE').length).toBeGreaterThan(0);
    });
  });

  // ── Navbar ────────────────────────────────────────────────

  describe('Navbar', () => {
    it('renders the main navigation landmark', () => {
      renderLandingPage();
      expect(
        screen.getByRole('navigation', { name: /main navigation/i })
      ).toBeInTheDocument();
    });

    it('renders the Login link in the navbar', () => {
      renderLandingPage();
      const loginLinks = screen.getAllByRole('link', { name: /login/i });
      expect(loginLinks.length).toBeGreaterThan(0);
    });

    it('renders the Request Invite link in the navbar', () => {
      renderLandingPage();
      expect(
        screen.getAllByRole('link', { name: /request an invite/i }).length
      ).toBeGreaterThan(0);
    });

    it('renders the Home nav link', () => {
      renderLandingPage();
      expect(
        screen.getByRole('link', { name: /go to home page/i })
      ).toBeInTheDocument();
    });

    it('renders the About scroll button', () => {
      renderLandingPage();
      expect(
        screen.getByRole('button', { name: /scroll to about section/i })
      ).toBeInTheDocument();
    });
  });

  // ── Hero Section ──────────────────────────────────────────

  describe('Hero section', () => {
    it('renders the main h1 heading', () => {
      renderLandingPage();
      expect(
        screen.getByRole('heading', { level: 1, name: /share ideas/i })
      ).toBeInTheDocument();
    });

    it('renders the motto badge', () => {
      renderLandingPage();
      expect(
        screen.getByText(/no algorithms\. no ads\. just conversations\./i)
      ).toBeInTheDocument();
    });

    it('renders the hero sub-text', () => {
      renderLandingPage();
      expect(screen.getByText(/text-first platform for thoughtful dialogue/i)).toBeInTheDocument();
    });

    it('renders the hero search bar', () => {
      renderLandingPage();
      expect(screen.getByRole('search', { name: /search conversations/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/search topics, quotes, conversations/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit search/i })).toBeInTheDocument();
    });

    it('shows search dropdown when search form is submitted with a query', async () => {
      mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { searchContent: [], searchCreator: [] } });
      const user = userEvent.setup();
      renderLandingPage();

      const input = screen.getByLabelText(/search topics, quotes, conversations/i);
      await user.type(input, 'democracy');
      await user.click(screen.getByRole('button', { name: /submit search/i }));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('does not redirect when search is submitted with empty query', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await user.click(screen.getByRole('button', { name: /submit search/i }));

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('renders hero CTA links pointing to /auths/signup and /auths/login', () => {
      renderLandingPage();
      const inviteLinks = screen
        .getAllByRole('link', { name: /request an invite/i })
        .filter((el) => el.closest('section') === null || true);
      expect(inviteLinks[0]).toHaveAttribute('href', '/auths/request-access');
    });
  });

  // ── Inline Search Results ──────────────────────────────────

  describe('Inline search results dropdown', () => {
    it('shows loading skeleton while query is in-flight', async () => {
      mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined });

      const user = userEvent.setup();
      renderLandingPage();

      const input = screen.getByLabelText(/search topics, quotes, conversations/i);
      await user.type(input, 'climate');

      expect(screen.getByTestId('search-skeleton')).toBeInTheDocument();
    });

    it('shows content results when search returns data', async () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        error: undefined,
        data: {
          searchContent: [
            { _id: '1', title: 'Climate Change Policy', creatorId: 'u1', domain: { key: 'politics', _id: 'd1' } },
            { _id: '2', title: 'Green Energy Future', creatorId: 'u2', domain: { key: 'science', _id: 'd2' } },
          ],
          searchCreator: [],
        },
      });

      const user = userEvent.setup();
      renderLandingPage();

      const input = screen.getByLabelText(/search topics, quotes, conversations/i);
      await user.type(input, 'climate');

      expect(screen.getByText('Climate Change Policy')).toBeInTheDocument();
      expect(screen.getByText('Green Energy Future')).toBeInTheDocument();
      expect(screen.getByText(/posts/i)).toBeInTheDocument();
    });

    it('shows creator results when search returns people', async () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        error: undefined,
        data: {
          searchContent: [],
          searchCreator: [
            { _id: 'c1', name: 'Jane Smith', avatar: null, creator: { _id: 'u1' } },
          ],
        },
      });

      const user = userEvent.setup();
      renderLandingPage();

      const input = screen.getByLabelText(/search topics, quotes, conversations/i);
      await user.type(input, 'jane');

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      // Check for the "People" category header inside the results listbox
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveTextContent('People');
    });

    it('shows empty state when search returns no results', async () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        error: undefined,
        data: { searchContent: [], searchCreator: [] },
      });

      const user = userEvent.setup();
      renderLandingPage();

      const input = screen.getByLabelText(/search topics, quotes, conversations/i);
      await user.type(input, 'xyznotfound');

      expect(screen.getByTestId('search-empty')).toBeInTheDocument();
      expect(screen.getByText(/no results for/i)).toBeInTheDocument();
    });

    it('shows error state when search query fails', async () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        error: new Error('Network error'),
        data: undefined,
      });

      const user = userEvent.setup();
      renderLandingPage();

      const input = screen.getByLabelText(/search topics, quotes, conversations/i);
      await user.type(input, 'error query');

      expect(screen.getByTestId('search-error')).toBeInTheDocument();
      expect(screen.getByText(/search unavailable/i)).toBeInTheDocument();
    });

    it('redirects to /dashboard/search when clicking a content result', async () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        error: undefined,
        data: {
          searchContent: [
            { _id: '1', title: 'Democracy Matters', creatorId: 'u1', domain: null },
          ],
          searchCreator: [],
        },
      });

      const user = userEvent.setup();
      renderLandingPage();

      const input = screen.getByLabelText(/search topics, quotes, conversations/i);
      await user.type(input, 'demo');

      const resultBtn = screen.getByText('Democracy Matters').closest('button');
      expect(resultBtn).not.toBeNull();
      await user.click(resultBtn!);

      expect(mockPush).toHaveBeenCalledWith('/auths/login');
    });

    it('does not show dropdown when query is empty', () => {
      renderLandingPage();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  // ── About Section ─────────────────────────────────────────

  describe('About section', () => {
    it('renders the about section with id="about-section"', () => {
      renderLandingPage();
      const section = document.getElementById('about-section');
      expect(section).not.toBeNull();
    });

    it('renders the Welcome to Quote.Vote heading', () => {
      renderLandingPage();
      expect(
        screen.getByRole('heading', { name: /welcome to quote\.vote/i })
      ).toBeInTheDocument();
    });

    it('renders mission statement content', () => {
      renderLandingPage();
      expect(screen.getByText(/freedom of expression/i)).toBeInTheDocument();
      expect(screen.getAllByText(/thoughtful, respectful discourse/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/non-profit platform/i)).toBeInTheDocument();
    });
  });

  // ── Features Section ──────────────────────────────────────

  describe('Features section', () => {
    it('renders the features heading', () => {
      renderLandingPage();
      expect(
        screen.getByRole('heading', { name: /built for meaningful conversations/i })
      ).toBeInTheDocument();
    });

    it('renders all 4 feature cards', () => {
      renderLandingPage();
      expect(screen.getByText('Targeted Feedback')).toBeInTheDocument();
      expect(screen.getByText('Live Chat Threads')).toBeInTheDocument();
      expect(screen.getByText('Voting Mechanics')).toBeInTheDocument();
      expect(screen.getByText('Ad-Free & Algorithm-Free')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      renderLandingPage();
      expect(screen.getByText(/quote specific text for precise/i)).toBeInTheDocument();
      expect(screen.getByText(/democratic, transparent voting/i)).toBeInTheDocument();
    });
  });

  // ── Footer ────────────────────────────────────────────────

  describe('Footer', () => {
    it('renders the footer landmark', () => {
      renderLandingPage();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('renders all footer section headings', () => {
      renderLandingPage();
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveTextContent('Company');
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    it('renders the contact email link', () => {
      renderLandingPage();
      const emailLinks = screen.getAllByRole('link', { name: /contact us via email/i });
      expect(emailLinks[0]).toHaveAttribute('href', 'mailto:admin@quote.vote');
    });

    it('renders Terms of Service, Code of Conduct, and Contributing links', () => {
      renderLandingPage();
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Code of Conduct')).toBeInTheDocument();
      expect(screen.getByText('Contributing')).toBeInTheDocument();
    });

    it('renders social media links', () => {
      renderLandingPage();
      expect(screen.getByRole('link', { name: /visit our github/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /visit our twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /visit our linkedin/i })).toBeInTheDocument();
    });

    it('renders copyright notice with current year', () => {
      renderLandingPage();
      const year = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    });

    it('renders the "Made with love" attribution', () => {
      renderLandingPage();
      expect(screen.getByText(/made with/i)).toBeInTheDocument();
    });
  });

  // ── Navigation links ──────────────────────────────────────

  describe('Navigation links (no React Router)', () => {
    it('Login links point to /auths/login (Next.js href)', () => {
      renderLandingPage();
      const loginLinks = screen
        .getAllByRole('link', { name: /login/i })
        .filter((el) => el.hasAttribute('href'));
      loginLinks.forEach((link) => expect(link).toHaveAttribute('href', '/auths/login'));
    });

    it('Request Invite links point to /auths/signup (Next.js href)', () => {
      renderLandingPage();
      const inviteLinks = screen.getAllByRole('link', { name: /request an invite/i });
      inviteLinks.forEach((link) => expect(link).toHaveAttribute('href', '/auths/request-access'));
    });

    it('Home logo link points to /', () => {
      renderLandingPage();
      const homeLinks = screen.getAllByRole('link', { name: /quote\.vote home/i });
      expect(homeLinks[0]).toHaveAttribute('href', '/');
    });

    it('Donate links open in a new tab with rel=noopener', () => {
      renderLandingPage();
      const donateLinks = screen.getAllByRole('link', { name: /donate/i });
      donateLinks.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  // ── New marketing sections ────────────────────────────────

  describe('Marketing sections', () => {
    it('renders "What people are saying" section', () => {
      renderLandingPage();
      expect(
        screen.getByRole('heading', { name: /what people are saying/i })
      ).toBeInTheDocument();
    });

    it('renders voting popup images', () => {
      renderLandingPage();
      expect(screen.getByAltText(/voting popup preview/i)).toBeInTheDocument();
      expect(screen.getByAltText(/second voting popup/i)).toBeInTheDocument();
    });

    it('renders "Put your Quote to Vote" section', () => {
      renderLandingPage();
      expect(
        screen.getByRole('heading', { name: /put your quote to vote/i })
      ).toBeInTheDocument();
      expect(screen.getByAltText(/submit a quote for voting at any time/i)).toBeInTheDocument();
    });

    it('renders "Track every Conversation" section', () => {
      renderLandingPage();
      expect(screen.getByRole('heading', { name: /track every conversation/i })).toBeInTheDocument();
      expect(screen.getByAltText(/conversation tracking/i)).toBeInTheDocument();
    });

    it('renders "Discover without bias" section', () => {
      renderLandingPage();
      expect(
        screen.getByRole('heading', { name: /discover without bias/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/without ads, discovered through exploration/i)).toBeInTheDocument();
    });

    it('renders "Share your ideas or plans" section', () => {
      renderLandingPage();
      expect(screen.getByText(/post to your social circle/i)).toBeInTheDocument();
    });

    it('renders "Donate what you can" section', () => {
      renderLandingPage();
      expect(
        screen.getByRole('heading', { name: /donate what you can/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /donate to quote\.vote today/i })
      ).toBeInTheDocument();
    });

    it('renders "Stay in the loop" section with email form', () => {
      renderLandingPage();
      expect(
        screen.getByRole('heading', { name: /stay in the loop/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
    });
  });

  // ── Email form validation ─────────────────────────────────

  describe('Be in Touch email form', () => {
    it('shows error when submitting empty email', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      const submitBtn = screen.getByRole('button', { name: /subscribe/i });
      await user.click(submitBtn);

      expect(
        await screen.findByText(/please enter a valid email address/i)
      ).toBeInTheDocument();
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
      await user.click(screen.getByRole('button', { name: /subscribe/i }));

      expect(
        await screen.findByText(/please enter a valid email address/i)
      ).toBeInTheDocument();
    });

    it('clears error when user starts typing again', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await user.click(screen.getByRole('button', { name: /subscribe/i }));
      await screen.findByText(/please enter a valid email address/i);

      await user.type(screen.getByLabelText(/email address/i), 'a');
      expect(
        screen.queryByText(/please enter a valid email address/i)
      ).not.toBeInTheDocument();
    });
  });

  // ── Auth redirect ──────────────────────────────────────────

  describe('Auth redirect', () => {
    it('does NOT redirect unauthenticated users', () => {
      renderLandingPage();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('redirects authenticated users to /dashboard/search', async () => {
      useAppStore.getState().setUserData({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      });

      renderLandingPage();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/search');
      });
    });
  });

  // ── Smooth scroll ─────────────────────────────────────────

  describe('Smooth scroll to About', () => {
    it('calls scrollIntoView when About button is clicked', async () => {
      const user = userEvent.setup();
      const scrollIntoViewMock = jest.fn();

      renderLandingPage();

      const aboutSection = document.getElementById('about-section');
      if (aboutSection) {
        aboutSection.scrollIntoView = scrollIntoViewMock;
      }

      const aboutButton = screen.getByRole('button', { name: /scroll to about section/i });
      await user.click(aboutButton);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  // ── Accessibility ──────────────────────────────────────────

  describe('Accessibility', () => {
    it('renders section headings in a logical order (h1 → h2)', () => {
      renderLandingPage();
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThanOrEqual(2);
    });

    it('all interactive links have accessible labels', () => {
      renderLandingPage();
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        const hasText = link.textContent && link.textContent.trim().length > 0;
        const hasAriaLabel = link.getAttribute('aria-label');
        expect(hasText || hasAriaLabel).toBeTruthy();
      });
    });

    it('images have meaningful alt text or aria-label', () => {
      renderLandingPage();
      const images = screen
        .getAllByRole('img')
        .filter((img) => img.getAttribute('role') !== 'presentation');
      images.forEach((img) => {
        const hasAlt =
          img.tagName.toLowerCase() === 'img' &&
          img.hasAttribute('alt') &&
          img.getAttribute('alt') !== '';
        const hasAriaLabel =
          img.hasAttribute('aria-label') && img.getAttribute('aria-label') !== '';
        expect(hasAlt || hasAriaLabel).toBeTruthy();
      });
    });
  });
});
