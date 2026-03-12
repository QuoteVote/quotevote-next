'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  ArrowRight,
  MessageSquareQuote,
  ThumbsUp,
  Zap,
  ShieldOff,
  Search,
  FileText,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store';
import { SEARCH } from '@/graphql/queries';
import { useDebounce } from '@/hooks/useDebounce';

// ── Types ──────────────────────────────────────────────────────────────────

interface ContentResult {
  _id: string;
  title: string;
  creatorId: string;
  domain?: { key: string; _id: string };
}

interface CreatorResult {
  _id: string;
  name: string;
  avatar?: string;
  creator?: { _id: string };
}

// ── Static data ─────────────────────────────────────────────────────────────

const features = [
  {
    icon: MessageSquareQuote,
    title: 'Targeted Feedback',
    description: 'Quote specific text for precise, contextual responses that keep conversations focused.',
    color: 'rgba(82,178,116,0.12)',
  },
  {
    icon: Zap,
    title: 'Public Chat Threads',
    description: 'Every post spawns its own real-time discussion space for live engagement.',
    color: 'rgba(39,196,225,0.12)',
  },
  {
    icon: ThumbsUp,
    title: 'Voting Mechanics',
    description: 'Support thoughtful discourse through democratic, transparent voting.',
    color: 'rgba(82,178,116,0.12)',
  },
  {
    icon: ShieldOff,
    title: 'Ad-Free & Algorithm-Free',
    description: 'Pure, transparent conversations — no manipulation, no hidden agendas.',
    color: 'rgba(245,81,69,0.10)',
  },
] as const;

const quickLinks = [
  { href: '/auths/signup', label: 'Request Invite', external: false },
  { href: '/auths/login', label: 'Login', external: false },
  { href: 'https://opencollective.com/quotevote-duplicate/donate', label: 'Donate', external: true },
  { href: 'mailto:admin@quote.vote', label: 'Volunteer', external: true },
] as const;

const resourceLinks = [
  { href: '/TERMS.md', label: 'Terms of Service' },
  { href: '/quote_vote_code_of_conduct.md', label: 'Code of Conduct' },
  { href: '/CONTRIBUTING.md', label: 'Contributing' },
] as const;

const socialLinks = [
  { href: 'https://github.com/QuoteVote/quotevote-monorepo', Icon: Github, label: 'GitHub' },
  { href: 'https://twitter.com/quotevote', Icon: Twitter, label: 'Twitter' },
  { href: 'https://linkedin.com/company/quotevote', Icon: Linkedin, label: 'LinkedIn' },
] as const;

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * LandingPageContent
 *
 * Client component for the Quote.Vote landing page.
 * Handles auth redirect and all interactive sections.
 */
