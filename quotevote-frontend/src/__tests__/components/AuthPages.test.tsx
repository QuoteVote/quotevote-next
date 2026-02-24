/**
 * Tests for the (auth) route-group auth pages.
 *
 * These tests cover the four new App Router pages:
 *   app/(auth)/login/page.tsx
 *   app/(auth)/signup/page.tsx
 *   app/(auth)/forgot-password/page.tsx
 *   app/(auth)/password-reset/page.tsx
 *
 * Apollo hooks are mocked at the module boundary; Next.js hooks
 * (useRouter, useSearchParams) are mocked via jest.mock.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ──────────────────────────────────────────────────────────────────────────────
// Next.js mocks
// ──────────────────────────────────────────────────────────────────────────────
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockRouterPush }),
    useSearchParams: () => ({
        get: (key: string) => {
            const params: Record<string, string> = {
                token: 'test-token',
                userId: 'user-123',
                email: 'invitee@example.com',
                username: 'testuser',
            };
            return params[key] ?? null;
        },
    }),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Apollo mocks
// Pages import useMutation / useQuery from '@apollo/client/react'
// gql is from '@apollo/client'
// ──────────────────────────────────────────────────────────────────────────────
const mockMutationFn = jest.fn().mockResolvedValue({ data: {} });
const mockQueryData = { validateResetToken: true };

jest.mock('@apollo/client', () => ({
    gql: (strings: TemplateStringsArray) => strings.join(''),
}));

jest.mock('@apollo/client/react', () => ({
    useMutation: jest.fn(() => [mockMutationFn, { loading: false, error: null }]),
    useQuery: jest.fn(() => ({
        data: mockQueryData,
        loading: false,
        error: null,
    })),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Zustand / store mock
// ──────────────────────────────────────────────────────────────────────────────
const mockSetUserData = jest.fn();
const mockSetLoginError = jest.fn();
jest.mock('@/store/useAppStore', () => ({
    useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
            setUserData: mockSetUserData,
            setLoginError: mockSetLoginError,
            user: { loginError: null },
            clearUserData: jest.fn(),
        }),
}));

// ──────────────────────────────────────────────────────────────────────────────
// sonner mock
// ──────────────────────────────────────────────────────────────────────────────
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
    Toaster: () => null,
}));

// ──────────────────────────────────────────────────────────────────────────────
// Component-level mocks (so tests are unit-level, not integration)
// ──────────────────────────────────────────────────────────────────────────────
jest.mock('@/app/components/Login', () => ({
    Login: ({ onSubmit, loading }: { onSubmit: (v: Record<string, string>) => void; loading: boolean }) => (
        <form
            data-testid="login-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ username: 'testuser', password: 'Password1!' });
            }}
        >
            <button type="submit" disabled={loading}>
                Log in
            </button>
        </form>
    ),
}));

jest.mock('@/components/SignupForm', () => ({
    SignupForm: ({
        onSubmit,
        loading,
        user,
    }: {
        onSubmit: (v: Record<string, string>) => void;
        loading: boolean;
        user: { email: string };
    }) => (
        <form
            data-testid="signup-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ username: 'newuser', email: user.email, password: 'Password1!' });
            }}
        >
            <span data-testid="prefilled-email">{user.email}</span>
            <button type="submit" disabled={loading}>
                Submit
            </button>
        </form>
    ),
}));

jest.mock('@/components/ForgotPassword', () => ({
    ForgotPassword: ({
        onSubmit,
        loading,
    }: {
        onSubmit: (v: { email: string }) => void;
        loading: boolean;
    }) => (
        <form
            data-testid="forgot-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ email: 'user@example.com' });
            }}
        >
            <button type="submit" disabled={loading}>
                Send
            </button>
        </form>
    ),
    EmailSent: () => <div data-testid="email-sent">Email Sent</div>,
}));

jest.mock('@/components/PasswordReset', () => ({
    PasswordReset: ({
        onSubmit,
        loading,
        isValidToken,
        passwordUpdated,
    }: {
        onSubmit: (v: { password: string; confirmPassword: string }) => void;
        loading: boolean;
        isValidToken: boolean;
        passwordUpdated: boolean;
    }) => (
        <div data-testid="password-reset">
            {!isValidToken && <p data-testid="invalid-token">Invalid token</p>}
            {passwordUpdated && <p data-testid="password-updated">Password updated</p>}
            {isValidToken && !passwordUpdated && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit({ password: 'NewPassword1!', confirmPassword: 'NewPassword1!' });
                    }}
                >
                    <button type="submit" disabled={loading}>
                        Confirm Password
                    </button>
                </form>
            )}
        </div>
    ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Import pages (after mocks are set up)
// ──────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LoginPage = require('@/app/(auth)/login/page').default as React.ComponentType;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SignupPage = require('@/app/(auth)/signup/page').default as React.ComponentType;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ForgotPasswordPage = require('@/app/(auth)/forgot-password/page').default as React.ComponentType;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PasswordResetPage = require('@/app/(auth)/password-reset/page').default as React.ComponentType;

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
    jest.clearAllMocks();
    mockMutationFn.mockResolvedValue({ data: {} });

    // Re-apply default mock implementations after clearAllMocks
    const { useMutation, useQuery } = jest.requireMock('@apollo/client/react') as {
        useMutation: jest.Mock;
        useQuery: jest.Mock;
    };
    useMutation.mockReturnValue([mockMutationFn, { loading: false, error: null }]);
    useQuery.mockReturnValue({ data: mockQueryData, loading: false, error: null });
});

// ══════════════════════════════════════════════════════════════════════════════
// LoginPage tests
// ══════════════════════════════════════════════════════════════════════════════
describe('LoginPage – app/(auth)/login/page', () => {
    it('renders the Login form', () => {
        render(<LoginPage />);
        expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('calls the login mutation when the form is submitted', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);
        await user.click(screen.getByRole('button', { name: /log in/i }));
        await waitFor(() => expect(mockMutationFn).toHaveBeenCalledTimes(1));
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// SignupPage tests
// ══════════════════════════════════════════════════════════════════════════════
describe('SignupPage – app/(auth)/signup/page', () => {
    it('renders the Signup form', () => {
        render(<SignupPage />);
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
    });

    it('pre-fills the email from URL search params', () => {
        render(<SignupPage />);
        expect(screen.getByTestId('prefilled-email').textContent).toBe('invitee@example.com');
    });

    it('calls the updateUser mutation when the form is submitted', async () => {
        const user = userEvent.setup();
        render(<SignupPage />);
        await user.click(screen.getByRole('button', { name: /submit/i }));
        await waitFor(() => expect(mockMutationFn).toHaveBeenCalledTimes(1));
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// ForgotPasswordPage tests
// ══════════════════════════════════════════════════════════════════════════════
describe('ForgotPasswordPage – app/(auth)/forgot-password/page', () => {
    it('renders the ForgotPassword form', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByTestId('forgot-form')).toBeInTheDocument();
    });

    it('calls sendPasswordResetEmail mutation on submit', async () => {
        const user = userEvent.setup();
        render(<ForgotPasswordPage />);
        await user.click(screen.getByRole('button', { name: /send/i }));
        await waitFor(() => expect(mockMutationFn).toHaveBeenCalledTimes(1));
    });

    it('shows EmailSent component after successful submission', async () => {
        // Override mutation so it resolves with success data
        const resolvedFn = jest.fn().mockResolvedValue({ data: { sendPasswordResetEmail: true } });
        const { useMutation } = jest.requireMock('@apollo/client/react') as { useMutation: jest.Mock };
        useMutation.mockReturnValueOnce([resolvedFn, { loading: false, error: null }]);

        const user = userEvent.setup();
        render(<ForgotPasswordPage />);
        await user.click(screen.getByRole('button', { name: /send/i }));
        await waitFor(() =>
            expect(screen.getByTestId('email-sent')).toBeInTheDocument()
        );
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// PasswordResetPage tests
// ══════════════════════════════════════════════════════════════════════════════
describe('PasswordResetPage – app/(auth)/password-reset/page', () => {
    it('renders PasswordReset component', () => {
        render(<PasswordResetPage />);
        expect(screen.getByTestId('password-reset')).toBeInTheDocument();
    });

    it('renders form when token is valid', () => {
        render(<PasswordResetPage />);
        expect(screen.getByRole('button', { name: /confirm password/i })).toBeInTheDocument();
    });

    it('renders invalid-token state when token validation returns false', () => {
        const { useQuery } = jest.requireMock('@apollo/client/react') as {
            useQuery: jest.Mock;
        };
        useQuery.mockReturnValueOnce({
            data: { validateResetToken: false },
            loading: false,
            error: null,
        });
        render(<PasswordResetPage />);
        expect(screen.getByTestId('invalid-token')).toBeInTheDocument();
    });

    it('calls updatePassword mutation on form submit', async () => {
        const user = userEvent.setup();
        render(<PasswordResetPage />);
        await user.click(screen.getByRole('button', { name: /confirm password/i }));
        await waitFor(() => expect(mockMutationFn).toHaveBeenCalledTimes(1));
    });
});
