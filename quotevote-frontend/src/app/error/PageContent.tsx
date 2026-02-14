'use client';

/**
 * Error Page Content
 * 
 * Displays error messages for 404 and expired/invalid links.
 * Migrated from ErrorPage.jsx to Next.js App Router with Tailwind and shadcn/ui.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPageContent(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if user came from signup page (expired/invalid token)
  const fromSignup = searchParams.get('from') === 'signup';

  const handleBack = () => {
    router.push('/dashboard/search');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="space-y-2">
          {fromSignup ? (
            <>
              <AlertCircle className="h-16 w-16 mx-auto text-yellow-600 dark:text-yellow-400 mb-4" />
              <h1 className="text-4xl font-bold text-foreground">Link Expired</h1>
              <h2 className="text-2xl font-semibold text-muted-foreground">
                Invalid or Expired Link
              </h2>
            </>
          ) : (
            <>
              <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-4xl font-bold text-foreground">404</h1>
              <h2 className="text-2xl font-semibold text-muted-foreground">
                Page not found
              </h2>
            </>
          )}
        </div>

        <Alert variant={fromSignup ? 'warning' : 'default'} className="text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {fromSignup ? 'Invitation Link Expired' : 'Page Not Found'}
          </AlertTitle>
          <AlertDescription>
            {fromSignup
              ? 'Your invitation link has expired or is invalid. Invitation links are valid for 24 hours. Please request a new invitation or contact support.'
              : 'Oooops! Looks like you got lost.'}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {fromSignup ? (
            <>
              <Button asChild variant="default">
                <Link href="/request-access">Request New Invite</Link>
              </Button>
              <Button onClick={handleBack} variant="outline">
                Go to Search
              </Button>
            </>
          ) : (
            <Button onClick={handleBack} variant="default" className="w-full sm:w-auto">
              Go to Search
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
