import type { Metadata } from 'next';
import { RequestAccessPageContent } from './PageContent';

export const metadata: Metadata = {
  title: 'Request Access - Quote.Vote',
  description: 'Request an invite to join Quote.Vote.',
};

export default function RequestAccessPage() {
  return <RequestAccessPageContent />;
}
