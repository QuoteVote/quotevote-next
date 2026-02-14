'use client';

/**
 * Forgot Password Page Content
 * 
 * Client component for requesting password reset email.
 * Migrated from legacy ForgotPasswordPage.jsx.
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { ForgotPassword, EmailSent } from '@/components/ForgotPassword';
import { SEND_PASSWORD_RESET_EMAIL } from '@/graphql/mutations';

export default function ForgotPasswordPageContent(): React.ReactNode {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendPasswordResetEmail] = useMutation(SEND_PASSWORD_RESET_EMAIL);

  const handleSubmit = async (values: { email: string }) => {
    const { email } = values;
    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail({ variables: { email } });
      setEmailSent(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!emailSent ? (
        <ForgotPassword onSubmit={handleSubmit} loading={loading} error={error} />
      ) : (
        <EmailSent />
      )}
    </>
  );
}
