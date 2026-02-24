'use client';

/**
 * Forgot Password Page – app/(auth)/forgot-password/page.tsx
 *
 * Renders the ForgotPassword (and EmailSent) component under the (auth) route.
 * Calls the SEND_PASSWORD_RESET_EMAIL GraphQL mutation when the user submits
 * their email address and transitions to the EmailSent confirmation view.
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';

import { ForgotPassword, EmailSent } from '@/components/ForgotPassword';
import { SEND_PASSWORD_RESET_EMAIL } from '@/graphql/mutations';

export default function ForgotPasswordPage() {
    const [emailSent, setEmailSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sendPasswordResetEmail] = useMutation(SEND_PASSWORD_RESET_EMAIL);

    const handleSubmit = async ({ email }: { email: string }) => {
        setLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail({ variables: { email } });
            setEmailSent(true);
            toast.success('Password reset email sent! Please check your inbox.');
        } catch (err) {
            const apolloError = err as Error;
            const message = apolloError.message || 'Failed to send reset email. Please try again.';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <EmailSent />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <ForgotPassword onSubmit={handleSubmit} loading={loading} error={error} />
        </div>
    );
}
