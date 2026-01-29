'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PasswordReset } from '@/components/PasswordReset';

/**
 * Password Reset Page Component
 * 
 * Allows users to reset their password using a token from the reset email.
 * Uses the PasswordReset component from @/components/PasswordReset.
 * 
 * Flow:
 * 1. User clicks link in password reset email (contains token in URL)
 * 2. Token is validated
 * 3. User enters new password
 * 4. Password is updated
 * 5. User is redirected to login
 */
function PasswordResetContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [passwordUpdated, setPasswordUpdated] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);

    // Get token from URL parameters
    const token = searchParams.get('token');

    useEffect(() => {
        // Validate token on component mount
        const validateToken = async () => {
            if (!token) {
                setError('Invalid or missing reset token');
                setIsValidToken(false);
                setLoadingData(false);
                return;
            }

            try {
                // TODO: Implement actual token validation API call
                // 1. Call the VALIDATE_RESET_TOKEN query with token
                // 2. Set isValidToken based on response

                // Simulate API call
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Mock token validation (in production, validate against backend)
                setIsValidToken(true);
            } catch (error) {
                setError('Invalid or expired reset token');
                setIsValidToken(false);
            } finally {
                setLoadingData(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (values: {
        password: string;
        confirmPassword: string;
    }) => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Implement actual password reset API call
            // 1. Call the RESET_PASSWORD mutation with token and new password
            // 2. Handle response and errors

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Mock successful password reset
            console.log('Password reset successful for token:', token);
            console.log('New password length:', values.password.length);

            setPasswordUpdated(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to reset password'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <PasswordReset
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
                passwordUpdated={passwordUpdated}
                isValidToken={isValidToken}
                loadingData={loadingData}
            />
        </div>
    );
}

export default function PasswordResetPage() {
    return (
        <Suspense fallback={<div className="w-full max-w-md text-center">Loading...</div>}>
            <PasswordResetContent />
        </Suspense>
    );
}
