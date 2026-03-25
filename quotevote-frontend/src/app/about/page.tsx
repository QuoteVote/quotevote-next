import type { Metadata } from 'next'
import { PublicNavbar } from '@/components/PublicNavbar/PublicNavbar'
import { GuestFooter } from '@/components/GuestFooter/GuestFooter'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'About — Quote.Vote',
  description:
    'Learn about Quote.Vote — a text-first platform for thoughtful public dialogue.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 space-y-8">
        <h1 className="text-4xl font-bold text-foreground">About Quote.Vote</h1>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Quote.Vote is an open-source, text-only social platform built for thoughtful
              dialogue. Every post creates its own chatroom where people can quote, vote, and
              respond in real time.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold">How It Works</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-semibold">01</span>
                <span>Submit articles, essays, or ideas as posts</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">02</span>
                <span>Select any text to vote on it as a quote</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">03</span>
                <span>The community votes on what resonates most</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">04</span>
                <span>Real-time discussion in every post&apos;s chatroom</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold">Our Values</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Text-First', desc: 'Ideas, not images. Every post is readable.' },
                { title: 'Democratic', desc: 'Votes surface the best insights.' },
                { title: 'Zero Ads', desc: 'Open source and donation-supported.' },
                { title: 'Invite-Only', desc: 'Quality over quantity in our community.' },
              ].map(({ title, desc }) => (
                <div
                  key={title}
                  className="p-4 rounded-lg bg-muted/50 border border-border"
                >
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <GuestFooter isRequestAccess={false} />
    </div>
  )
}
