'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApolloClient } from '@/lib/apollo';
import { useAppStore } from '@/store';
import { Loader } from '@/components/common/Loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogOut } from 'lucide-react';
import type { LogoutPageProps } from '@/types/components';

/**
 * LogoutPage Component
 * 
 * Handles user logout by:
 * - Clearing authentication token from localStorage
 * - Resetting Apollo Client store
 * - Clearing Zustand auth state
 * - Redirecting to login page
 * 
 * Shows a loading state while performing logout operations.
 */
export function LogoutPage({ className }: LogoutPageProps) {
  const router = useRouter();
  const logout = useAppStore((state) => state.logout);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        setError(null);

        // Clear token from localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('token');
        }

        // Reset Apollo Client store
        const client = getApolloClient();
        client.stop();
        await client.resetStore();

        // Clear Zustand auth state
        logout();

        // Small delay to ensure cleanup completes
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Redirect to login page
        router.push('/login');
      } catch (err) {
        // If there's an error, still try to redirect
        const errorMessage = err instanceof Error 
          ? err.message 
          : typeof err === 'string' 
            ? err 
            : 'An error occurred during logout';
        setError(errorMessage);
        console.error('Logout error:', err);
        
        // Redirect even on error after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    };

    performLogout();
  }, [router, logout]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${className || ''}`}>
        <Alert variant="destructive" className="max-w-md">
          <LogOut className="h-4 w-4" />
          <AlertTitle>Logout Error</AlertTitle>
          <AlertDescription>
            {error}
            <br />
            <span className="text-sm mt-2 block">Redirecting to login page...</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${className || ''}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader size={40} absolutelyPositioned={false} />
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Logging you out...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please wait while we securely log you out.
          </p>
        </div>
      </div>
    </div>
  );
}

