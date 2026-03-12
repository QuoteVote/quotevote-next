import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import { LandingPageContent } from './components/LandingPage/LandingPageContent';

export const metadata: Metadata = {
  title: 'Quote.Vote – Share Ideas. Vote on What Matters.',
  description:
    'An open-source, text-first platform for thoughtful dialogue. Quote, vote, and engage — no ads, no algorithms, no noise.',
  keywords: [
    'quote',
    'vote',
    'dialogue',
    'civic engagement',
    'open source',
    'democracy',
    'discussion',
  ],
  authors: [{ name: 'Quote.Vote Team' }],
  openGraph: {
    title: 'Quote.Vote – Share Ideas. Vote on What Matters.',
    description:
      'An open-source, text-first platform for thoughtful dialogue. Quote, vote, and engage — no ads, no algorithms.',
    type: 'website',
    url: 'https://quote.vote',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quote.Vote – Share Ideas. Vote on What Matters.',
    description:
      'An open-source, text-first platform for thoughtful dialogue.',
  },
};

/**
 * Landing Page (Server Component Shell)
 *
 * Root route `/`. Renders the LandingPageContent client component which
 * handles: auth redirect, navbar, hero, about, features, and footer.
 */
export default function LandingPage(): ReactElement {
  return <LandingPageContent />;
}
