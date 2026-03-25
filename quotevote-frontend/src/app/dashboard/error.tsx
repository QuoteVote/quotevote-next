'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DashboardError]', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
