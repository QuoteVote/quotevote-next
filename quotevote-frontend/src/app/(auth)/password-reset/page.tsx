'use client';

/**
 * Password Reset Page
 * 
 * Page for resetting password with token verification.
 * Migrated from legacy PasswordResetPage.jsx.
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { PasswordReset } from '@/components/PasswordReset/PasswordReset';
import { VERIFY_PASSWORD_RESET_TOKEN } from '@/graphql/queries';
import { UPDATE_USER_PASSWORD } from '@/graphql/mutations';
import { isAuthenticated } from '@/lib/utils/auth';
import { Loader } from '@/components/common/Loader';

function PasswordResetPageContent(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const { token, username } = params;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const { data, loading: loadingData } = useQuery(VERIFY_PASSWORD_RESET_TOKEN, {
    variables: { token },
    skip: !token,
  });

  const [updateUserPassword] = useMutation(UPDATE_USER_PASSWORD);
  const isValidToken = Boolean(data && (data as { verifyUserPasswordResetToken?: unknown }).verifyUserPasswordResetToken);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/home');
    }
  }, [router]);

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    const { password } = values;
    setLoading(true);
    setError('');

    try {
      await updateUserPassword({
        variables: {
          username,
          password,
          token,
        },
      });
      setPasswordUpdated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PasswordReset
      onSubmit={handleSubmit}
      loadingData={loadingData}
      loading={loading}
      passwordUpdated={passwordUpdated}
      isValidToken={isValidToken}
      error={error}
    />
  );
}

export default function PasswordResetPage(): React.ReactNode {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    }>
      <PasswordResetPageContent />
    </Suspense>
  );
}
