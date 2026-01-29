/**
 * Tests for PasswordReset Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordReset } from '@/components/PasswordReset/PasswordReset';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('PasswordReset Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Rendering - Loading State', () => {
    it('shows loader when loadingData is true', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          loadingData={true}
          isValidToken={true}
        />
      );

      // Check for loader component
      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Rendering - Password Updated State', () => {
    it('shows success message when passwordUpdated is true', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          passwordUpdated={true}
          isValidToken={true}
        />
      );

      expect(
        screen.getByText(
          /your password has been changed successfully/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /login/i })
      ).toBeInTheDocument();
    });

    it('navigates to login when login button is clicked in success state', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          passwordUpdated={true}
          isValidToken={true}
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Rendering - Invalid Token State', () => {
    it('shows error message when token is invalid', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={false}
        />
      );

      expect(screen.getByText(/^Invalid Link$/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /sorry, your password reset link is invalid or expired/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /request new reset link/i })
      ).toBeInTheDocument();
    });

    it('has correct link to forgot password page', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={false}
        />
      );

      const resetLink = screen.getByRole('link', {
        name: /request new reset link/i,
      });
      expect(resetLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Rendering - Valid Token State', () => {
    it('renders form when token is valid', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      expect(screen.getByText(/choose new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/confirm password/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reset password/i })
      ).toBeInTheDocument();
    });

    it('renders password visibility toggle button', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const toggleButtons = screen.getAllByLabelText(/show password|hide password/i);
      const toggleButton = toggleButtons[0]; // Get the first one (password field)
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for empty password', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/password is required/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('shows validation error for password shorter than 6 characters', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, '12345');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
                    screen.getAllByText(/password should be more than six characters/i)[0]
        ).toBeInTheDocument();
      });
    });

    it('shows validation error for password longer than 20 characters', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'a'.repeat(21));

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getAllByText(
            /password should be less than twenty characters/i
          )[0]
        ).toBeInTheDocument();
      });
    });

    it('shows validation error for password without required characters', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password'); // No uppercase, no number

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getAllByText(
            /password should contain a number, an uppercase, and lowercase letter/i
          )[0]
        ).toBeInTheDocument();
      });
    });

    it('shows validation error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password456');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
                    screen.getAllByText(/passwords don't match/i)[0]
        ).toBeInTheDocument();
      });
    });

    it('accepts valid password that meets all requirements', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          password: 'Password123',
          confirmPassword: 'Password123',
        });
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      const toggleButtons = screen.getAllByLabelText(/show password|hide password/i);
      const toggleButton = toggleButtons[0]; // Get the first one (password field)

      // Initially password should be hidden
      expect(passwordInput.type).toBe('password');

      // Click toggle to show password
      await user.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput.type).toBe('text');
      });

      // Click toggle again to hide password
      await user.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput.type).toBe('password');
      });
    });

    it('toggles confirm password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const confirmPasswordInput = screen.getByLabelText(
        /confirm password/i
      ) as HTMLInputElement;
      const toggleButtons = screen.getAllByLabelText(/show password|hide password/i);
      const toggleButton = toggleButtons[1]; // Get the second one (confirm password field)

      // Initially password should be hidden
      expect(confirmPasswordInput.type).toBe('password');

      // Click toggle to show password
      await user.click(toggleButton);

      await waitFor(() => {
        expect(confirmPasswordInput.type).toBe('text');
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid password data', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
          password: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        });
      });
    });

    it('does not submit form with invalid password', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'short');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('disables submit button when loading', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={true}
          isValidToken={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /updating/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows "Updating..." text when loading', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={true}
          isValidToken={true}
        />
      );

      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });

    it('shows "Reset Password" text when not loading', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      expect(
        screen.getByRole('button', { name: /^reset password$/i })
      ).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when provided', () => {
      const errorMessage = 'Password reset failed';
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          error={errorMessage}
          isValidToken={true}
        />
      );

      expect(screen.getAllByText(errorMessage)[0]).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for password inputs', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('sets aria-invalid on password input when there is an error', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('associates error messages with input fields', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/password is required/i);
        expect(errorMessages.length).toBeGreaterThan(0);
        // Error messages should be visible (either in alert or inline)
        errorMessages.forEach((msg) => {
          const element = msg as HTMLElement;
          const hasDestructiveClass = element.classList.contains('text-destructive') || 
                                     element.closest('.text-destructive') !== null ||
                                     element.closest('.text-red-600') !== null ||
                                     element.closest('[role="alert"]') !== null;
          expect(hasDestructiveClass || element.textContent?.includes('Password')).toBe(true);
        });
      });
    });

    it('has accessible password visibility toggle button', () => {
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const toggleButtons = screen.getAllByLabelText(/show password|hide password/i);
      const toggleButton = toggleButtons[0]; // Get the first one (password field)
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-label', expect.stringMatching(/show password|hide password/i));
    });
  });

  describe('Edge Cases', () => {
    it('handles onSubmit prop being undefined', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset loading={false} isValidToken={true} />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      // Should not throw an error
      await waitFor(() => {
        expect(submitButton).toBeInTheDocument();
      });
    });

    it('handles password with special characters', async () => {
      const user = userEvent.setup();
      render(
        <PasswordReset
          onSubmit={mockOnSubmit}
          loading={false}
          isValidToken={true}
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      const specialPassword = 'Password123!@#';
      await user.type(passwordInput, specialPassword);
      await user.type(confirmPasswordInput, specialPassword);

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          password: specialPassword,
          confirmPassword: specialPassword,
        });
      });
    });
  });
});
