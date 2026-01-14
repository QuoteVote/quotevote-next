/**
 * Authentication Flow Integration Tests
 * 
 * Tests authentication workflows including login, signup, logout,
 * password reset, and auth state management across components.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestWrapper } from '../utils/test-utils';
import { useAppStore } from '@/store';
import * as authLib from '@/lib/auth';

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  loginUser: jest.fn(),
  signupUser: jest.fn(),
  resetPassword: jest.fn(),
  logoutUser: jest.fn(),
}));

// Mock auth components
interface MockLoginProps {
  onSubmit: (data: { username: string; password: string }) => void;
  loading: boolean;
}

interface MockForgotPasswordProps {
  onSubmit: (email: string) => void;
  loading: boolean;
}

const MockLogin = ({ onSubmit, loading }: MockLoginProps) => {
  const [formData, setFormData] = React.useState({
    username: '',
    password: '',
    acceptTermsOfService: false,
    acceptCodeOfConduct: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        {errors.username && <span>{errors.username}</span>}
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        {errors.password && <span>{errors.password}</span>}
      </div>
      <div>
        <input
          type="checkbox"
          id="tos"
          checked={formData.acceptTermsOfService}
          onChange={(e) => setFormData({ ...formData, acceptTermsOfService: e.target.checked })}
        />
        <label htmlFor="tos">Accept Terms of Service</label>
      </div>
      <div>
        <input
          type="checkbox"
          id="coc"
          checked={formData.acceptCodeOfConduct}
          onChange={(e) => setFormData({ ...formData, acceptCodeOfConduct: e.target.checked })}
        />
        <label htmlFor="coc">Accept Code of Conduct</label>
      </div>
      <button type="submit" disabled={loading}>Sign In</button>
    </form>
  );
};

const MockSignupForm = ({ onSubmit, loading }: MockLoginProps) => {
  const [formData, setFormData] = React.useState({
    name: '',
    username: '',
    email: '',
    password: '',
    acceptTermsOfService: false,
    acceptCodeOfConduct: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Entered value does not match email format';
    }
    if (formData.username.length <= 4) {
      newErrors.username = 'Username should be more than 4 characters';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        {errors.username && <span data-testid="username-error">{errors.username}</span>}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        {errors.email && <span data-testid="email-error">{errors.email}</span>}
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>
      <div>
        <input
          type="checkbox"
          id="tos"
          checked={formData.acceptTermsOfService}
          onChange={(e) => setFormData({ ...formData, acceptTermsOfService: e.target.checked })}
        />
        <label htmlFor="tos">Accept Terms of Service</label>
      </div>
      <div>
        <input
          type="checkbox"
          id="coc"
          checked={formData.acceptCodeOfConduct}
          onChange={(e) => setFormData({ ...formData, acceptCodeOfConduct: e.target.checked })}
        />
        <label htmlFor="coc">Accept Code of Conduct</label>
      </div>
      <button type="submit" disabled={loading}>Sign Up</button>
    </form>
  );
};

const MockForgotPassword = ({ onSubmit, loading }: MockForgotPasswordProps) => {
  const [email, setEmail] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!email || !email.includes('@')) {
      newErrors.email = 'Entered value does not match email format';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <span data-testid="email-error">{errors.email}</span>}
      </div>
      <button type="submit" disabled={loading}>Send Reset Link</button>
    </form>
  );
};

describe('Authentication Flow Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Clear store state before each test
    useAppStore.getState().clearUserData();
    useAppStore.getState().setLoginError(null);
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should handle successful login workflow', async () => {
      const mockLoginUser = authLib.loginUser as jest.MockedFunction<typeof authLib.loginUser>;
      mockLoginUser.mockResolvedValue({
        success: true,
        data: { user: { id: '1', username: 'testuser', email: 'test@example.com' } }
      });

      const handleSubmit = jest.fn();

      render(
        <TestWrapper>
          <MockLogin onSubmit={handleSubmit} loading={false} />
        </TestWrapper>
      );

      // Fill in login form
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Accept terms
      const tosCheckbox = screen.getByRole('checkbox', { name: /terms of service/i });
      await user.click(tosCheckbox);
      
      const cocCheckbox = screen.getByRole('checkbox', { name: /code of conduct/i });
      await user.click(cocCheckbox);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
          acceptTermsOfService: true,
          acceptCodeOfConduct: true,
        });
      });
    });

    it('should handle login validation errors', async () => {
      render(
        <TestWrapper>
          <MockLogin onSubmit={jest.fn()} loading={false} />
        </TestWrapper>
      );

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should handle login API errors', async () => {
      const mockLoginUser = authLib.loginUser as jest.MockedFunction<typeof authLib.loginUser>;
      mockLoginUser.mockRejectedValue(new Error('Invalid credentials'));

      const AuthTestComponent = () => {
        const loginError = useAppStore((state) => state.user.loginError);
        const setLoginError = useAppStore((state) => state.setLoginError);

        const handleSubmit = async (values: { username: string; password: string }) => {
          try {
            await mockLoginUser(values.username, values.password);
          } catch (error) {
            setLoginError(error instanceof Error ? error.message : 'Login failed');
          }
        };

        return (
          <div>
            <MockLogin onSubmit={handleSubmit} loading={false} />
            {loginError && <div data-testid="login-error">{loginError}</div>}
          </div>
        );
      };

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), 'wronguser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpass');
      
      const tosCheckbox = screen.getByRole('checkbox', { name: /terms of service/i });
      await user.click(tosCheckbox);
      
      const cocCheckbox = screen.getByRole('checkbox', { name: /code of conduct/i });
      await user.click(cocCheckbox);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toHaveTextContent('Invalid credentials');
      });
    });
  });

  describe('Signup Flow', () => {
    it('should handle successful signup workflow', async () => {
      const mockSignupUser = authLib.signupUser as jest.MockedFunction<typeof authLib.signupUser>;
      mockSignupUser.mockResolvedValue({
        success: true,
        data: { user: { id: '2', username: 'newuser', email: 'new@example.com' } }
      });

      const handleSubmit = jest.fn();

      render(
        <TestWrapper>
          <MockSignupForm onSubmit={handleSubmit} loading={false} />
        </TestWrapper>
      );

      // Fill in signup form
      await user.type(screen.getByLabelText('Name'), 'New User');
      await user.type(screen.getByLabelText(/username/i), 'newuser');
      await user.type(screen.getByLabelText(/email/i), 'new@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Accept terms
      const tosCheckbox = screen.getByRole('checkbox', { name: /terms of service/i });
      await user.click(tosCheckbox);
      
      const cocCheckbox = screen.getByRole('checkbox', { name: /code of conduct/i });
      await user.click(cocCheckbox);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          name: 'New User',
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          acceptTermsOfService: true,
          acceptCodeOfConduct: true,
        });
      });
    });

    it('should validate signup form fields', async () => {
      render(
        <TestWrapper>
          <MockSignupForm onSubmit={jest.fn()} loading={false} />
        </TestWrapper>
      );

      // Try invalid email
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton); // Trigger validation

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(/entered value does not match email format/i);
      }, { timeout: 3000 });

      // Try short username - clear errors first
      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), 'valid@example.com');
      await user.clear(screen.getByLabelText(/username/i));
      await user.type(screen.getByLabelText(/username/i), 'abc');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username should be more than 4 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle password reset request', async () => {
      const mockResetPassword = authLib.resetPassword as jest.MockedFunction<typeof authLib.resetPassword>;
      mockResetPassword.mockResolvedValue({ success: true });

      const handleSubmit = jest.fn();

      render(
        <TestWrapper>
          <MockForgotPassword onSubmit={handleSubmit} loading={false} />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'reset@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith('reset@example.com');
      });
    });

    it('should validate email format for password reset', async () => {
      render(
        <TestWrapper>
          <MockForgotPassword onSubmit={jest.fn()} loading={false} />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(/entered value does not match email format/i);
      }, { timeout: 3000 });
    });
  });

  describe('Logout Flow', () => {
    it('should handle logout workflow', async () => {
      const mockLogoutUser = authLib.logoutUser as jest.MockedFunction<typeof authLib.logoutUser>;
      mockLogoutUser.mockResolvedValue({ success: true });

      // Set initial user state
      useAppStore.getState().setUserData({
        id: '1',
        username: 'testuser',
        email: 'test@example.com'
      });

      const LogoutTestComponent = () => {
        const user = useAppStore((state) => state.user.data);
        const clearUserData = useAppStore((state) => state.clearUserData);

        const handleLogout = async () => {
          await mockLogoutUser();
          clearUserData();
        };

        return (
          <div>
            <div data-testid="user-status">
              {user && user.username ? `Logged in as ${user.username}` : 'Not logged in'}
            </div>
            <button onClick={handleLogout} data-testid="logout-button">
              Logout
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <LogoutTestComponent />
        </TestWrapper>
      );

      // Initially logged in
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as testuser');

      // Logout
      await user.click(screen.getByTestId('logout-button'));

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
        expect(mockLogoutUser).toHaveBeenCalled();
      });
    });
  });

  describe('Auth State Management', () => {
    it('should persist auth state across components', async () => {
      const AuthStateComponent = () => {
        const user = useAppStore((state) => state.user.data);
        const setUserData = useAppStore((state) => state.setUserData);
        const clearUserData = useAppStore((state) => state.clearUserData);

        return (
          <div>
            <div data-testid="auth-status">
              {user && user.username ? `Authenticated: ${user.username}` : 'Not authenticated'}
            </div>
            <button
              onClick={() => setUserData({ id: '1', username: 'testuser' })}
              data-testid="set-auth"
            >
              Set Auth
            </button>
            <button
              onClick={clearUserData}
              data-testid="clear-auth"
            >
              Clear Auth
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <AuthStateComponent />
        </TestWrapper>
      );

      // Initially not authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');

      // Set authentication
      await user.click(screen.getByTestId('set-auth'));
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated: testuser');

      // Clear authentication
      await user.click(screen.getByTestId('clear-auth'));
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    it('should handle auth errors in store', async () => {
      const AuthErrorComponent = () => {
        const loginError = useAppStore((state) => state.user.loginError);
        const setLoginError = useAppStore((state) => state.setLoginError);

        return (
          <div>
            <div data-testid="error-status">
              {loginError || 'No error'}
            </div>
            <button
              onClick={() => setLoginError('Test error message')}
              data-testid="set-error"
            >
              Set Error
            </button>
            <button
              onClick={() => setLoginError(null)}
              data-testid="clear-error"
            >
              Clear Error
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <AuthErrorComponent />
        </TestWrapper>
      );

      // Initially no error
      expect(screen.getByTestId('error-status')).toHaveTextContent('No error');

      // Set error
      await user.click(screen.getByTestId('set-error'));
      expect(screen.getByTestId('error-status')).toHaveTextContent('Test error message');

      // Clear error
      await user.click(screen.getByTestId('clear-error'));
      expect(screen.getByTestId('error-status')).toHaveTextContent('No error');
    });
  });

  describe('Auth Component Integration', () => {
    it('should integrate login and logout components', async () => {
      const IntegratedAuthComponent = () => {
        const user = useAppStore((state) => state.user.data);
        const setUserData = useAppStore((state) => state.setUserData);
        const clearUserData = useAppStore((state) => state.clearUserData);

        const handleLogin = async (values: { username: string; password: string }) => {
          // Mock successful login
          setUserData({
            id: '1',
            username: values.username,
            email: `${values.username}@example.com`
          });
        };

        const handleLogout = () => {
          clearUserData();
        };

        if (user && user.username) {
          return (
            <div>
              <div data-testid="logged-in-user">Welcome, {user.username}!</div>
              <button onClick={handleLogout} data-testid="logout-btn">
                Logout
              </button>
            </div>
          );
        }

        return <MockLogin onSubmit={handleLogin} loading={false} />;
      };

      render(
        <TestWrapper>
          <IntegratedAuthComponent />
        </TestWrapper>
      );

      // Should show login form initially
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();

      // Fill and submit login form
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      const tosCheckbox = screen.getByRole('checkbox', { name: /terms of service/i });
      await user.click(tosCheckbox);
      
      const cocCheckbox = screen.getByRole('checkbox', { name: /code of conduct/i });
      await user.click(cocCheckbox);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should show logged in state
      await waitFor(() => {
        expect(screen.getByTestId('logged-in-user')).toHaveTextContent('Welcome, testuser!');
      });

      // Logout should return to login form
      await user.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });
    });
  });
});
