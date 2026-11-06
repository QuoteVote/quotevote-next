import type { Metadata } from 'next';
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Code of Conduct'),
  description: 'The standards for respectful, good-faith participation on Quote.Vote.',
  path: '/code-of-conduct',
});

export default function CodeOfConductPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Code of Conduct</h1>
      <p className="text-gray-500">Full content coming soon.</p>
    </main>
  );
}
