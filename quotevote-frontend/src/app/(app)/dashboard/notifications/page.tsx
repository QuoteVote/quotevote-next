import type { Metadata } from 'next';
import { NotificationsPageContent } from './NotificationsPageContent';

export const metadata: Metadata = {
  title: 'Notifications — Quote.Vote',
  description: 'View your notifications on Quote.Vote',
};

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return <NotificationsPageContent />;
}
