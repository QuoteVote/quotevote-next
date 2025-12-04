import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordReset } from '@/components/PasswordReset';
import { render } from '../utils/test-utils';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('PasswordReset', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when loadingData is true', () => {
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        loadingData={true}
        isValidToken={false}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders password updated success message', () => {
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        passwordUpdated={true}
        isValidToken={true}
      />
    );

    expect(
      screen.getByText('Your password has been changed successfully!')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders password reset form when token is valid', () => {
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        isValidToken={true}
      />
    );

    expect(screen.getByText('Choose New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /confirm password/i })
    ).toBeInTheDocument();
  });

  it('renders invalid token message when token is invalid', () => {
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        isValidToken={false}
      />
    );

    expect(screen.getByText('Password Reset')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Sorry, your password reset link is invalid or expired.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Request reset password.')).toBeInTheDocument();
  });

  it('displays error message when provided', async () => {
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        error="Password reset failed"
        isValidToken={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Password reset failed')).toBeInTheDocument();
    });
  });

  it('shows loading state when submitting', () => {
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={true}
        isValidToken={true}
      />
    );

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: /updating/i });
    expect(submitButton).toBeDisabled();
  });

  it('validates password requirements', async () => {
    const user = userEvent.setup();
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        isValidToken={true}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /confirm password/i });

    // Test minimum length
    await user.type(passwordInput, 'short');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password should be more than six characters')
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates password contains uppercase, lowercase, and number', async () => {
    const user = userEvent.setup();
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        isValidToken={true}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /confirm password/i });

    // Test missing requirements
    await user.type(passwordInput, 'alllowercase123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Password should contain a number, an uppercase, and lowercase letter'
        )
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates password confirmation matches', async () => {
    const user = userEvent.setup();
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        isValidToken={true}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /confirm password/i });

    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmPasswordInput, 'DifferentPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with password when form is valid', async () => {
    const user = userEvent.setup();
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        isValidToken={true}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /confirm password/i });

    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmPasswordInput, 'ValidPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          password: 'ValidPass123',
          confirmPassword: 'ValidPass123',
        },
        expect.any(Object)
      );
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(
      <PasswordReset
        onSubmit={mockOnSubmit}
        loading={false}
        isValidToken={true}
      />
    );

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('toggle password visibility');

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);

    expect(passwordInput.type).toBe('text');
  });
});

