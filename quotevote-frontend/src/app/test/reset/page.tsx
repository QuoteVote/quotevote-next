'use client';

import { useState } from 'react';
import { ForgotPassword, EmailSent } from '@/components/ForgotPassword';
import { PasswordReset } from '@/components/PasswordReset';

export default function TestResetPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  const handleForgotPasswordSubmit = async (values: { email: string }) => {
    setLoading(true);
    setError(null);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simulate error for testing
    if (values.email === 'error@test.com') {
      setError('Email not found');
      setLoading(false);
      return;
    }
    
    setEmailSent(true);
    setLoading(false);
  };

  const handlePasswordResetSubmit = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    setError(null);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simulate error for testing
    if (values.password === 'error') {
      setError('Password reset failed');
      setLoading(false);
      return;
    }
    
    setPasswordUpdated(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Password Reset Components Test</h1>
          
          <div className="grid gap-8 md:grid-cols-2">
            {/* Forgot Password Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Forgot Password</h2>
              {!emailSent ? (
                <ForgotPassword
                  onSubmit={handleForgotPasswordSubmit}
                  loading={loading}
                  error={error}
                />
              ) : (
                <EmailSent />
              )}
            </div>

            {/* Password Reset Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Password Reset</h2>
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => setIsValidToken(!isValidToken)}
                  className="rounded bg-primary px-3 py-1 text-primary-foreground"
                >
                  Toggle Token Validity: {isValidToken ? 'Valid' : 'Invalid'}
                </button>
              </div>
              <PasswordReset
                onSubmit={handlePasswordResetSubmit}
                loading={loading}
                error={error}
                passwordUpdated={passwordUpdated}
                isValidToken={isValidToken}
                loadingData={false}
              />
            </div>
          </div>

          {/* Test Instructions */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-semibold">Test Instructions:</h3>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                <strong>Forgot Password:</strong> Enter any email (except
                error@test.com to test error state)
              </li>
              <li>
                <strong>Password Reset:</strong> Use &quot;error&quot; as password
                to test error state
              </li>
              <li>
                <strong>Token Validity:</strong> Toggle the button to test
                invalid token state
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

