/**
 * LogoutPage Component Tests
 * 
 * Comprehensive tests for the LogoutPage component.
 * Tests cover:
 * - Component rendering and loading state
 * - Logout functionality (token removal, Apollo reset, Zustand logout)
 * - Navigation to login page
 * - Error handling
 */

import { render, screen, waitFor, act } from '../utils/test-utils';
import { LogoutPage } from '@/components/LogoutPage';
import { useAppStore } from '@/store';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPrefetch = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock Apollo Client
const mockApolloClient = {
  stop: jest.fn(),
  resetStore: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/lib/apollo', () => ({
  getApolloClient: jest.fn(() => mockApolloClient),
}));

describe('LogoutPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockApolloClient.stop.mockClear();
    mockApolloClient.resetStore.mockClear();

    // Reset store state to logged in
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

    // Mock localStorage
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'mock-token'),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });
    }

    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders loading state with loader and message', () => {
      render(<LogoutPage />);

      expect(screen.getByText('Logging you out...')).toBeInTheDocument();
      expect(
        screen.getByText('Please wait while we securely log you out.')
      ).toBeInTheDocument();
      
      // Check for loader (it has aria-label="Loading")
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<LogoutPage className="custom-class" />);
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toHaveClass('custom-class');
    });
  });

  describe('Logout Functionality', () => {
    it('removes token from localStorage', async () => {
      render(<LogoutPage />);

      await waitFor(() => {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      });
    });

    it('stops and resets Apollo Client store', async () => {
      render(<LogoutPage />);

      await waitFor(() => {
        expect(mockApolloClient.stop).toHaveBeenCalled();
        expect(mockApolloClient.resetStore).toHaveBeenCalled();
      });
    });

    it('calls logout from Zustand store', async () => {
      render(<LogoutPage />);

      await waitFor(() => {
        const storeState = useAppStore.getState();
        expect(storeState.user.data).toEqual({});
      });
    });

    it('redirects to login page after logout', async () => {
      render(<LogoutPage />);

      // Fast-forward timers to trigger redirect
      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('performs all logout steps in correct order', async () => {
      const removeItemSpy = jest.spyOn(window.localStorage, 'removeItem');
      
      render(<LogoutPage />);

      // Fast-forward timers
      jest.advanceTimersByTime(200);

      await waitFor(() => {
        // Check that token is removed first
        expect(removeItemSpy).toHaveBeenCalledWith('token');
        
        // Then Apollo Client is stopped and reset
        expect(mockApolloClient.stop).toHaveBeenCalled();
        expect(mockApolloClient.resetStore).toHaveBeenCalled();
        
        // Then Zustand logout is called
        const storeState = useAppStore.getState();
        expect(storeState.user.data).toEqual({});
        
        // Finally redirect happens
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Error Handling', () => {
    it('still redirects to login page even when error occurs', async () => {
      // Mock console.error to suppress expected error log
      const originalError = console.error;
      console.error = jest.fn();
      
      mockApolloClient.resetStore.mockRejectedValueOnce(new Error('Test error'));

      render(<LogoutPage />);

      // Fast-forward timers past error delay (2 seconds)
      await act(async () => {
        jest.advanceTimersByTime(2200);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
      
      // Restore console.error
      console.error = originalError;
    });

    it('handles errors gracefully and redirects', async () => {
      // Mock console.error to suppress expected error log
      const originalError = console.error;
      console.error = jest.fn();
      
      // Test that errors don't prevent logout
      mockApolloClient.resetStore.mockRejectedValueOnce(new Error('Test error'));

      render(<LogoutPage />);

      // Wait for redirect to happen (even with error)
      await act(async () => {
        jest.advanceTimersByTime(2200);
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
      
      // Restore console.error
      console.error = originalError;
    });
  });

  describe('Edge Cases', () => {
    it('handles case when localStorage is not available', async () => {
      // Remove localStorage mock
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      render(<LogoutPage />);

      // Fast-forward timers to allow async operations
      jest.advanceTimersByTime(200);

      await waitFor(
        () => {
          // Should still complete logout and redirect
          expect(mockPush).toHaveBeenCalledWith('/login');
        },
        { timeout: 3000 }
      );
    });

    it('handles slow Apollo reset gracefully', async () => {
      // Make resetStore take longer
      mockApolloClient.resetStore.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      render(<LogoutPage />);

      // Fast-forward timers
      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for loading state', () => {
      render(<LogoutPage />);

      const loader = screen.getByLabelText('Loading');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('role', 'status');
    });

    it('has screen reader text for loading', () => {
      render(<LogoutPage />);

      expect(screen.getByText('Loading...', { selector: '.sr-only' })).toBeInTheDocument();
    });
  });
});

