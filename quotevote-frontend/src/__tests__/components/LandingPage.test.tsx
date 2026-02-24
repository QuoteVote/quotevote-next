import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { useAppStore } from '@/store';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Mock Zustand store
jest.mock('@/store', () => ({
    useAppStore: jest.fn(),
}));

describe('Landing Page', () => {
    beforeEach(() => {
        (useAppStore as unknown as jest.Mock).mockReturnValue({
            user: { data: {} },
        });
    });

    it('renders the landing page correctly', () => {
        render(<Home />);

        // Check for brand name (found in navbar and footer)
        const brandNames = screen.getAllByText(/QUOTE\.VOTE/i);
        expect(brandNames.length).toBeGreaterThanOrEqual(1);
        expect(brandNames[0]).toBeInTheDocument();

        // Check for navigation links (some are duplicated in footer)
        expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /about/i })).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /donate/i }).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByRole('button', { name: /login/i }).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByRole('button', { name: /request invite/i }).length).toBeGreaterThanOrEqual(1);

        // Check for hero content
        expect(screen.getByText(/Welcome to Quote.Vote/i)).toBeInTheDocument();
    });
});
