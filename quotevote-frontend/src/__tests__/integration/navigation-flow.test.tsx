/**
 * Navigation Flow Integration Tests
 * 
 * Tests navigation between components, routing behavior,
 * and state persistence across route changes.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { TestWrapper } from '../utils/test-utils';
import { useAppStore } from '@/store';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/test'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock components for testing
const MockComponent = ({ title }: { title: string }) => (
  <div data-testid="mock-component">{title}</div>
);

describe('Navigation Flow Integration', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Router Navigation', () => {
    it('should navigate programmatically using useRouter', async () => {
      const NavigationComponent = () => {
        const router = useRouter();
        
        return (
          <button
            onClick={() => router.push('/test-route')}
            data-testid="nav-button"
          >
            Navigate
          </button>
        );
      };

      render(
        <TestWrapper>
          <NavigationComponent />
        </TestWrapper>
      );

      const navButton = screen.getByTestId('nav-button');
      fireEvent.click(navButton);

      expect(mockPush).toHaveBeenCalledWith('/test-route');
    });

    it('should handle navigation with parameters', async () => {
      const NavigationComponent = () => {
        const router = useRouter();
        
        return (
          <button
            onClick={() => router.push('/posts/123?tab=comments')}
            data-testid="nav-with-params"
          >
            Navigate with Params
          </button>
        );
      };

      render(
        <TestWrapper>
          <NavigationComponent />
        </TestWrapper>
      );

      const navButton = screen.getByTestId('nav-with-params');
      fireEvent.click(navButton);

      expect(mockPush).toHaveBeenCalledWith('/posts/123?tab=comments');
    });
  });

  describe('State Persistence', () => {
    it('should maintain Zustand store state across navigation', async () => {
      const StateComponent = () => {
        const user = useAppStore((state) => state.user.data);
        const setUserData = useAppStore((state) => state.setUserData);
        const router = useRouter();

        return (
          <div>
            <div data-testid="user-display">
              {user && user.username ? user.username : 'No user'}
            </div>
            <button
              onClick={() => setUserData({ id: '1', username: 'testuser' })}
              data-testid="set-user"
            >
              Set User
            </button>
            <button
              onClick={() => router.push('/other-page')}
              data-testid="navigate-away"
            >
              Navigate Away
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <StateComponent />
        </TestWrapper>
      );

      // Initially no user
      expect(screen.getByTestId('user-display')).toHaveTextContent('No user');

      // Set user data
      fireEvent.click(screen.getByTestId('set-user'));
      expect(screen.getByTestId('user-display')).toHaveTextContent('testuser');

      // Navigate away (state should persist)
      fireEvent.click(screen.getByTestId('navigate-away'));
      expect(mockPush).toHaveBeenCalledWith('/other-page');

      // State should still be available after navigation
      expect(screen.getByTestId('user-display')).toHaveTextContent('testuser');
    });

    it('should handle navigation history correctly', async () => {
      const HistoryComponent = () => {
        const router = useRouter();
        
        return (
          <div>
            <button
              onClick={() => router.back()}
              data-testid="go-back"
            >
              Go Back
            </button>
            <button
              onClick={() => router.forward()}
              data-testid="go-forward"
            >
              Go Forward
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <HistoryComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('go-back'));
      expect(mockRouter.back).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('go-forward'));
      expect(mockRouter.forward).toHaveBeenCalled();
    });
  });

  describe('Component Integration', () => {
    it('should handle cross-component navigation', async () => {
      const ParentComponent = () => {
        const router = useRouter();
        
        const handleChildNavigation = (path: string) => {
          router.push(path);
        };

        return (
          <div>
            <MockComponent title="Parent Component" />
            <button
              onClick={() => handleChildNavigation('/child-route')}
              data-testid="child-nav"
            >
              Navigate to Child
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <ParentComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('mock-component')).toHaveTextContent('Parent Component');

      fireEvent.click(screen.getByTestId('child-nav'));
      expect(mockPush).toHaveBeenCalledWith('/child-route');
    });

    it('should handle navigation errors gracefully', async () => {
      const ErrorNavigationComponent = () => {
        const router = useRouter();
        
        const handleErrorNavigation = () => {
          try {
            router.push('/invalid-route');
          } catch (error) {
            console.error('Navigation error:', error);
          }
        };

        return (
          <button
            onClick={handleErrorNavigation}
            data-testid="error-nav"
          >
            Error Navigation
          </button>
        );
      };

      render(
        <TestWrapper>
          <ErrorNavigationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('error-nav'));
      expect(mockPush).toHaveBeenCalledWith('/invalid-route');
    });
  });

  describe('Route Parameters', () => {
    it('should handle dynamic route parameters', async () => {
      const DynamicRouteComponent = () => {
        const router = useRouter();
        
        return (
          <button
            onClick={() => router.push('/posts/123')}
            data-testid="dynamic-route"
          >
            Navigate to Dynamic Route
          </button>
        );
      };

      render(
        <TestWrapper>
          <DynamicRouteComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('dynamic-route'));
      expect(mockPush).toHaveBeenCalledWith('/posts/123');
    });

    it('should handle query parameters', async () => {
      const QueryParamsComponent = () => {
        const router = useRouter();
        
        return (
          <button
            onClick={() => router.push('/search?q=test&category=posts')}
            data-testid="query-params"
          >
            Navigate with Query
          </button>
        );
      };

      render(
        <TestWrapper>
          <QueryParamsComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('query-params'));
      expect(mockPush).toHaveBeenCalledWith('/search?q=test&category=posts');
    });
  });

  describe('Navigation Performance', () => {
    it('should handle rapid navigation calls', async () => {
      const RapidNavigationComponent = () => {
        const router = useRouter();
        
        const handleRapidNavigation = () => {
          for (let i = 0; i < 5; i++) {
            router.push(`/route-${i}`);
          }
        };

        return (
          <button
            onClick={handleRapidNavigation}
            data-testid="rapid-nav"
          >
            Rapid Navigation
          </button>
        );
      };

      render(
        <TestWrapper>
          <RapidNavigationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('rapid-nav'));
      expect(mockPush).toHaveBeenCalledTimes(5);
    });

    it('should handle prefetch calls', async () => {
      const PrefetchComponent = () => {
        const router = useRouter();
        
        return (
          <button
            onClick={() => router.prefetch('/prefetch-route')}
            data-testid="prefetch"
          >
            Prefetch Route
          </button>
        );
      };

      render(
        <TestWrapper>
          <PrefetchComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('prefetch'));
      expect(mockRouter.prefetch).toHaveBeenCalledWith('/prefetch-route');
    });
  });
});
