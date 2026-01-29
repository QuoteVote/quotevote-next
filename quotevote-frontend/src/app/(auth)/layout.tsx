import type { Metadata } from 'next';
import { AuthNavbar } from '@/components/Navbars/AuthNavbar';

export const metadata: Metadata = {
    title: 'Authentication | QuoteVote',
    description: 'Sign in or create an account to join the QuoteVote community',
};

interface AuthLayoutProps {
    children: React.ReactNode;
}

/**
 * Auth Layout Component
 * 
 * Provides a consistent layout for all authentication pages.
 * Includes the AuthNavbar and applies consistent styling across
 * login, signup, forgot-password, and password-reset pages.
 * 
 * This layout is a Server Component by default and wraps all
 * routes under the (auth) route group.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-gray-50">
            <AuthNavbar />
            <main className="flex-1 flex items-center justify-center p-4">
                {children}
            </main>
        </div>
    );
}
