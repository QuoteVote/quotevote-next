'use client';

/**
 * Error page: a signup link that no longer works gets the "Invalid or Expired Link"
 * notice, anything else the 404 page (approved design, Notices and States).
 */
import { useSearchParams } from 'next/navigation';
import { NoticePage } from '@/components/Public/Notice';
import NotFound from '@/app/not-found';

export default function ErrorPageContent(): React.ReactNode {
  const fromSignup = useSearchParams().get('from') === 'signup';
  return fromSignup ? <NoticePage kind="invalidLink" /> : <NotFound />;
}
