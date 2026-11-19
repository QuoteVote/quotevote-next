import type { Metadata } from 'next';
import { DocsLayout } from '@/components/Public/DocsLayout';

export const metadata: Metadata = {
  title: 'Terms of Service - Quote.Vote',
};

export default function TermsPage() {
  return (
    <DocsLayout
      current="terms"
      title="Terms of Service"
      intro="The full Terms of Service are being finalized and will be published here. Until then, the Code of Conduct sets out how to take part."
      sections={[]}
    />
  );
}
