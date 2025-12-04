/**
 * Tests for SignupForm Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '@/components/SignupForm/SignupForm';

describe('SignupForm Component', () => {
    const mockUser = {
        _id: 'test-user-id',
        email: 'test@example.com',
    };
    const mockToken = 'test-token-123';
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all form fields', () => {
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
            />
        );

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('renders header text', () => {
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
            />
        );

        expect(screen.getByText('Complete Your Registration')).toBeInTheDocument();
    });

    it('pre-fills and disables email field', () => {
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
            />
        );

        const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
        expect(emailInput).toBeDisabled();
        expect(emailInput.value).toBe(mockUser.email);
    });

    it('renders Terms of Service checkbox and link', () => {
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
            />
        );

        expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
        const tosLink = screen.getByRole('link', { name: /terms of service/i });
        expect(tosLink).toHaveAttribute('href', expect.stringContaining('quote_vote_terms_of_service.md'));
        expect(tosLink).toHaveAttribute('target', '_blank');
    });

    it('renders Code of Conduct checkbox and link', () => {
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
            />
        );

        expect(screen.getByText(/code of conduct/i)).toBeInTheDocument();
        const cocLink = screen.getByRole('link', { name: /code of conduct/i });
        expect(cocLink).toHaveAttribute('href', expect.stringContaining('quote_vote_code_of_conduct.md'));
        expect(cocLink).toHaveAttribute('target', '_blank');
    });

    it('submit button is disabled when checkboxes are not accepted', async () => {
        const user = userEvent.setup();
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
            />
        );

        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /submit/i });

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'Password123');

        // Button should be disabled when checkboxes are not checked
        expect(submitButton).toBeDisabled();
    });

    it('submits form with valid data when all requirements are met', async () => {
        const user = userEvent.setup();
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
            />
        );

        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'Password123');

        // Find and click checkboxes by their ID
        const tosCheckbox = document.querySelector('#tos') as HTMLElement;
        const cocCheckbox = document.querySelector('#coc') as HTMLElement;

        await user.click(tosCheckbox);
        await user.click(cocCheckbox);

        const submitButton = screen.getByRole('button', { name: /submit/i });

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
        expect(formData.email).toBe(mockUser.email);
        expect(formData.username).toBe('testuser');
        expect(formData.password).toBe('Password123');
        expect(formData.tos).toBe(true);
        expect(formData.coc).toBe(true);
    });

    it('displays signup error when provided as string', () => {
        const errorMessage = 'Username already exists';
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
                signupError={errorMessage}
            />
        );

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('displays signup error from error object', () => {
        const errorMessage = 'Username already exists';
        const signupError = { data: { message: errorMessage } };
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
                signupError={signupError}
            />
        );

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('disables all inputs when loading', () => {
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={true}
            />
        );

        const emailInput = screen.getByLabelText(/email/i);
        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /submitting/i });

        expect(emailInput).toBeDisabled();
        expect(usernameInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
    });

    it('shows "Submitting..." text when loading', () => {
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={true}
            />
        );

        expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
    });

    it('shows "Submit" text when not loading', () => {
        render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
            />
        );

        expect(screen.getByRole('button', { name: /^submit$/i })).toBeInTheDocument();
    });

    it('applies background image styles', () => {
        const { container } = render(
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={mockOnSubmit}
                loading={false}
            />
        );

        const backgroundDiv = container.querySelector('.bg-cover');
        expect(backgroundDiv).toBeInTheDocument();
        expect(backgroundDiv).toHaveClass('bg-center', 'bg-no-repeat');
    });
});
