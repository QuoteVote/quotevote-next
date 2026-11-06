import type { Metadata } from 'next';
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata';
import { NotificationsPageContent } from './NotificationsPageContent';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Notifications'),
  description: 'View your notifications on Quote.Vote.',
  path: '/notifications',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return <NotificationsPageContent />;
}
