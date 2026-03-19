import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PenSquare, TrendingUp, Star, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SearchContainer from '@/components/SearchContainer/SearchContainer';

export const metadata: Metadata = {
  title: 'Search - Quote.Vote',
  description: 'Search content and creators on Quote.Vote',
};

// Mark as dynamic to prevent static optimization issues
export const dynamic = 'force-dynamic';

const quickActions = [
  {
    label: 'Write',
    href: '/dashboard/post',
    icon: PenSquare,
    gradient: 'from-primary/15 to-primary/5',
    hoverGradient: 'hover:from-primary/25 hover:to-primary/10',
  },
  {
    label: 'Trending',
    href: '/dashboard/search?tab=trending',
    icon: TrendingUp,
    gradient: 'from-orange-500/15 to-orange-500/5',
    hoverGradient: 'hover:from-orange-500/25 hover:to-orange-500/10',
  },
  {
    label: 'Featured',
    href: '/dashboard/search?tab=featured',
    icon: Star,
    gradient: 'from-yellow-500/15 to-yellow-500/5',
    hoverGradient: 'hover:from-yellow-500/25 hover:to-yellow-500/10',
  },
  {
    label: 'People',
    href: '/dashboard/search?tab=friends',
    icon: Users,
    gradient: 'from-blue-500/15 to-blue-500/5',
    hoverGradient: 'hover:from-blue-500/25 hover:to-blue-500/10',
  },
];

/**
 * Search Page (Server Component)
 *
 * Dashboard page for searching content with a visually engaging feed layout.
 * Features a welcome hero, quick action cards, and the main search feed.
 *
 * Route: /dashboard/search
 */
export default function SearchPage() {
  return (
    <div className="py-6 space-y-8">
      {/* Welcome hero — small, elegant */}
      <section className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Discover Ideas
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Quote, vote, and join the conversation on topics that matter.
        </p>
      </section>

      {/* Quick action cards — horizontal scroll */}
      <section className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`
                w-32 h-20 flex-shrink-0 rounded-2xl
                flex flex-col items-center justify-center gap-1.5
                bg-gradient-to-br ${action.gradient}
                border border-primary/10
                ${action.hoverGradient}
                hover:shadow-md hover:-translate-y-0.5
                transition-all duration-200
                cursor-pointer
                text-xs font-medium text-foreground/80
              `}
            >
              <Icon className="h-5 w-5 text-foreground/70" />
              <span>{action.label}</span>
            </Link>
          );
        })}
      </section>

      {/* Main feed */}
      <Suspense fallback={<LoadingSpinner />}>
        <SearchContainer />
      </Suspense>
    </div>
  );
}
