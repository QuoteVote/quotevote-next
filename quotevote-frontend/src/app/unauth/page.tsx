'use client';

/**
 * Unauthenticated Page
 * 
 * Displays a token expired message and redirects to login.
 * Migrated from TokenExpired.jsx to Next.js App Router with shadcn/ui components.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function UnauthPage(): React.ReactNode {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  // Auto-redirect after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full">
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Token Expired!</AlertTitle>
          <AlertDescription>
            Please login to continue.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={handleLogin}
          className="w-full"
          variant="default"
        >
          Go to Login
        </Button>
      </div>
    </div>
  );
}
