'use client';

/**
 * Signup Page
 * 
 * User registration page with token verification.
 * Migrated from legacy SignupPage.jsx.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { SignupForm } from '@/components/SignupForm/SignupForm';
import { VERIFY_PASSWORD_RESET_TOKEN } from '@/graphql/queries';
import { UPDATE_USER } from '@/graphql/mutations';
import { Loader } from '@/components/common/Loader';
import { useAppStore } from '@/store/useAppStore';
import type { SignupFormData } from '@/types/signup';

function SignupPageContent(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const { token } = params;

  const [loading, setLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const { data, loading: loadingData, error: queryError } = useQuery(
    VERIFY_PASSWORD_RESET_TOKEN,
    {
      variables: { token },
      skip: !token,
    }
  );

  const [updateUser] = useMutation(UPDATE_USER);
  const user = (data && (data as { verifyUserPasswordResetToken?: { _id?: string } }).verifyUserPasswordResetToken) || false;

  useEffect(() => {
    if (!loadingData && !user) {
      if (queryError) {
        console.error('Token verification failed:', queryError.message);
      } else if (!token) {
        console.error('No token provided in URL');
      } else {
        console.error('Token verification returned no user');
      }
      router.push('/error-page?from=signup');
    }
  }, [loadingData, user, queryError, token, router]);

  const handleSubmit = async (values: SignupFormData) => {
    const { username, password, email } = values;
    setLoading(true);
    setSignupError(null);

    if (!user || typeof user !== 'object' || !('_id' in user)) {
      setSignupError('Invalid user data');
      setLoading(false);
      return;
    }

    try {
      const result = await updateUser({
        variables: {
          user: {
            _id: (user as { _id: string })._id,
            email,
            name: '',
            username,
            password,
          },
        },
      });

      if (result.data && (result.data as { updateUser?: unknown }).updateUser) {
        // Update store with user data
        const setUserData = useAppStore.getState().setUserData;
        setUserData((result.data as { updateUser: Record<string, unknown> }).updateUser);
        
        // Redirect to home
        router.push('/home');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setSignupError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!user || typeof user !== 'object' || !('_id' in user)) {
    return null; // Will redirect in useEffect
  }

  const userData = user as { _id: string; email: string; [key: string]: unknown };
  
  return (
    <div className="container mx-auto px-4">
      <SignupForm
        user={userData}
        token={token || ''}
        onSubmit={handleSubmit}
        loading={loading}
        signupError={signupError}
      />
    </div>
  );
}

export default SignupPageContent;
