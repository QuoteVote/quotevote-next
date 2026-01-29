'use client';

import { useState } from 'react';
import { ForgotPassword, EmailSent } from '@/components/ForgotPassword';

/**
 * Forgot Password Page Component
 * 
 * Allows users to request a password reset email.
 * Uses the ForgotPassword and EmailSent components from @/components/ForgotPassword.
 * 
 * Flow:
 * 1. User enters their email address
 * 2. System sends a password reset link to the email
 * 3. EmailSent confirmation is displayed
 */
export default function ForgotPasswordPage() {
    const [emailSent, setEmailSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (values: { email: string }) => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Implement actual forgot password API call
            // 1. Call the FORGOT_PASSWORD mutation with email
            // 2. Handle response and errors

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Mock successful email send
            console.log('Password reset email sent to:', values.email);

            setEmailSent(true);
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to send reset email'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            {!emailSent ? (
                <ForgotPassword
                    onSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                />
            ) : (
                <EmailSent />
            )}
        </div>
    );
}
