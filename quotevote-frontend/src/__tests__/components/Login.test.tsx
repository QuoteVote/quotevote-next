/**
 * Tests for Login Component
 */

import { render, screen } from '@testing-library/react';
import { Login } from '@/app/components/Login';
import { useAppStore } from '@/store/useAppStore';
import type { AppState } from '@/types/store';

// Mock the useAppStore hook
jest.mock('@/store/useAppStore');

describe('Login Component', () => {
    const mockOnSubmit = jest.fn();
    const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAppStore.mockReturnValue({
            user: { loginError: null },
        } as Partial<AppState> as AppState);
    });

    it('renders login component with header', () => {
        render(<Login onSubmit={mockOnSubmit} loading={false} />);

        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('renders username/email input field', () => {
        render(<Login onSubmit={mockOnSubmit} loading={false} />);

        expect(screen.getByLabelText(/email\/username/i)).toBeInTheDocument();
    });

    it('renders password input field', () => {
        render(<Login onSubmit={mockOnSubmit} loading={false} />);

        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
        render(<Login onSubmit={mockOnSubmit} loading={false} />);

        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
        render(<Login onSubmit={mockOnSubmit} loading={false} />);

        const forgotPasswordLink = screen.getByText('Forgot password?');
        expect(forgotPasswordLink).toBeInTheDocument();
        expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot');
    });

    it('renders request access link', () => {
        render(<Login onSubmit={mockOnSubmit} loading={false} />);

        const requestAccessLink = screen.getByText('Request Access');
        expect(requestAccessLink).toBeInTheDocument();
        expect(requestAccessLink).toHaveAttribute('href', '/auth/request-access');
    });

    it('renders Terms of Service link', () => {
        render(<Login onSubmit={mockOnSubmit} loading={false} />);

        const tosLink = screen.getByRole('link', { name: /terms of service/i });
        expect(tosLink).toBeInTheDocument();
        expect(tosLink).toHaveAttribute('target', '_blank');
    });

    it('renders Code of Conduct link', () => {
        render(<Login onSubmit={mockOnSubmit} loading={false} />);

        const cocLink = screen.getByRole('link', { name: /code of conduct/i });
        expect(cocLink).toBeInTheDocument();
        expect(cocLink).toHaveAttribute('target', '_blank');
    });

    it('applies background image styles', () => {
        const { container } = render(<Login onSubmit={mockOnSubmit} loading={false} />);

        const backgroundDiv = container.querySelector('.bg-cover');
        expect(backgroundDiv).toBeInTheDocument();
        expect(backgroundDiv).toHaveClass('bg-center', 'bg-no-repeat');
    });

    it('uses default onSubmit when not provided', () => {
        render(<Login loading={false} />);

        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('uses default loading state when not provided', () => {
        render(<Login onSubmit={mockOnSubmit} />);

        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });
});
