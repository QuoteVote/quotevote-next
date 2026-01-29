'use client';

import { useState } from 'react';
import { SignupForm } from '@/components/SignupForm';
import type { SignupFormData } from '@/types/signup';

/**
 * Signup Page Component
 * 
 * Handles new user registration.
 * Uses the SignupForm component from @/components/SignupForm.
 * 
 * Note: This page expects user data from an invitation or email verification.
 * In production, this data would come from URL parameters or session storage.
 */
export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [signupError, setSignupError] = useState<string | null>(null);

    // TODO: In production, retrieve user data from invitation/email verification
    // This would typically come from URL parameters or session storage
    const mockUser = {
        _id: 'user-id-from-invitation',
        email: 'user@example.com',
    };

    const mockToken = 'token-from-invitation';

    const handleSubmit = async (values: SignupFormData) => {
        const { username, email } = values;

        setLoading(true);
        setSignupError(null);

        try {
            // TODO: Implement actual signup API call
            // 1. Call the UPDATE_USER mutation with username and password
            // 2. Store the authentication token
            // 3. Redirect to /search or dashboard

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Mock successful signup
            console.log('User registered:', { username, email });

            // TODO: Redirect to dashboard or search page after implementing router
            // router.push('/search');
        } catch (error) {
            setSignupError(
                error instanceof Error ? error.message : 'An unexpected error occurred'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <SignupForm
                user={mockUser}
                token={mockToken}
                onSubmit={handleSubmit}
                loading={loading}
                signupError={signupError}
            />
        </div>
    );
}
