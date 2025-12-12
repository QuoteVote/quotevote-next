/**
 * Tests for LoginForm Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/app/components/Login/LoginForm';

describe('LoginForm Component', () => {
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all form fields', () => {
        render(<LoginForm onSubmit={mockOnSubmit} loading={false} />);

        expect(screen.getByLabelText(/email\/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('renders Terms of Service checkbox and link', () => {
        render(<LoginForm onSubmit={mockOnSubmit} loading={false} />);

        expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
        const tosLink = screen.getByRole('link', { name: /terms of service/i });
        expect(tosLink).toHaveAttribute('href', expect.stringContaining('quote_vote_terms_of_service.md'));
        expect(tosLink).toHaveAttribute('target', '_blank');
    });

    it('renders Code of Conduct checkbox and link', () => {
        render(<LoginForm onSubmit={mockOnSubmit} loading={false} />);

        expect(screen.getByText(/code of conduct/i)).toBeInTheDocument();
        const cocLink = screen.getByRole('link', { name: /code of conduct/i });
        expect(cocLink).toHaveAttribute('href', expect.stringContaining('quote_vote_code_of_conduct.md'));
        expect(cocLink).toHaveAttribute('target', '_blank');
    });

    it('submit button is disabled when checkboxes are not accepted', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} loading={false} />);

        const usernameInput = screen.getByLabelText(/email\/username/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /log in/i });

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'password123');

        // Button should be disabled when checkboxes are not checked
        expect(submitButton).toBeDisabled();
    });

    it('submits form with valid data when all requirements are met', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} loading={false} />);

        const usernameInput = screen.getByLabelText(/email\/username/i);
        const passwordInput = screen.getByLabelText(/^password$/i);

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'password123');

        // Find and click checkboxes by their ID
        const tosCheckbox = document.querySelector('#tos') as HTMLElement;
        const cocCheckbox = document.querySelector('#coc') as HTMLElement;

        await user.click(tosCheckbox);
        await user.click(cocCheckbox);

        const submitButton = screen.getByRole('button', { name: /log in/i });

        // Wait for button to be enabled
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });

        await user.click(submitButton);

        // Verify form was submitted
        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Verify the form data
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const formData = mockOnSubmit.mock.calls[0][0];
        expect(formData.username).toBe('testuser');
        expect(formData.password).toBe('password123');
        expect(formData.tos).toBe(true);
        expect(formData.coc).toBe(true);
    });

    it('displays login error when provided as string', () => {
        const errorMessage = 'Invalid credentials';
        render(<LoginForm onSubmit={mockOnSubmit} loading={false} loginError={errorMessage} />);

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('displays login error from error object', () => {
        const errorMessage = 'Invalid credentials';
        const loginError = { data: { message: errorMessage } };
        render(<LoginForm onSubmit={mockOnSubmit} loading={false} loginError={loginError} />);

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('disables all inputs when loading', () => {
        render(<LoginForm onSubmit={mockOnSubmit} loading={true} />);

        const usernameInput = screen.getByLabelText(/email\/username/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /logging in/i });

        expect(usernameInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
    });

    it('shows "Logging in..." text when loading', () => {
        render(<LoginForm onSubmit={mockOnSubmit} loading={true} />);

        expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument();
    });

    it('shows "Log in" text when not loading', () => {
        render(<LoginForm onSubmit={mockOnSubmit} loading={false} />);

        expect(screen.getByRole('button', { name: /^log in$/i })).toBeInTheDocument();
    });
});
