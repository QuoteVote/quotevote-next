import type { Metadata } from 'next';
import { AuthRedirect } from '@/components/LandingPage/AuthRedirect';
import { LandingPageNavbar } from '@/components/LandingPage/LandingPageNavbar';
import { LandingPageHero } from '@/components/LandingPage/LandingPageHero';
import { LandingPageFooter } from '@/components/LandingPage/LandingPageFooter';

/**
 * Landing Page Root (app/page.tsx)
 * 
 * Migrated from legacy src-old/views/LandingPage/LandingPage.jsx
 * Following Next.js App Router patterns:
 * - Server Component for SEO and performance
 * - Client Components only where interactive logic is needed
 */
export const metadata: Metadata = {
  title: "Quote.Vote - Welcome",
  description: "Join the conversation on Quote.Vote - a text-first platform for thoughtful dialogue.",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      {/* Client-side auth check */}
      <AuthRedirect />

      {/* Layout Sections */}
      <LandingPageNavbar /> {/* Client Component for interactive nav */}
      <LandingPageHero />   {/* Server Component for static content */}
      <LandingPageFooter /> {/* Server Component for static content */}
    </div>
  );
}
