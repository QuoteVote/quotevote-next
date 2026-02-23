'use client';

/**
 * Password Reset Page – app/(auth)/password-reset/page.tsx
 *
 * Renders the PasswordReset component under the (auth) route.
 * Reads `token` and `username` from the URL query string (sent via email link),
 * validates the token via a GraphQL query, and calls UPDATE_USER_PASSWORD on
 * submission.
 *
 * Expected URL: /auth/password-reset?token=<reset-token>&username=<username>
 *
 * NOTE: Wrapped in Suspense because useSearchParams() requires it in Next.js 15+.
 */

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { PasswordReset } from '@/components/PasswordReset';
import { UPDATE_USER_PASSWORD } from '@/graphql/mutations';
import { Loader2 } from 'lucide-react';

/**
 * Query to validate a password reset token before the form is shown.
 */
const VALIDATE_RESET_TOKEN = gql`
  query ValidateResetToken($token: String!, $username: String!) {
    validateResetToken(token: $token, username: $username)
  }
`;

interface ValidateTokenData {
    validateResetToken: boolean;
}

/**
 * Inner component that reads search params and renders the PasswordReset UI.
 * Must live inside a Suspense boundary because of useSearchParams().
 */
function PasswordResetContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get('token') ?? '';
    const username = searchParams.get('username') ?? '';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordUpdated, setPasswordUpdated] = useState(false);

    // Validate the token server-side. Skip when params are missing so we
    // show the "invalid token" UI instead of firing an empty query.
    const {
        data: tokenData,
        loading: loadingData,
        error: tokenError,
    } = useQuery<ValidateTokenData>(VALIDATE_RESET_TOKEN, {
        variables: { token, username },
        skip: !token || !username,
        fetchPolicy: 'network-only',
    });

    useEffect(() => {
        if (tokenError) {
            setError(tokenError.message ?? 'Token validation failed.');
        }
    }, [tokenError]);

    const isValidToken: boolean =
        !!(token && username) && (tokenData?.validateResetToken ?? false);

    const [updatePassword] = useMutation(UPDATE_USER_PASSWORD);

    const handleSubmit = async ({
        password,
    }: {
        password: string;
        confirmPassword: string;
    }) => {
        setLoading(true);
        setError(null);
        try {
            await updatePassword({ variables: { username, password, token } });
            setPasswordUpdated(true);
            toast.success('Password updated successfully!');
        } catch (err) {
            const apolloError = err as Error;
            const message = apolloError.message || 'Failed to update password. Please try again.';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Redirect to login shortly after a successful password update
    useEffect(() => {
        if (!passwordUpdated) return;
        const timer = setTimeout(() => router.push('/auth/login'), 3000);
        return () => clearTimeout(timer);
    }, [passwordUpdated, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
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

/**
 * Page component — wraps the inner content in Suspense so that
 * useSearchParams() in PasswordResetContent is fully supported.
 */
export default function PasswordResetPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }
        >
            <PasswordResetContent />
        </Suspense>
    );
}