export function LandingPageContent() {
  const router = useRouter();
  const user = useAppStore((state) => state.user.data);

  useEffect(() => {
    if (user?.id) {
      router.push('/dashboard/search');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col" data-testid="landing-page">
      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-[var(--color-gray-light)]"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg"
            aria-label="Quote.Vote home"
          >
            <Image
              src="/assets/QuoteVoteLogo.png"
              alt="Quote.Vote Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="font-extrabold text-lg text-[#0A2342] tracking-wide hidden sm:block select-none">
              QUOTE.VOTE
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-background)] rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] hidden sm:block"
              aria-label="Go to home page"
            >
              Home
            </Link>

            <button
              onClick={() => scrollToSection('about-section')}
              className="px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-background)] rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] hidden sm:block"
              aria-label="Scroll to About section"
            >
              About
            </button>

            <a
              href="https://opencollective.com/quotevote-duplicate/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-background)] rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] hidden md:block"
              aria-label="Donate to Quote.Vote (opens in new tab)"
            >
              Donate
            </a>

            <div className="w-px h-5 bg-[var(--color-gray-light)] mx-1 hidden sm:block" aria-hidden />

            <Link
              href="/auths/login"
              className="px-4 py-2 text-sm font-semibold text-[var(--color-primary)] border-2 border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              aria-label="Login to your account"
            >
              Login
            </Link>

            <Link
              href="/auths/signup"
              className="px-4 py-2 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              aria-label="Request an invite to join Quote.Vote"
            >
              <span className="hidden sm:inline">Request Invite</span>
              <span className="sm:hidden">Join</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative flex-shrink-0 overflow-hidden"
        aria-labelledby="hero-heading"
        style={{ background: '#0d1f10' }}
      >
        {/* Background atmosphere */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          {/* Soft green glow centered at top */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(82,178,116,0.20) 0%, transparent 65%)',
            }}
          />
          {/* Warm amber warmth on right */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 50% 45% at 100% 25%, rgba(200,160,60,0.07) 0%, transparent 55%)',
            }}
          />
          {/* Warm amber warmth on left */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 40% 35% at 0% 70%, rgba(82,178,116,0.07) 0%, transparent 55%)',
            }}
          />
          {/* Giant decorative opening quote — brand identity element */}
          <span
            className="absolute font-serif leading-none"
            style={{
              fontSize: 'clamp(18rem, 40vw, 36rem)',
              top: '-4rem',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(82,178,116,0.035)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: '-0.05em',
            }}
          >
            &ldquo;
          </span>
          {/* Bottom edge fade */}
          <div
            className="absolute bottom-0 inset-x-0 h-24"
            style={{ background: 'linear-gradient(to top, #0d1f10, transparent)' }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">

          {/* Motto badge — shadcn Badge */}
          <div className="flex justify-center mb-7">
            <Badge
              className="gap-2 px-4 py-1.5 text-sm font-medium rounded-full"
              style={{
                background: 'rgba(82,178,116,0.10)',
                border: '1px solid rgba(82,178,116,0.25)',
                color: '#8de0a8',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                style={{ background: '#52b274' }}
                aria-hidden
              />
              No algorithms. No ads. Just conversations.
            </Badge>
          </div>

          {/* Heading — large display */}
          <h1
            id="hero-heading"
            className="text-[2.75rem] sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.08] tracking-tight"
          >
            Share Ideas.{' '}
            <span
              style={{
                background: 'linear-gradient(100deg, #52b274 10%, #9de8b8 55%, #52b274 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Vote
            </span>{' '}
            on What Matters.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg leading-relaxed mb-9 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.52)' }}>
            An open-source, text-first platform for thoughtful dialogue. Quote,
            vote, and engage in real conversations.
          </p>

          {/* Hero search */}
          <HeroSearch router={router} />

          {/* CTA buttons — shadcn Button with asChild */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
            <Button
              asChild
              size="lg"
              className="rounded-xl px-8 font-semibold text-white text-sm w-full sm:w-auto"
              style={{
                background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
                boxShadow: '0 4px 24px rgba(82,178,116,0.30), inset 0 1px 0 rgba(255,255,255,0.15)',
                border: 'none',
              }}
            >
              <Link href="/auths/signup" aria-label="Request an invite to join Quote.Vote">
                Request Invite
                <ArrowRight size={16} aria-hidden />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl px-8 font-semibold text-sm w-full sm:w-auto bg-transparent hover:bg-white/8 hover:text-white"
              style={{
                borderColor: 'rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.72)',
              }}
            >
              <Link href="/auths/login" aria-label="Login to your account">
                Login
              </Link>
            </Button>
          </div>

          {/* Trust indicators — shadcn Separator between items */}
          <div className="flex items-center justify-center mt-10 gap-0">
            {(['Open Source', 'Ad-Free', 'Community-Driven', 'No Tracking'] as const).map(
              (label, i, arr) => (
                <React.Fragment key={label}>
                  <span
                    className="text-xs font-medium px-3 sm:px-4"
                    style={{ color: 'rgba(255,255,255,0.30)' }}
                  >
                    {label}
                  </span>
                  {i < arr.length - 1 && (
                    <Separator
                      orientation="vertical"
                      className="h-3"
                      style={{ background: 'rgba(255,255,255,0.12)' }}
                    />
                  )}
                </React.Fragment>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────── */}
      <section
        id="about-section"
        className="relative overflow-hidden py-20 sm:py-28"
        style={{ background: 'var(--color-background)' }}
        aria-labelledby="about-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(82,178,116,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <p
            className="text-center text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-primary)' }}
          >
            Our Mission
          </p>

          <h2
            id="about-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-[var(--color-text-primary)] mb-6 leading-tight"
          >
            Welcome to{' '}
            <span style={{ color: 'var(--color-primary)' }}>Quote.Vote</span>
          </h2>

          <p className="text-center text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-14 leading-relaxed">
            A non-profit platform where every voice counts. Donate your time or
            money and be part of the change you&apos;d like to see in the world.
          </p>

          {/* Value pillars */}
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {[
              {
                emoji: '🗣️',
                title: 'Freedom of Expression',
                body: 'We understand the delicate balance between fostering free expression and curbing harmful behavior.',
              },
              {
                emoji: '⚖️',
                title: 'Thoughtful Moderation',
                body: 'Our policies maximize the benefits of free speech while minimizing potential harm for everyone.',
              },
              {
                emoji: '🤝',
                title: 'Stronger Communities',
                body: 'Thoughtful, respectful discourse leads to stronger communities and richer dialogue for all.',
              },
            ].map(({ emoji, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-7 shadow-sm border border-[var(--color-gray-light)] hover:shadow-md hover:-translate-y-1 transition-all text-center"
              >
                <span className="text-4xl mb-4 block" role="img" aria-label={title}>
                  {emoji}
                </span>
                <h3 className="font-bold text-base text-[var(--color-text-primary)] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* Highlighted blockquote */}
          <blockquote
            className="relative rounded-2xl px-8 py-8 mb-12 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(82,178,116,0.08) 0%, rgba(82,178,116,0.04) 100%)',
              border: '1px solid rgba(82,178,116,0.2)',
            }}
          >
            <span
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl leading-none select-none"
              style={{ color: 'rgba(82,178,116,0.4)' }}
              aria-hidden
            >
              &ldquo;
            </span>
            <p className="text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)] leading-snug max-w-2xl mx-auto">
              Thoughtful, respectful discourse leads to stronger communities and
              richer dialogue.
            </p>
          </blockquote>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auths/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              style={{ background: 'var(--color-primary)' }}
              aria-label="Request an invite to join Quote.Vote"
            >
              Get Started
              <ArrowRight size={18} aria-hidden />
            </Link>

            <a
              href="https://opencollective.com/quotevote-duplicate/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all hover:-translate-y-0.5 border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
              aria-label="Donate to support Quote.Vote (opens in new tab)"
            >
              Donate
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ background: 'var(--color-background)' }}
        aria-labelledby="features-heading"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2
            id="features-heading"
            className="text-2xl sm:text-3xl font-bold text-center text-[var(--color-text-primary)] mb-12"
          >
            Built for Meaningful Conversations
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description, color }) => (
              <article
                key={title}
                className="bg-white rounded-xl p-6 shadow-sm border border-[var(--color-gray-light)] hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: color }}
                  aria-hidden
                >
                  <Icon size={24} style={{ color: 'var(--color-primary)' }} />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── See what people are talking about ────────────────── */}
      <section className="bg-white py-16 sm:py-20" aria-labelledby="talking-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 id="talking-heading" className="text-2xl sm:text-3xl font-bold mb-3">
            <span style={{ color: 'var(--color-primary)' }}>See what people </span>
            <span className="text-[var(--color-text-primary)]">are talking about</span>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-base leading-relaxed mb-10 max-w-lg">
            For a project as small as your household, or around the world, Quote
            Vote can host the next conversation in your life, and knock it out of
            the park.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden border border-[var(--color-gray-light)] shadow-sm">
              <Image
                src="/assets/votingPopUp.svg"
                alt="Voting popup preview showing quote selection"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
            <div className="rounded-xl overflow-hidden border border-[var(--color-gray-light)] shadow-sm">
              <Image
                src="/assets/voting-popup-2.png"
                alt="Second voting popup view with vote options"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── At any time put your Quote to Vote ────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ background: 'var(--color-background)' }}
        aria-labelledby="anytime-heading"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 id="anytime-heading" className="text-2xl sm:text-3xl font-bold mb-10">
            <span style={{ color: 'var(--color-primary)' }}>At any time </span>
            <span className="text-[var(--color-text-primary)]">put your Quote to Vote</span>
          </h2>
          <div className="rounded-xl overflow-hidden border border-[var(--color-gray-light)] shadow-sm bg-white">
            <Image
              src="/assets/atAnyTime.svg"
              alt="Interface showing how to submit a quote for voting at any time"
              width={1200}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* ── Track Conversations ───────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20" aria-labelledby="track-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 id="track-heading" className="text-2xl sm:text-3xl font-bold mb-10">
            <span style={{ color: 'var(--color-primary)' }}>Track </span>
            <span className="text-[var(--color-text-primary)]">Conversations</span>
          </h2>
          <div className="rounded-xl overflow-hidden border border-[var(--color-gray-light)] shadow-sm">
            <Image
              src="/assets/TrackConversation.svg"
              alt="Dashboard showing conversation tracking and engagement metrics"
              width={1200}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* ── CTA: Request Invite + Read our mission ────────────── */}
      <section
        className="py-14"
        style={{ background: 'var(--color-background)' }}
        aria-label="Call to action"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-6">
          <Link
            href="/auths/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            style={{ background: 'var(--color-primary)' }}
            aria-label="Request an invite to join Quote.Vote"
          >
            Request Invite
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link
            href="/auths/signup#mission"
            className="inline-flex items-center gap-1 text-lg font-medium hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
            style={{ color: 'var(--color-primary)' }}
          >
            Read our mission
            <span className="text-2xl leading-none" aria-hidden>
              »
            </span>
          </Link>
        </div>
      </section>

      {/* ── Discover without bias + Share your ideas ──────────── */}
      <section className="bg-white py-16 sm:py-20" aria-labelledby="discover-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-10">
            <div>
              <h2 id="discover-heading" className="text-2xl sm:text-3xl font-bold mb-4">
                <span style={{ color: 'var(--color-primary)' }}>Discover </span>
                <span className="text-[var(--color-text-primary)]">without bias</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] font-semibold text-base leading-relaxed mb-3">
                All conversations are searchable without ads, discovered through
                exploration, not algorithms.
              </p>
              <p className="text-[var(--color-text-secondary)] text-base leading-relaxed">
                Filter by keyword, only show from those you follow, sort by most
                interactions, or select a specific date range. Find what people
                are talking about now, or during a historical event in the past.
              </p>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" aria-labelledby="share-heading">
                <span style={{ color: 'var(--color-primary)' }}>Share </span>
                <span id="share-heading" className="text-[var(--color-text-primary)]">
                  your ideas or plans
                </span>
              </h2>
              <p className="text-[var(--color-text-secondary)] font-semibold text-base leading-relaxed mb-3">
                Post to your social circle and beyond.
              </p>
              <p className="text-[var(--color-text-secondary)] text-base leading-relaxed">
                Engage in meaningful, respectful discussions, that solve your
                problem, challenge your perspectives, or create a bit of
                whimsical fun.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Donate what you can ───────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ background: 'var(--color-background)' }}
        aria-labelledby="donate-heading"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 id="donate-heading" className="text-2xl sm:text-3xl font-bold mb-10">
            <span className="text-[var(--color-text-primary)]">Donate </span>
            <span style={{ color: 'var(--color-primary)' }}>what you can</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-10 items-start">
            <div className="flex flex-col gap-4">
              <Link
                href="/auths/signup"
                className="inline-flex items-center justify-between px-6 py-3 rounded-xl font-medium text-base transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                style={{
                  background: '#111',
                  color: 'var(--color-primary)',
                  border: '2px solid var(--color-primary)',
                  boxShadow: '0 2px 0 var(--color-primary)',
                }}
                aria-label="Request an invite to join Quote.Vote"
              >
                Request Invite
                <span className="text-xl" aria-hidden>
                  »
                </span>
              </Link>
              <a
                href="https://opencollective.com/quotevote-duplicate/donate"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-base transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                style={{
                  background: '#fff',
                  color: 'var(--color-primary)',
                  border: '2px solid var(--color-primary)',
                  boxShadow: '3px 3px 0 var(--color-primary)',
                }}
                aria-label="Donate to Quote.Vote today (opens in new tab)"
              >
                Donate Today
              </a>
            </div>

            <div className="space-y-3">
              <p className="text-[var(--color-text-primary)] font-bold text-base">
                We have raised over $500 in donations.
              </p>
              <p className="text-[var(--color-text-secondary)] text-base">
                If you choose to use or fork our project, kindly consider making a
                contribution.
              </p>
              <p className="text-[var(--color-text-secondary)] text-base">
                Join us in creating a truly open and equal community where civil
                conversation is the main objective.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Be in Touch (email form) ──────────────────────────── */}
      <BeInTouchSection />

      {/* ── Group image ───────────────────────────────────────── */}
      <div className="bg-white">
        <Image
          src="/assets/group-image.svg"
          alt="Diverse group of people engaged in conversation on Quote.Vote"
          width={1200}
          height={400}
          className="w-full h-auto"
        />
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer
        role="contentinfo"
        className="text-white mt-auto"
        style={{ background: 'linear-gradient(135deg, #0A2342 0%, #1a3a5c 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* About */}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-bold text-base mb-4" style={{ color: 'var(--color-primary)' }}>
                About
              </h3>
              <p className="text-sm text-white/70 italic mb-4 leading-relaxed">
                Empowering thoughtful discourse and community engagement through
                democratic quote voting.
              </p>
              <a
                href="mailto:admin@quote.vote"
                className="text-sm text-white/80 hover:text-[var(--color-primary)] transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
                aria-label="Contact us via email at admin@quote.vote"
              >
                <Mail size={14} aria-hidden />
                admin@quote.vote
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-base mb-4" style={{ color: 'var(--color-primary)' }}>
                Quick Links
              </h3>
              <ul className="space-y-2" role="list">
                {quickLinks.map(({ href, label, external }) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm text-white/80 hover:text-[var(--color-primary)] hover:translate-x-1 transition-all inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
                      aria-label={external ? `${label} (opens in new tab)` : label}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-base mb-4" style={{ color: 'var(--color-primary)' }}>
                Resources
              </h3>
              <ul className="space-y-2" role="list">
                {resourceLinks.map(({ href, label }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-white/80 hover:text-[var(--color-primary)] hover:translate-x-1 transition-all inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className="font-bold text-base mb-4" style={{ color: 'var(--color-primary)' }}>
                Connect With Us
              </h3>
              <ul
                className="flex gap-3 list-none p-0 m-0"
                aria-label="Social media links"
              >
                {socialLinks.map(({ href, Icon, label }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit our ${label} (opens in new tab)`}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white/80 hover:text-[var(--color-primary)] hover:scale-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <Icon size={20} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-white/60 mb-2" aria-label="Made with love on Earth">
              Made with{' '}
              <span role="img" aria-label="love">
                ❤️
              </span>{' '}
              on Earth
            </p>
            <p className="text-sm text-white/50">
              © {new Date().getFullYear()} Quote.Vote. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Hero Search Bar ────────────────────────────────────────────────────────

interface HeroSearchProps {
  router: ReturnType<typeof useRouter>;
}

/**
 * HeroSearch
 *
 * Hero search bar with live inline results via Apollo SEARCH query.
 * Debounces input, shows loading skeletons, empty state, and result groups.
 * On submit, redirects to /dashboard/search.
 */
function HeroSearch({ router }: HeroSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data, loading, error } = useQuery(SEARCH, {
    variables: { text: debouncedQuery },
    skip: !debouncedQuery.trim(),
  });

  const contentResults: ContentResult[] = data?.searchContent ?? [];
  const creatorResults: CreatorResult[] = data?.searchCreator ?? [];
  const hasResults = contentResults.length > 0 || creatorResults.length > 0;
  const showDropdown = isOpen && debouncedQuery.trim().length > 0;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setIsOpen(false);
      router.push('/dashboard/search');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  const handleResultClick = () => {
    setIsOpen(false);
    router.push('/dashboard/search');
  };

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto w-full">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search conversations"
      >
        <div
          className="flex items-center rounded-2xl overflow-hidden shadow-xl"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.22)',
          }}
        >
          <label htmlFor="hero-search" className="sr-only">
            Search topics, quotes, conversations
          </label>
          <Search
            size={20}
            className="ml-5 flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            aria-hidden
          />
          <input
            id="hero-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search topics, quotes, conversations…"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/50 text-base px-4 py-4"
            aria-label="Search topics, quotes, conversations"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            autoComplete="off"
          />
          <button
            type="submit"
            className="m-2 px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white flex-shrink-0"
            style={{ background: 'var(--color-primary)' }}
            aria-label="Submit search"
          >
            Search
          </button>
        </div>
      </form>

      {/* Live results dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden z-50 text-left"
          style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)' }}
          role="listbox"
          aria-label="Search results"
        >
          {/* Loading state */}
          {loading && (
            <div className="p-4 space-y-3" data-testid="search-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="p-5 text-center" data-testid="search-error">
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                Search unavailable. Please try again.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && !hasResults && (
            <div className="p-6 text-center" data-testid="search-empty">
              <p className="text-sm text-gray-500">
                No results for &ldquo;<strong>{debouncedQuery}</strong>&rdquo;
              </p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

          {/* Results */}
          {!loading && !error && hasResults && (
            <div className="py-2 max-h-80 overflow-y-auto">
              {contentResults.length > 0 && (
                <>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Posts
                  </p>
                  {contentResults.slice(0, 5).map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={handleResultClick}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(82,178,116,0.12)' }}
                        aria-hidden
                      >
                        <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {item.domain?.key && (
                          <p className="text-xs text-gray-500 truncate">{item.domain.key}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {creatorResults.length > 0 && (
                <>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    People
                  </p>
                  {creatorResults.slice(0, 3).map((creator) => (
                    <button
                      key={creator._id}
                      type="button"
                      onClick={handleResultClick}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {creator.avatar ? (
                          <Image
                            src={creator.avatar}
                            alt={creator.name ?? 'Creator avatar'}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-gray-400" aria-hidden />
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{creator.name}</p>
                    </button>
                  ))}
                </>
              )}

              <div className="border-t border-gray-100 px-4 py-3">
                <button
                  type="button"
                  onClick={handleResultClick}
                  className="text-sm font-medium transition-colors hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  See all results for &ldquo;{debouncedQuery}&rdquo;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Be in Touch Section ────────────────────────────────────────────────────

const EMAIL_REGEX =
  /^(("[\w-+\s]+")|(([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*)))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i;

/**
 * BeInTouchSection
 *
 * Email newsletter / stay-in-touch form with client-side validation.
 */
function BeInTouchSection() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmed = email.trim();

    if (!EMAIL_REGEX.test(trimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/auth/check-email?email=${encodeURIComponent(trimmed)}`);
      const result = await res.json();

      if (result.status === 'registered') {
        setSuccessMessage("You're already part of the community!");
      } else {
        setSuccessMessage("Thank you for reaching out! We'll be in touch soon.");
        setEmail('');
      }
    } catch {
      setErrorMessage('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errorMessage) setErrorMessage('');
  };

  return (
    <section className="py-16 sm:py-20 bg-white" aria-labelledby="touch-heading">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2
          id="touch-heading"
          className="text-2xl sm:text-3xl font-bold mb-4 text-[var(--color-text-primary)]"
        >
          Please Be{' '}
          <span style={{ color: 'var(--color-primary)' }}>in Touch!</span>
        </h2>
        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed max-w-xl mx-auto mb-8">
          Our team is made up of volunteer contributors from around the world.
          Sign up for our email newsletter — we&apos;ll send updates as we make
          progress.{' '}
          <strong className="text-[var(--color-text-primary)]">
            Your contributions, as simple as a subscribe or as great as a
            donation, are much appreciated.
          </strong>
        </p>

        <div className="flex items-center justify-center gap-4">
          <Image
            src="/assets/donate-emoji-1.svg"
            alt=""
            aria-hidden
            width={64}
            height={64}
            className="hidden sm:block flex-shrink-0"
          />

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex-1 max-w-md"
            aria-label="Stay in touch email form"
          >
            <div
              className="flex items-center rounded-2xl border-2 overflow-hidden bg-white"
              style={{ borderColor: 'var(--color-gray-light)' }}
            >
              <label htmlFor="touch-email" className="sr-only">
                Email address
              </label>
              <input
                id="touch-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={handleEmailChange}
                className="flex-1 border-none outline-none text-base px-5 py-4 bg-transparent text-[var(--color-text-primary)] placeholder:text-gray-400"
                aria-invalid={!!errorMessage}
                aria-describedby={
                  errorMessage ? 'touch-error' : successMessage ? 'touch-success' : undefined
                }
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="m-2 px-6 py-2.5 rounded-xl font-medium text-base text-white transition-all hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                style={{ background: 'var(--color-primary)' }}
              >
                {isSubmitting ? 'Sending…' : 'Contact'}
              </button>
            </div>

            {errorMessage && (
              <p
                id="touch-error"
                role="alert"
                className="mt-2 text-sm text-left"
                style={{ color: 'var(--color-danger)' }}
              >
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p
                id="touch-success"
                role="status"
                className="mt-2 text-sm text-left"
                style={{ color: 'var(--color-success)' }}
              >
                {successMessage}
              </p>
            )}
          </form>

          <Image
            src="/assets/donate-emoji-2.svg"
            alt=""
            aria-hidden
            width={64}
            height={64}
            className="hidden sm:block flex-shrink-0"
          />
        </div>
      </div>
    </section>
  );
}
