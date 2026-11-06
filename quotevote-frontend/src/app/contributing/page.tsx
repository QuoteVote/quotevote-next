import type { Metadata } from 'next';
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Contributing'),
  description:
    'How to contribute to Quote.Vote, the open-source platform for thoughtful public dialogue.',
  path: '/contributing',
});

export default function ContributingPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Contributing</h1>
      <p className="text-gray-500">Full content coming soon.</p>
    </main>
  );
}
