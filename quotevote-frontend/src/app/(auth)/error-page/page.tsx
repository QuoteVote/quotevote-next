'use client';

/**
 * Error Page
 * 
 * Error page for authentication routes.
 * Shows error messages for invalid/expired tokens or 404 errors.
 * Migrated from legacy ErrorPage.jsx.
 */

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/common/Loader';

function ErrorPageContent(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  const fromSignup = from === 'signup';

  const handleBack = () => {
    router.push('/home');
  };

  return (
    <div className="flex items-center justify-center min-h-full w-full p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {fromSignup ? 'Link Expired' : '404'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold text-center">
            {fromSignup ? 'Invalid or Expired Link' : 'Page not found'}
          </h2>
          <p className="text-muted-foreground text-center">
            {fromSignup
              ? 'Your invitation link has expired or is invalid. Invitation links are valid for 24 hours. Please request a new invitation or contact support.'
              : 'Oooops! Looks like you got lost.'}
          </p>
          <div className="flex gap-3 justify-center">
            {fromSignup ? (
              <>
                <Button asChild variant="default">
                  <Link href="/request-access">Request New Invite</Link>
                </Button>
                <Button onClick={handleBack} variant="outline">
                  Go to Home
                </Button>
              </>
            ) : (
              <Button onClick={handleBack} variant="default">
                Go to Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ErrorPage(): React.ReactNode {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    }>
      <ErrorPageContent />
    </Suspense>
  );
}
