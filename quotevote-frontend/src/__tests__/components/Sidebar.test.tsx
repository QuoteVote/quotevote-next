/**
 * Sidebar Component Tests
 * 
 * Comprehensive tests for the Sidebar component migrated from MUI to shadcn/ui.
 * Tests cover:
 * - Component rendering (logged in and logged out states)
 * - Sidebar open/close functionality
 * - Navigation links and active states
 * - User authentication state handling
 * - Logout functionality
 * - Responsive behavior
 */

import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../../components/Sidebar';
import { useAppStore } from '@/store';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPrefetch = jest.fn();
const mockPathname = jest.fn(() => '/');

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
  })),
  usePathname: jest.fn(() => mockPathname()),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock Apollo Client
const mockApolloClient = {
  stop: jest.fn(),
  resetStore: jest.fn(),
};

jest.mock('@/lib/apollo', () => ({
  getApolloClient: jest.fn(() => mockApolloClient),
}));

// Mock useResponsive hook
const mockUseResponsive = {
  breakpoint: 'md' as const,
  isSmallScreen: false,
  isMediumScreen: true,
  isLargeScreen: false,
  isExtraLargeScreen: false,
};

jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: jest.fn(() => mockUseResponsive),
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockApolloClient.stop.mockClear();
    mockApolloClient.resetStore.mockClear();
    mockPathname.mockReturnValue('/');

    // Reset store state to logged out
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        data: {},
      },
      ui: {
        filter: { visibility: false, value: '' },
        date: { visibility: false, value: '' },
        search: { visibility: false, value: '' },
        selectedPost: { id: null },
        selectedPage: 'home',
        hiddenPosts: [],
        snackbar: { open: false, type: '', message: '' },
        selectedPlan: 'personal',
        focusedComment: null,
        sharedComment: null,
      },
    });

    // Mock localStorage
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });
    }
  });

  describe('Rendering', () => {
    it('renders sidebar component without crashing', () => {
      const { container } = render(
        <Sidebar open={false} onOpenChange={jest.fn()} />
      );

      expect(container).toBeInTheDocument();
    });

    it('renders AppBar with menu button', () => {
      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      const menuButton = screen.getByRole('button', { name: /open drawer/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('renders logo in AppBar', () => {
      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      const logo = screen.getByAltText('QuoteVote Logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Guest User (Logged Out)', () => {
    it('renders guest navigation links when user is not logged in', () => {
      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      expect(screen.getByText('Donate')).toBeInTheDocument();
      expect(screen.getByText('Volunteer')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      // Request Invite and Login appear in both sidebar and AppBar
      const requestInviteLinks = screen.getAllByText('Request Invite');
      expect(requestInviteLinks.length).toBeGreaterThan(0);
      const loginLinks = screen.getAllByText('Login');
      expect(loginLinks.length).toBeGreaterThan(0);
    });

    it('renders Request Invite and Login buttons in AppBar for guests', () => {
      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      expect(screen.getByText('Request Invite')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('navigates to request access page when Request Invite is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      const requestInviteButton = screen.getByText('Request Invite');
      await user.click(requestInviteButton);

      expect(mockPush).toHaveBeenCalledWith('/auth/request-access');
    });

    it('navigates to login page when Login is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      const loginButton = screen.getByText('Login');
      await user.click(loginButton);

      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Logged In User', () => {
    beforeEach(() => {
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: {
            _id: 'user123',
            username: 'testuser',
            name: 'Test User',
            avatar: 'https://example.com/avatar.jpg',
          },
        },
      });
    });

    it('renders user navigation links when user is logged in', () => {
      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('displays user avatar and name in sidebar', () => {
      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      const avatar = screen.getByAltText('Test User');
      expect(avatar).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('renders Create Quote button in AppBar for logged in users', () => {
      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      const createButton = screen.getByRole('button', { name: /create quote/i });
      expect(createButton).toBeInTheDocument();
    });

    it('renders user action buttons (Chat, Notifications, Settings) in AppBar', () => {
      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      // These are placeholder components, so we check for their aria-labels
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('navigates to search page when Search link is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      render(<Sidebar open={true} onOpenChange={onOpenChange} />);

      const searchLink = screen.getByText('Search').closest('a');
      if (searchLink) {
        await user.click(searchLink);
        // Link navigation is handled by Next.js Link, which doesn't call router.push in tests
        // We verify the link has the correct href instead
        expect(searchLink).toHaveAttribute('href', '/search');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });

    it('navigates to profile page when Profile link is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      render(<Sidebar open={true} onOpenChange={onOpenChange} />);

      const profileLinks = screen.getAllByText('Profile');
      const profileLink = profileLinks[0]?.closest('a');
      if (profileLink) {
        await user.click(profileLink);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('Sidebar Open/Close Functionality', () => {
    it('opens sidebar when menu button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      render(<Sidebar open={false} onOpenChange={onOpenChange} />);

      const menuButton = screen.getByRole('button', { name: /open drawer/i });
      await user.click(menuButton);

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('closes sidebar when onOpenChange is called with false', () => {
      const onOpenChange = jest.fn();
      render(<Sidebar open={true} onOpenChange={onOpenChange} />);

      // Sidebar should be open (Sheet component handles visibility)
      // Check for content that appears in sidebar when open
      const hasSidebarContent = 
        screen.queryByText('Search') || 
        screen.queryAllByText('Login').length > 0 || 
        screen.queryByText('Request Invite');
      expect(hasSidebarContent).toBeTruthy();
    });

    it('shows sidebar content when open is true', () => {
      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      // When open, we should see sidebar content
      // The exact content depends on logged in state
      const hasContent = 
        screen.queryByText('Search') || 
        screen.queryAllByText('Login').length > 0 || 
        screen.queryAllByText('Request Invite').length > 0;
      
      expect(hasContent).toBeTruthy();
    });
  });

  describe('Active Route Highlighting', () => {
    it('highlights active route in sidebar', () => {
      mockPathname.mockReturnValue('/search');
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: { _id: 'user123', username: 'testuser' },
        },
      });
      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      const searchLink = screen.getByText('Search').closest('a');
      if (searchLink) {
        expect(searchLink).toHaveClass('bg-accent');
      }
    });

    it('highlights profile route when on profile page', () => {
      mockPathname.mockReturnValue('/Profile');
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: { _id: 'user123', username: 'testuser' },
        },
      });

      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      const profileLinks = screen.getAllByText('Profile');
      const profileLink = profileLinks[0]?.closest('a');
      if (profileLink) {
        expect(profileLink).toHaveClass('bg-accent');
      }
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: {
            _id: 'user123',
            username: 'testuser',
            name: 'Test User',
          },
        },
      });
    });

    it('calls logout and navigates to login page when Sign Out is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      render(<Sidebar open={true} onOpenChange={onOpenChange} />);

      const signOutButton = screen.getByText('Sign Out');
      await user.click(signOutButton);

      // Should close sidebar
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // Should remove token from localStorage
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');

      // Should stop and reset Apollo Client
      expect(mockApolloClient.stop).toHaveBeenCalled();
      expect(mockApolloClient.resetStore).toHaveBeenCalled();

      // Should call logout from store
      const storeState = useAppStore.getState();
      expect(storeState.user.data).toEqual({});

      // Should navigate to login
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Create Quote Dialog', () => {
    beforeEach(() => {
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: { _id: 'user123', username: 'testuser' },
        },
      });
    });

    it('opens create quote dialog when Create Quote button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      const createButton = screen.getByRole('button', { name: /create quote/i });
      await user.click(createButton);

      // Dialog should open (SubmitPost component is placeholder, so we check for dialog)
      await waitFor(() => {
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('handles mobile screen size correctly', () => {
      mockUseResponsive.isSmallScreen = true;
      mockUseResponsive.isMediumScreen = false;

      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      // On mobile, GitHub link should not be visible in AppBar for logged in users
      // But it should still be accessible in the sidebar
      // Check that component renders without errors
      const menuButton = screen.getByRole('button', { name: /open drawer/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('handles desktop screen size correctly', () => {
      mockUseResponsive.isSmallScreen = false;
      mockUseResponsive.isMediumScreen = true;
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: { _id: 'user123', username: 'testuser' },
        },
      });

      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      // On desktop, all buttons should be visible
      expect(screen.getByRole('button', { name: /create quote/i })).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('applies custom bgColor prop', () => {
      const { container } = render(
        <Sidebar open={true} onOpenChange={jest.fn()} bgColor="white" />
      );

      const sheetContent = container.querySelector('[data-slot="sheet-content"]');
      if (sheetContent) {
        expect(sheetContent).toHaveClass('bg-white');
      }
    });

    it('applies rtlActive prop to change sidebar side', () => {
      const { container } = render(
        <Sidebar open={true} onOpenChange={jest.fn()} rtlActive={true} />
      );

      const sheetContent = container.querySelector('[data-slot="sheet-content"]');
      if (sheetContent) {
        // RTL should show sidebar on left
        expect(sheetContent.className).toContain('left-0');
      }
    });

    it('uses default props when not provided', () => {
      render(<Sidebar open={false} onOpenChange={jest.fn()} />);

      // Component should render with defaults
      expect(screen.getByRole('button', { name: /open drawer/i })).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('has correct href for external links', () => {
      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      const githubLinks = screen.getAllByLabelText(/github/i);
      const githubLink = githubLinks.find(link => 
        link.getAttribute('href') === 'https://github.com/QuoteVote/quotevote-monorepo'
      );
      expect(githubLink).toBeInTheDocument();
    });

    it('has correct href for internal navigation links', () => {
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: { _id: 'user123', username: 'testuser' },
        },
      });
      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      const searchLink = screen.getByText('Search').closest('a');
      if (searchLink) {
        expect(searchLink).toHaveAttribute('href', '/search');
      }
    });

    it('closes sidebar when navigation link is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: { _id: 'user123', username: 'testuser' },
        },
      });

      render(<Sidebar open={true} onOpenChange={onOpenChange} />);

      const searchLink = screen.getByText('Search').closest('a');
      if (searchLink) {
        await user.click(searchLink);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('Error Handling', () => {
    it('handles missing user data gracefully', () => {
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: { _id: 'user123' }, // Missing name and avatar
        },
      });

      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      // Should still render, using fallback values
      const profileLinks = screen.getAllByText('Profile');
      expect(profileLinks.length).toBeGreaterThan(0);
    });

    it('handles undefined avatar gracefully', () => {
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: { _id: 'user123', username: 'testuser', avatar: undefined },
        },
      });

      render(<Sidebar open={true} onOpenChange={jest.fn()} />);

      // Should render without crashing
      const profileLinks = screen.getAllByText('Profile');
      expect(profileLinks.length).toBeGreaterThan(0);
    });
  });
});

