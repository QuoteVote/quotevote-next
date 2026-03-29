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
  CheckCircle2,
  Users,
  TrendingUp,
  Globe,
  Heart,
  ChevronRight,
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

const quickLinks = [
  { href: '/auths/request-access', label: 'Request Invite', external: false },
  { href: '/auths/login', label: 'Login', external: false },
  { href: 'https://opencollective.com/quotevote/donate', label: 'Donate', external: true },
  { href: 'mailto:admin@quote.vote', label: 'Volunteer', external: true },
] as const;

const resourceLinks = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/code-of-conduct', label: 'Code of Conduct' },
  { href: '/contributing', label: 'Contributing' },
] as const;

const socialLinks = [
  { href: 'https://github.com/QuoteVote/quotevote-monorepo', Icon: Github, label: 'GitHub' },
  { href: 'https://twitter.com/quotevote', Icon: Twitter, label: 'Twitter' },
  { href: 'https://linkedin.com/company/quotevote', Icon: Linkedin, label: 'LinkedIn' },
] as const;

const baseStats = [
  { value: '100%', label: 'Open Source', icon: Globe },
  { value: '0', label: 'Ads or trackers', icon: ShieldOff },
  { value: '∞', label: 'Community-driven', icon: Users },
] as const;

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/** Hook: returns [ref, isInView] — fires once when element enters viewport */
function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/** Scroll-reveal wrapper — fades/slides children in when scrolled into view */
function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, inView] = useInView(0.12);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Animated counter — counts up from 0 to value when visible */
function AnimatedCounter({ value, duration = 1200 }: { value: string; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const [counterRef, isVisible] = useInView(0.3);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    // Extract numeric portion
    const match = value.match(/^([^0-9]*)(\d+)(.*)$/);
    if (!match) return;
    const prefix = match[1];
    const target = parseInt(match[2], 10);
    const suffix = match[3];
    hasAnimated.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(`${prefix}${Math.round(target * eased)}${suffix}`);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, value, duration]);

  return <span ref={counterRef}>{display}</span>;
}

interface LandingPageContentProps {
  totalRaised?: string;
  progressPct?: number;
}

/**
 * LandingPageContent
 *
 * Client component for the Quote.Vote landing page.
 */
