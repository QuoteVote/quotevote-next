'use client';

/**
 * Login Page
 * 
 * Authentication page for user login.
 * Migrated from legacy LoginPage.jsx.
 */

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Login } from '@/app/components/Login/Login';
import { useAppStore } from '@/store/useAppStore';
import { loginUser } from '@/lib/auth';

function LoginPageContent(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  // Get redirect parameter from URL
  const redirectPath = searchParams.get('redirect') || '/home';

  const handleSubmit = async (values: { username: string; password: string }) => {
    const { username, password } = values;
    setLoading(true);
    
    try {
      const result = await loginUser(username, password);
      
      if (result.success && result.data) {
        // Update store with user data
        const setUserData = useAppStore.getState().setUserData;
        setUserData(result.data.user as Record<string, unknown>);
        
        // Redirect to the specified path or default to /home
        router.push(redirectPath);
      } else {
        // Handle login error
        const setLoginError = useAppStore.getState().setLoginError;
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      const setLoginError = useAppStore.getState().setLoginError;
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return <Login onSubmit={handleSubmit} loading={loading} />;
}

export default LoginPageContent;
