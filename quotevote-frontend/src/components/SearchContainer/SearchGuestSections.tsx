'use client'

import { useAppStore } from '@/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthModal } from '@/context/AuthModalContext'
import {
  MessageSquareQuote,
  ThumbsUp,
  MessageCircle,
  Heart,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

// ── Static data ─────────────────────────────────────────────────────────────

const DONATE_URL = 'https://opencollective.com/quotevote/donate'

const features = [
  {
    icon: MessageSquareQuote,
    title: 'Quote & Discuss',
    description:
      'Share meaningful quotes and spark thoughtful conversations with a community that values ideas.',
  },
  {
    icon: ThumbsUp,
    title: 'Vote & React',
    description:
      'Surface the best ideas through community voting. Your voice shapes the conversation.',
  },
  {
    icon: MessageCircle,
    title: 'Track Conversations',
    description:
      'Follow discussions that matter to you and get notified when the dialogue evolves.',
  },
] as const

const stats = [
  { icon: Users, label: 'Active members' },
  { icon: TrendingUp, label: 'Growing daily' },
  { icon: MessageSquareQuote, label: 'Quotes shared' },
] as const

/**
 * SearchGuestSections component
 *
 * Renders a rich set of CTA sections for unauthenticated users below the
 * search results, including a feature showcase, community join prompt,
 * donate appeal, and social proof banner.
 * Returns null if the user is already logged in.
 */
export default function SearchGuestSections() {
  const user = useAppStore((state) => state.user.data)
  const { openAuthModal } = useAuthModal()

  if (user?._id || user?.id) return null

  return (
    <div className="mt-6 space-y-6">
      {/* ── Feature Showcase ─────────────────────────────────────────────── */}
      <section aria-labelledby="guest-features-heading">
        <h2
          id="guest-features-heading"
          className="text-lg font-semibold text-foreground mb-4"
        >
          Discover what you can do
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="group hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-5 space-y-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Join the Community CTA ───────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 sm:p-8">
            <div className="max-w-lg space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                Join the community
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create an account to share quotes, vote on ideas, and join
                discussions with a growing community of curious thinkers. It
                only takes a moment to get started.
              </p>
              <Button
                onClick={openAuthModal}
                size="lg"
                className="gap-2"
              >
                Sign up now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            {/* Decorative blurred circles */}
            <div
              className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Support / Donate ─────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10">
            <Heart className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Support Quote.Vote
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Quote.Vote is a non-profit, community-driven platform. Your
              donation helps us keep the lights on and the conversations
              flowing.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
            asChild
          >
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              Donate
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* ── Social Proof Banner ──────────────────────────────────────────── */}
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="py-6 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2" aria-hidden="true">
                {[
                  'bg-primary/70',
                  'bg-primary/50',
                  'bg-primary/30',
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-full ${bg} border-2 border-background flex items-center justify-center`}
                  >
                    <Users className="h-3.5 w-3.5 text-white" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-foreground">
                Join thousands of thinkers sharing ideas
              </p>
            </div>
            <div className="flex items-center gap-6">
              {stats.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