export function LandingPageContent({
  totalRaised = '$500+',
  progressPct = 50,
}: LandingPageContentProps) {
  const router = useRouter();
  const user = useAppStore((state) => state.user.data);

  const stats = [
    { value: totalRaised, label: 'Raised in donations', icon: Heart },
    ...baseStats,
  ];

  useEffect(() => {
    if (user?.id) {
      router.push('/dashboard/explore');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080f1a' }} data-testid="landing-page">
      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        role="navigation"
        aria-label="Main navigation"
        style={{
          background: 'rgba(13,31,16,0.96)',
          borderColor: 'rgba(82,178,116,0.15)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] rounded-lg"
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
            <span
              className="font-extrabold text-lg tracking-wide hidden sm:block select-none"
              style={{ color: '#8de0a8' }}
            >
              QUOTE.VOTE
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] hidden sm:block"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              aria-label="Go to home page"
            >
              Home
            </Link>

            <button
              onClick={() => scrollToSection('about-section')}
              className="px-3 py-2 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] hidden sm:block"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              aria-label="Scroll to About section"
            >
              About
            </button>

            <a
              href="https://opencollective.com/quotevote/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] hidden md:block"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              aria-label="Donate to Quote.Vote (opens in new tab)"
            >
              Donate
            </a>

            <div
              className="w-px h-5 mx-1 hidden sm:block"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              aria-hidden
            />

            <Link
              href="/auths/login"
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] focus-visible:ring-offset-2"
              style={{
                color: '#8de0a8',
                border: '1.5px solid rgba(82,178,116,0.35)',
                background: 'rgba(82,178,116,0.08)',
              }}
              aria-label="Login to your account"
            >
              Login
            </Link>

            <Link
              href="/auths/request-access"
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] focus-visible:ring-offset-2"
              style={{
                background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
                boxShadow: '0 2px 12px rgba(82,178,116,0.30)',
              }}
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
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(82,178,116,0.20) 0%, transparent 65%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 50% 45% at 100% 25%, rgba(200,160,60,0.07) 0%, transparent 55%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 40% 35% at 0% 70%, rgba(82,178,116,0.07) 0%, transparent 55%)',
            }}
          />
          <span
            className="absolute font-serif leading-none animate-[float_6s_ease-in-out_infinite]"
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
          <div
            className="absolute bottom-0 inset-x-0 h-24"
            style={{ background: 'linear-gradient(to top, #0d1f10, transparent)' }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
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

          <p className="text-base sm:text-lg leading-relaxed mb-9 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.52)' }}>
            An open-source, text-first platform for thoughtful dialogue. Quote,
            vote, and engage in real conversations.
          </p>

          <HeroSearch router={router} />

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
              <Link href="/auths/request-access" aria-label="Request an invite to join Quote.Vote">
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

      {/* ── Page Sections ──────────────────────────────────────── */}
      <>

      {/* ── Stats Strip ───────────────────────────────────────── */}
      <div
        className="border-y"
        style={{
          background: 'rgba(82,178,116,0.04)',
          borderColor: 'rgba(82,178,116,0.12)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }, i) => (
              <div
                key={label}
                className="flex flex-col items-center sm:items-start gap-1"
                style={{
                  borderLeft: i > 0 ? '1px solid rgba(82,178,116,0.12)' : undefined,
                  paddingLeft: i > 0 ? '1.5rem' : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: '#52b274' }} aria-hidden />
                </div>
                <span
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                  style={{ color: '#fff' }}
                >
                  <AnimatedCounter value={value} />
                </span>
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mission / About ───────────────────────────────────── */}
      <section
        id="about-section"
        className="relative overflow-hidden py-24 sm:py-32"
        style={{ background: '#080f1a' }}
        aria-labelledby="about-heading"
      >
        {/* Huge decorative background text */}
        <span
          className="absolute select-none pointer-events-none font-extrabold uppercase leading-none"
          style={{
            fontSize: 'clamp(10rem, 22vw, 20rem)',
            color: 'rgba(82,178,116,0.03)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.04em',
          }}
          aria-hidden
        >
          MISSION
        </span>
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(82,178,116,0.10) 0%, transparent 70%)',
          }}
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left — headline */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.25em] mb-5"
                style={{ color: '#52b274' }}
              >
                Our Mission
              </p>
              <h2
                id="about-heading"
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-6"
              >
                Welcome to{' '}
                <span
                  style={{
                    background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Quote.Vote
                </span>
              </h2>
              <p
                className="text-lg leading-relaxed mb-10"
                style={{ color: 'rgba(255,255,255,0.52)' }}
              >
                A non-profit platform where every voice counts. Donate your time or
                money and be part of the change you&apos;d like to see in the world.
              </p>

              {/* Blockquote */}
              <blockquote
                className="relative pl-6"
                style={{ borderLeft: '3px solid #52b274' }}
              >
                <p
                  className="text-xl sm:text-2xl font-semibold italic leading-snug"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  &ldquo;Thoughtful, respectful discourse leads to stronger communities and richer dialogue.&rdquo;
                </p>
              </blockquote>

              <div className="flex flex-wrap gap-3 mt-10">
                <Link
                  href="/auths/request-access"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
                    boxShadow: '0 4px 20px rgba(82,178,116,0.35)',
                  }}
                  aria-label="Request an invite to join Quote.Vote"
                >
                  Get Started
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <a
                  href="https://opencollective.com/quotevote/donate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
                  style={{
                    color: '#8de0a8',
                    border: '1.5px solid rgba(82,178,116,0.35)',
                    background: 'rgba(82,178,116,0.08)',
                  }}
                  aria-label="Donate to support Quote.Vote (opens in new tab)"
                >
                  Donate
                </a>
              </div>
            </div>

            {/* Right — pillars */}
            <div className="flex flex-col gap-5 lg:pt-16">
              {[
                {
                  emoji: '🗣️',
                  title: 'Freedom of Expression',
                  body: 'We understand the delicate balance between fostering free expression and curbing harmful behavior.',
                  num: '01',
                },
                {
                  emoji: '⚖️',
                  title: 'Thoughtful Moderation',
                  body: 'Our policies maximize the benefits of free speech while minimizing potential harm for everyone.',
                  num: '02',
                },
                {
                  emoji: '🤝',
                  title: 'Stronger Communities',
                  body: 'Thoughtful, respectful discourse leads to stronger communities and richer dialogue for all.',
                  num: '03',
                },
              ].map(({ emoji, title, body, num }) => (
                <div
                  key={title}
                  className="flex gap-5 p-6 rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex-shrink-0 mt-1">
                    <span
                      className="text-xs font-bold tracking-widest"
                      style={{ color: 'rgba(82,178,116,0.50)' }}
                    >
                      {num}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl" role="img" aria-label={title}>
                        {emoji}
                      </span>
                      <h3 className="font-bold text-white text-base">{title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features — Bento Grid ─────────────────────────────── */}
      <section
        className="py-24 sm:py-32 relative overflow-hidden"
        style={{ background: '#0d1f10' }}
        aria-labelledby="features-heading"
      >
        {/* Ambient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(82,178,116,0.08) 0%, transparent 70%)',
          }}
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p
              className="text-xs font-bold uppercase tracking-[0.25em] mb-4"
              style={{ color: '#52b274' }}
            >
              Platform Features
            </p>
            <h2
              id="features-heading"
              className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
            >
              Built for{' '}
              <span
                style={{
                  background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Meaningful
              </span>{' '}
              Conversations
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 01 — large */}
            <ScrollReveal className="lg:col-span-2" delay={0}>
            <div
              className="rounded-3xl p-8 flex flex-col justify-between min-h-[220px] hover:-translate-y-0.5 transition-all h-full"
              style={{
                background: 'rgba(82,178,116,0.06)',
                border: '1px solid rgba(82,178,116,0.18)',
              }}
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span
                    className="text-5xl font-extrabold leading-none tracking-tight"
                    style={{ color: 'rgba(82,178,116,0.18)' }}
                  >
                    01
                  </span>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(82,178,116,0.15)' }}
                  >
                    <MessageSquareQuote size={22} style={{ color: '#52b274' }} aria-hidden />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Targeted Feedback</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.52)' }}>
                  Quote specific text for precise, contextual responses that keep conversations
                  focused and productive. No more talking past each other.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: '#52b274' }} />
                <span className="text-xs font-medium" style={{ color: 'rgba(82,178,116,0.80)' }}>
                  Precision quoting on any passage
                </span>
              </div>
            </div>
            </ScrollReveal>

            {/* Feature 02 */}
            <ScrollReveal delay={100}>
            <div
              className="rounded-3xl p-8 flex flex-col justify-between min-h-[220px] hover:-translate-y-0.5 transition-all h-full"
              style={{
                background: 'rgba(39,196,225,0.05)',
                border: '1px solid rgba(39,196,225,0.18)',
              }}
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span
                    className="text-5xl font-extrabold leading-none tracking-tight"
                    style={{ color: 'rgba(39,196,225,0.18)' }}
                  >
                    02
                  </span>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(39,196,225,0.12)' }}
                  >
                    <Zap size={22} style={{ color: '#27c4e1' }} aria-hidden />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Live Chat Threads</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.52)' }}>
                  Every post spawns its own real-time discussion space for immediate, live
                  engagement.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: '#27c4e1' }} />
                <span className="text-xs font-medium" style={{ color: 'rgba(39,196,225,0.80)' }}>
                  Real-time public threads
                </span>
              </div>
            </div>
            </ScrollReveal>

            {/* Feature 03 */}
            <ScrollReveal delay={200}>
            <div
              className="rounded-3xl p-8 flex flex-col justify-between min-h-[220px] hover:-translate-y-0.5 transition-all h-full"
              style={{
                background: 'rgba(82,178,116,0.06)',
                border: '1px solid rgba(82,178,116,0.18)',
              }}
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span
                    className="text-5xl font-extrabold leading-none tracking-tight"
                    style={{ color: 'rgba(82,178,116,0.18)' }}
                  >
                    03
                  </span>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(82,178,116,0.15)' }}
                  >
                    <ThumbsUp size={22} style={{ color: '#52b274' }} aria-hidden />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Voting Mechanics</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.52)' }}>
                  Support thoughtful discourse through democratic, transparent voting on any
                  quoted passage.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: '#52b274' }} />
                <span className="text-xs font-medium" style={{ color: 'rgba(82,178,116,0.80)' }}>
                  Transparent democratic voting
                </span>
              </div>
            </div>
            </ScrollReveal>

            {/* Feature 04 — wide */}
            <ScrollReveal className="lg:col-span-2" delay={300}>
            <div
              className="rounded-3xl p-8 flex flex-col sm:flex-row items-start gap-8 hover:-translate-y-0.5 transition-all h-full"
              style={{
                background: 'rgba(245,81,69,0.05)',
                border: '1px solid rgba(245,81,69,0.16)',
              }}
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-6">
                  <span
                    className="text-5xl font-extrabold leading-none tracking-tight"
                    style={{ color: 'rgba(245,81,69,0.18)' }}
                  >
                    04
                  </span>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(245,81,69,0.12)' }}
                  >
                    <ShieldOff size={22} style={{ color: '#f55145' }} aria-hidden />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ad-Free & Algorithm-Free</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.52)' }}>
                  Pure, unmanipulated conversations — no ads, no hidden agendas, no engagement
                  traps. What you see is what the community actually cares about.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col sm:justify-end sm:self-end">
                {['No ads', 'No tracking', 'No algorithms', 'Open source'].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: 'rgba(245,81,69,0.10)',
                      color: 'rgba(245,120,113,0.90)',
                      border: '1px solid rgba(245,81,69,0.18)',
                    }}
                  >
                    <CheckCircle2 size={11} aria-hidden /> {tag}
                  </span>
                ))}
              </div>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Product Showcase — Voting UI ──────────────────────── */}
      <section
        className="py-24 sm:py-32 relative overflow-hidden"
        style={{ background: '#080f1a' }}
        aria-labelledby="showcase-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 50% at 0% 60%, rgba(82,178,116,0.07) 0%, transparent 65%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text side */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.25em] mb-5"
                style={{ color: '#52b274' }}
              >
                See it in action
              </p>
              <h2
                id="showcase-heading"
                className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6"
              >
                What people{' '}
                <span
                  style={{
                    background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  are saying
                </span>
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.52)' }}>
                For a project as small as your household, or around the world, Quote.Vote
                can host the next conversation in your life — and knock it out of the park.
              </p>
              <ul className="space-y-3">
                {[
                  'Quote any passage for targeted discussion',
                  'Vote up the ideas that matter most',
                  'Follow conversations in real time',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(82,178,116,0.15)' }}
                    >
                      <CheckCircle2 size={12} style={{ color: '#52b274' }} aria-hidden />
                    </div>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Images side */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: '1px solid rgba(82,178,116,0.20)',
                  boxShadow: '0 0 50px rgba(82,178,116,0.10), 0 20px 60px rgba(0,0,0,0.40)',
                }}
              >
                <Image
                  src="/assets/votingPopUp.svg"
                  alt="Voting popup preview showing quote selection"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
              <div
                className="rounded-2xl overflow-hidden mt-6"
                style={{
                  border: '1px solid rgba(82,178,116,0.20)',
                  boxShadow: '0 0 50px rgba(82,178,116,0.10), 0 20px 60px rgba(0,0,0,0.40)',
                }}
              >
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
        </div>
      </section>

      {/* ── Product Showcase — At Any Time ────────────────────── */}
      <section
        className="py-24 sm:py-32 relative overflow-hidden"
        style={{ background: '#0d1f10' }}
        aria-labelledby="anytime-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 55% at 100% 40%, rgba(82,178,116,0.08) 0%, transparent 65%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.25em] mb-3"
                style={{ color: '#52b274' }}
              >
                Any time, anywhere
              </p>
              <h2
                id="anytime-heading"
                className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
              >
                Put your{' '}
                <span
                  style={{
                    background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Quote
                </span>{' '}
                to Vote
              </h2>
            </div>
            <Link
              href="/auths/request-access"
              className="inline-flex items-center gap-2 text-sm font-semibold shrink-0"
              style={{ color: '#52b274' }}
              aria-label="Request an invite to join"
            >
              Start sharing <ChevronRight size={16} aria-hidden />
            </Link>
          </div>

          <div
            className="rounded-3xl overflow-hidden"
            style={{
              border: '1px solid rgba(82,178,116,0.18)',
              boxShadow: '0 0 80px rgba(82,178,116,0.12), 0 40px 80px rgba(0,0,0,0.50)',
            }}
          >
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

      {/* ── Product Showcase — Track Conversations ────────────── */}
      <section
        className="py-24 sm:py-32 relative overflow-hidden"
        style={{ background: '#080f1a' }}
        aria-labelledby="track-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 50% at 0% 80%, rgba(82,178,116,0.07) 0%, transparent 65%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image side — left */}
            <div
              className="rounded-3xl overflow-hidden order-last lg:order-first"
              style={{
                border: '1px solid rgba(82,178,116,0.18)',
                boxShadow: '0 0 80px rgba(82,178,116,0.10), 0 40px 80px rgba(0,0,0,0.50)',
              }}
            >
              <Image
                src="/assets/TrackConversation.svg"
                alt="Dashboard showing conversation tracking and engagement metrics"
                width={1200}
                height={600}
                className="w-full h-auto"
              />
            </div>

            {/* Text side — right */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.25em] mb-5"
                style={{ color: '#52b274' }}
              >
                Stay informed
              </p>
              <h2
                id="track-heading"
                className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6"
              >
                Track every{' '}
                <span
                  style={{
                    background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Conversation
                </span>
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.52)' }}>
                Never lose track of a discussion. See where conversations are heading,
                follow the threads that matter, and engage when it counts.
              </p>
              <ul className="space-y-3">
                {[
                  'See engagement and vote counts at a glance',
                  'Filter by keyword, date, or people you follow',
                  'Discover trending topics without algorithmic bias',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(82,178,116,0.15)' }}
                    >
                      <CheckCircle2 size={12} style={{ color: '#52b274' }} aria-hidden />
                    </div>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works — 3 steps ────────────────────────────── */}
      <section
        className="py-24 sm:py-32 relative overflow-hidden"
        style={{ background: '#0d1f10' }}
        aria-labelledby="how-heading"
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(82,178,116,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(82,178,116,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(13,31,16,0.60) 0%, transparent 70%)',
          }}
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p
            className="text-xs font-bold uppercase tracking-[0.25em] mb-5"
            style={{ color: '#52b274' }}
          >
            Simple by design
          </p>
          <h2
            id="how-heading"
            className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4"
          >
            How it works
          </h2>
          <p className="text-base mb-16 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Three steps to joining a community built on thoughtful discourse.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div
              className="absolute top-10 left-1/4 right-1/4 h-px hidden sm:block"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(82,178,116,0.25), transparent)' }}
              aria-hidden
            />

            {[
              {
                step: '01',
                icon: FileText,
                title: 'Post Your Idea',
                body: 'Share a thought, plan, or topic you want feedback on. Text-first, no noise.',
              },
              {
                step: '02',
                icon: MessageSquareQuote,
                title: 'Quote & Respond',
                body: 'Others quote your specific words for targeted, precise feedback.',
              },
              {
                step: '03',
                icon: ThumbsUp,
                title: 'Vote on What Matters',
                body: 'The community votes on ideas democratically, transparently, without gaming.',
              },
            ].map(({ step, icon: Icon, title, body }) => (
              <div
                key={step}
                className="flex flex-col items-center text-center px-4 py-8 rounded-3xl transition-all hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(82,178,116,0.12)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: 'rgba(82,178,116,0.10)',
                    border: '1px solid rgba(82,178,116,0.20)',
                  }}
                >
                  <Icon size={26} style={{ color: '#52b274' }} aria-hidden />
                </div>
                <span
                  className="text-xs font-bold tracking-[0.2em] uppercase mb-2"
                  style={{ color: 'rgba(82,178,116,0.55)' }}
                >
                  Step {step}
                </span>
                <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full-width CTA Banner ─────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 sm:py-28"
        style={{
          background: 'linear-gradient(135deg, #0a2e14 0%, #071a28 50%, #0a2e14 100%)',
        }}
        aria-label="Call to action"
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(82,178,116,0.15) 0%, transparent 70%)',
          }}
          aria-hidden
        />
        {/* Decorative large quote */}
        <span
          className="absolute select-none pointer-events-none font-serif"
          style={{
            fontSize: 'clamp(16rem, 35vw, 32rem)',
            right: '-4rem',
            top: '-6rem',
            color: 'rgba(82,178,116,0.04)',
            fontFamily: 'Georgia, "Times New Roman", serif',
            lineHeight: 1,
          }}
          aria-hidden
        >
          &rdquo;
        </span>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p
            className="text-xs font-bold uppercase tracking-[0.25em] mb-5"
            style={{ color: 'rgba(82,178,116,0.70)' }}
          >
            Ready to join?
          </p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6"
          >
            The future of{' '}
            <span
              style={{
                background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              thoughtful discourse
            </span>{' '}
            is here.
          </h2>
          <p
            className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.50)' }}
          >
            Join a growing community of thinkers, builders, and changemakers who believe
            great conversations can change the world.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auths/request-access"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 hover:-translate-y-0.5 w-full sm:w-auto"
              style={{
                background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
                boxShadow: '0 6px 30px rgba(82,178,116,0.40)',
              }}
              aria-label="Request an invite to join Quote.Vote"
            >
              Request Invite
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link
              href="/#about-section"
              className="inline-flex items-center gap-2 text-base font-semibold transition-all hover:opacity-80"
              style={{ color: '#8de0a8' }}
            >
              Read our mission
              <ChevronRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Discover & Share — two-column ─────────────────────── */}
      <section
        className="py-24 sm:py-32 relative overflow-hidden"
        style={{ background: '#080f1a' }}
        aria-labelledby="discover-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 50% at 100% 0%, rgba(82,178,116,0.06) 0%, transparent 65%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p
              className="text-xs font-bold uppercase tracking-[0.25em] mb-4"
              style={{ color: '#52b274' }}
            >
              For everyone
            </p>
            <h2
              id="discover-heading"
              className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
            >
              Find your place in the conversation
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Discover card */}
            <div
              className="rounded-3xl p-10"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(82,178,116,0.14)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
                style={{ background: 'rgba(82,178,116,0.10)', border: '1px solid rgba(82,178,116,0.20)' }}
              >
                <Search size={24} style={{ color: '#52b274' }} aria-hidden />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Discover{' '}
                <span
                  style={{
                    background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  without bias
                </span>
              </h3>
              <p
                className="text-base leading-relaxed mb-6"
                style={{ color: 'rgba(255,255,255,0.52)' }}
              >
                All conversations are searchable without ads, discovered through exploration,
                not algorithms. Filter by keyword, sort by interactions, or explore by date.
              </p>
              <ul className="space-y-2">
                {['No algorithmic curation', 'Historical event search', 'Follow-based filtering'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <ChevronRight size={14} style={{ color: '#52b274' }} aria-hidden />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Share card */}
            <div
              className="rounded-3xl p-10"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(82,178,116,0.14)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
                style={{ background: 'rgba(82,178,116,0.10)', border: '1px solid rgba(82,178,116,0.20)' }}
              >
                <TrendingUp size={24} style={{ color: '#52b274' }} aria-hidden />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Share{' '}
                <span
                  style={{
                    background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  your ideas
                </span>
              </h3>
              <p
                className="text-base leading-relaxed mb-6"
                style={{ color: 'rgba(255,255,255,0.52)' }}
              >
                Post to your social circle and beyond. Engage in meaningful, respectful
                discussions that solve problems, challenge perspectives, or spark new ideas.
              </p>
              <ul className="space-y-2">
                {['Public and private circles', 'Quote-based responses', 'Democratic voting on ideas'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <ChevronRight size={14} style={{ color: '#52b274' }} aria-hidden />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Donate ────────────────────────────────────────────── */}
      <section
        className="py-24 sm:py-32 relative overflow-hidden"
        style={{ background: '#0d1f10' }}
        aria-labelledby="donate-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 0% 50%, rgba(82,178,116,0.09) 0%, transparent 65%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.25em] mb-5"
                style={{ color: '#52b274' }}
              >
                Support the mission
              </p>
              <h2
                id="donate-heading"
                className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6"
              >
                Donate{' '}
                <span
                  style={{
                    background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  what you can
                </span>
              </h2>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-white">{totalRaised} raised</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    community funded
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #52b274 0%, #9de8b8 100%)',
                      boxShadow: '0 0 12px rgba(82,178,116,0.50)',
                    }}
                  />
                </div>
              </div>

              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.52)' }}>
                Join us in creating a truly open and equal community where civil conversation is
                the main objective. If you fork our project, kindly consider contributing back.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auths/request-access"
                  className="inline-flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-0.5 gap-4"
                  style={{
                    background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
                    boxShadow: '0 4px 24px rgba(82,178,116,0.30)',
                  }}
                  aria-label="Request an invite to join Quote.Vote"
                >
                  Request Invite
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <a
                  href="https://opencollective.com/quotevote/donate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-4 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'rgba(82,178,116,0.10)',
                    color: '#8de0a8',
                    border: '1.5px solid rgba(82,178,116,0.30)',
                  }}
                  aria-label="Donate to Quote.Vote today (opens in new tab)"
                >
                  Donate Today
                </a>
              </div>
            </div>

            {/* Right — impact cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Heart, value: totalRaised, label: 'Total Raised', color: '#f55145', bg: 'rgba(245,81,69,0.08)', border: 'rgba(245,81,69,0.18)' },
                { icon: Users, value: '∞', label: 'Community Members', color: '#52b274', bg: 'rgba(82,178,116,0.08)', border: 'rgba(82,178,116,0.18)' },
                { icon: Globe, value: '100%', label: 'Open Source', color: '#27c4e1', bg: 'rgba(39,196,225,0.08)', border: 'rgba(39,196,225,0.18)' },
                { icon: ShieldOff, value: '0', label: 'Ads or Trackers', color: '#52b274', bg: 'rgba(82,178,116,0.08)', border: 'rgba(82,178,116,0.18)' },
              ].map(({ icon: Icon, value, label, color, bg, border }) => (
                <div
                  key={label}
                  className="rounded-2xl p-6 flex flex-col items-center text-center"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <Icon size={22} style={{ color }} className="mb-3" aria-hidden />
                  <span className="text-3xl font-extrabold text-white leading-none mb-1">
                    {value}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Be in Touch ───────────────────────────────────────── */}
      <BeInTouchSection />


      {/* ── Footer ────────────────────────────────────────────── */}
      <footer
        role="contentinfo"
        className="text-white"
        style={{ background: '#050c14' }}
      >
        {/* Top border accent */}
        <div
          className="h-px w-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(82,178,116,0.30), transparent)',
          }}
          aria-hidden
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10">
          {/* Logo row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Quote.Vote home"
            >
              <Image
                src="/assets/QuoteVoteLogo.png"
                alt="Quote.Vote Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-extrabold text-base tracking-wide" style={{ color: '#8de0a8' }}>
                QUOTE.VOTE
              </span>
            </Link>
            <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Empowering thoughtful discourse through democratic, ad-free conversations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* About */}
            <div className="col-span-2 md:col-span-1">
              <h3
                className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
                style={{ color: 'rgba(82,178,116,0.70)' }}
              >
                Company
              </h3>
              <a
                href="mailto:admin@quote.vote"
                className="flex items-center gap-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] rounded"
                style={{ color: 'rgba(255,255,255,0.50)' }}
                aria-label="Contact us via email at admin@quote.vote"
              >
                <Mail size={14} aria-hidden />
                admin@quote.vote
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h3
                className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
                style={{ color: 'rgba(82,178,116,0.70)' }}
              >
                Quick Links
              </h3>
              <ul className="space-y-3" role="list">
                {quickLinks.map(({ href, label, external }) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm hover:translate-x-0.5 transition-all inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] rounded"
                      style={{ color: 'rgba(255,255,255,0.50)' }}
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
              <h3
                className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
                style={{ color: 'rgba(82,178,116,0.70)' }}
              >
                Resources
              </h3>
              <ul className="space-y-3" role="list">
                {resourceLinks.map(({ href, label }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm hover:translate-x-0.5 transition-all inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] rounded"
                      style={{ color: 'rgba(255,255,255,0.50)' }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3
                className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
                style={{ color: 'rgba(82,178,116,0.70)' }}
              >
                Connect
              </h3>
              <div className="flex gap-3">
                {socialLinks.map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit our ${label} (opens in new tab)`}
                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274]"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <Icon size={18} aria-hidden />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div
            className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              © {new Date().getFullYear()} Quote.Vote. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }} aria-label="Made with love on Earth">
              Made with <span role="img" aria-label="love">❤️</span> on Earth
            </p>
          </div>
        </div>
      </footer>
      </>
    </div>
  );
}

// ── Hero Search Bar ────────────────────────────────────────────────────────

interface HeroSearchProps {
  router: ReturnType<typeof useRouter>;
}

function HeroSearch({ router }: HeroSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data, loading, error } = useQuery<{ searchContent: ContentResult[]; searchCreator: CreatorResult[] }>(SEARCH, {
    variables: { text: debouncedQuery },
    skip: !debouncedQuery.trim(),
  });

  const contentResults: ContentResult[] = data?.searchContent ?? [];
  const creatorResults: CreatorResult[] = data?.searchCreator ?? [];
  const hasResults = contentResults.length > 0 || creatorResults.length > 0;
  const showDropdown = isOpen && debouncedQuery.trim().length > 0;

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
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  const handleResultClick = () => {
    setIsOpen(false);
    router.push('/auths/login');
  };

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto w-full">
      <form onSubmit={handleSubmit} role="search" aria-label="Search conversations">
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
            role="combobox"
            aria-label="Search topics, quotes, conversations"
            aria-expanded={showDropdown}
            aria-controls="hero-search-listbox"
            aria-autocomplete="list"
            autoComplete="off"
          />
          <button
            type="submit"
            className="m-2 px-3 sm:px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white flex-shrink-0 flex items-center gap-1.5"
            style={{ background: 'var(--color-primary)' }}
            aria-label="Submit search"
          >
            <Search size={16} aria-hidden />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </form>

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden z-50 text-left"
          style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)' }}
          id="hero-search-listbox"
          role="listbox"
          aria-label="Search results"
        >
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

          {error && !loading && (
            <div className="p-5 text-center" data-testid="search-error">
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                Search unavailable. Please try again.
              </p>
            </div>
          )}

          {!loading && !error && !hasResults && (
            <div className="p-6 text-center" data-testid="search-empty">
              <p className="text-sm text-gray-500">
                No results for &ldquo;<strong>{debouncedQuery}</strong>&rdquo;
              </p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

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
    <section
      className="py-24 sm:py-32 relative overflow-hidden"
      style={{ background: '#0d1f10' }}
      aria-labelledby="touch-heading"
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(82,178,116,0.10) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
        <div
          className="rounded-3xl p-10 sm:p-14 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(82,178,116,0.15)',
          }}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{
              background: 'rgba(82,178,116,0.10)',
              border: '1px solid rgba(82,178,116,0.20)',
            }}
          >
            <Mail size={26} style={{ color: '#52b274' }} aria-hidden />
          </div>

          <h2
            id="touch-heading"
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4"
          >
            Stay in the loop
          </h2>
          <p
            className="text-base leading-relaxed max-w-lg mx-auto mb-10"
            style={{ color: 'rgba(255,255,255,0.50)' }}
          >
            Our team is made up of volunteers from around the world. Sign up for our newsletter
            and we&apos;ll send updates as we make progress.{' '}
            <span className="text-white font-semibold">
              Every contribution, big or small, is appreciated.
            </span>
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="max-w-md mx-auto"
            aria-label="Stay in touch email form"
          >
            <div
              className="flex items-center rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(82,178,116,0.22)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <label htmlFor="touch-email" className="sr-only">
                Email address
              </label>
              <input
                id="touch-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={handleEmailChange}
                className="flex-1 border-none outline-none text-base px-5 py-4 bg-transparent text-white placeholder:text-white/35"
                aria-invalid={!!errorMessage}
                aria-describedby={
                  errorMessage ? 'touch-error' : successMessage ? 'touch-success' : undefined
                }
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="m-2 px-6 py-2.5 rounded-xl font-semibold text-base text-white transition-all hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] focus-visible:ring-offset-2 flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
                  boxShadow: '0 2px 12px rgba(82,178,116,0.30)',
                }}
              >
                {isSubmitting ? 'Sending…' : 'Subscribe'}
              </button>
            </div>

            {errorMessage && (
              <p
                id="touch-error"
                role="alert"
                className="mt-3 text-sm text-center"
                style={{ color: 'var(--color-danger)' }}
              >
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p
                id="touch-success"
                role="status"
                className="mt-3 text-sm text-center"
                style={{ color: 'var(--color-success)' }}
              >
                {successMessage}
              </p>
            )}
          </form>

          <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            No spam. Unsubscribe any time.
          </p>
        </div>
      </div>
    </section>
  );
}
