import type { Metadata } from 'next';
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata';
import { DocsLayout } from '@/components/Public/DocsLayout';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Code of Conduct'),
  description: 'The standards for respectful, good-faith participation on Quote.Vote.',
  path: '/code-of-conduct',
});

export default function CodeOfConductPage() {
  return (
    <DocsLayout
      current="conduct"
      title="Code of Conduct"
      intro="The full Code of Conduct is being finalized and will be published here. In the meantime: respond to what was said, not to the person who said it."
      sections={[]}
    />
  );
}
