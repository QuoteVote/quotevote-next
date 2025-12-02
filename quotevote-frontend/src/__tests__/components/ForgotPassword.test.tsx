import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPassword, EmailSent } from '@/components/ForgotPassword';
import { render } from '../utils/test-utils';

describe('ForgotPassword', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the forgot password form', () => {
    render(
      <ForgotPassword onSubmit={mockOnSubmit} loading={false} />
    );

    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(
      screen.getByText('We will send you a link to reset your password.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays error message when provided', async () => {
    render(
      <ForgotPassword onSubmit={mockOnSubmit} loading={false} error="Email not found" />
    );

    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument();
    });
  });

  it('shows loading state when submitting', () => {
    render(
      <ForgotPassword onSubmit={mockOnSubmit} loading={true} />
    );

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: /sending/i });
    expect(submitButton).toBeDisabled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(
      <ForgotPassword onSubmit={mockOnSubmit} loading={false} />
    );

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /^send$/i });

    // Type invalid email and submit
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    // Wait a bit for validation to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if validation error appears or if onSubmit was not called
    // (validation prevents onSubmit from being called)
    await waitFor(() => {
      const hasError = screen.queryByText(/invalid email/i) !== null;
      const wasNotCalled = !mockOnSubmit.mock.calls.length;
      expect(hasError || wasNotCalled).toBe(true);
    }, { timeout: 2000 });

    // Verify onSubmit was not called due to validation failure
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with email when form is valid', async () => {
    const user = userEvent.setup();
    render(
      <ForgotPassword onSubmit={mockOnSubmit} loading={false} />
    );

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /send/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        expect.any(Object)
      );
    });
  });

  it('displays login and request access links', () => {
    render(
      <ForgotPassword onSubmit={mockOnSubmit} loading={false} />
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Request Access')).toBeInTheDocument();
  });
});

describe('EmailSent', () => {
  it('renders the email sent message', () => {
    render(<EmailSent />);

    expect(screen.getByText('Email Sent')).toBeInTheDocument();
    expect(
      screen.getByText('We have sent you an email to reset your password.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument();
  });
});

