import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import { LandingPageContent } from '@/app/components/LandingPage/LandingPageContent';

const COLLECTIVE_GOAL = 1000; // USD — denominator for the progress bar

async function fetchCollectiveStats(): Promise<{ totalRaised: string; progressPct: number }> {
  try {
    const res = await fetch('https://api.opencollective.com/graphql/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ collective(slug: "quotevote") { stats { totalAmountReceived { value } } } }`,
      }),
      next: { revalidate: 3600 }, // refresh at most once per hour
    });

    if (!res.ok) throw new Error(`Open Collective API ${res.status}`);

    const json = (await res.json()) as {
      data?: { collective?: { stats?: { totalAmountReceived?: { value?: number } } } };
    };

    const value = json?.data?.collective?.stats?.totalAmountReceived?.value ?? 0;
    if (!value) return { totalRaised: '$500+', progressPct: 50 };

    const totalRaised = `$${Math.floor(value).toLocaleString('en-US')}`;
    const progressPct = Math.min(Math.round((value / COLLECTIVE_GOAL) * 100), 100);

    return { totalRaised, progressPct };
  } catch {
    return { totalRaised: '$500+', progressPct: 50 };
  }
}

export const metadata: Metadata = {
  title: 'About — Quote.Vote',
  description:
    'Learn about Quote.Vote — an open-source, text-first platform for thoughtful dialogue. Quote, vote, and engage — no ads, no algorithms, no noise.',
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
    title: 'About Quote.Vote',
    description:
      'An open-source, text-first platform for thoughtful dialogue. Quote, vote, and engage — no ads, no algorithms.',
    type: 'website',
    url: 'https://quote.vote/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Quote.Vote',
    description: 'An open-source, text-first platform for thoughtful dialogue.',
  },
};

/**
 * About Page (Server Component Shell)
 *
 * Route `/about`. Renders the LandingPageContent client component: navbar,
 * hero, features, community sections, and footer. Redirects logged-in
 * visitors to `/` (see LandingPageContent's auth-redirect effect).
 */
export default async function AboutPage(): Promise<ReactElement> {
  const { totalRaised, progressPct } = await fetchCollectiveStats();
  return <LandingPageContent totalRaised={totalRaised} progressPct={progressPct} />;
}
