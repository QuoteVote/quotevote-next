'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { AuthPageShell } from '@/components/AuthPageShell/AuthPageShell';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShieldOff, Globe, Users, Quote } from 'lucide-react';
import { LoginForm } from './LoginForm';
import type { LoginProps } from '@/types/login';

const trustPoints = [
  { icon: Globe,    label: 'Open source & non-profit' },
  { icon: ShieldOff, label: 'No ads, no algorithms, no tracking' },
  { icon: Users,    label: 'Community-driven discourse' },
];

const cardStyle: React.CSSProperties = {
  background: 'rgba(13,31,16,0.96)',
  border: '1px solid rgba(82,178,116,0.18)',
  boxShadow: '0 8px 48px rgba(0,0,0,0.50), 0 0 0 1px rgba(82,178,116,0.06)',
  borderRadius: '1.25rem',
};

export function Login({ onSubmit = () => {}, loading = false }: LoginProps) {
  const loginError = useAppStore((state) => state.user.loginError);

  return (
    <AuthPageShell showLogin={false}>
      <div className="flex-1 flex items-center justify-center px-4 py-12 lg:py-16">
        <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left — Brand panel ─────────────────────────── */}
          <div className="hidden lg:flex flex-col gap-8">
            <Link href="/" className="flex items-center gap-3 w-fit group">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{
                  background: 'rgba(82,178,116,0.12)',
                  border: '1px solid rgba(82,178,116,0.30)',
                  boxShadow: '0 0 20px rgba(82,178,116,0.20)',
                }}
              >
                <Image src="/assets/QuoteVoteLogo.png" alt="Quote.Vote Logo" width={28} height={28} className="object-contain" priority />
              </div>
              <span className="font-extrabold text-xl tracking-wide" style={{ color: '#8de0a8' }}>
                QUOTE.VOTE
              </span>
            </Link>

            <div>
              <Badge
                className="mb-4 px-3 py-1 text-xs font-semibold rounded-full"
                style={{ background: 'rgba(82,178,116,0.10)', border: '1px solid rgba(82,178,116,0.25)', color: '#8de0a8' }}
              >
                Text-first platform
              </Badge>
              <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight mb-3" style={{ color: '#fff' }}>
                Welcome{' '}
                <span style={{ background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  back
                </span>
              </h1>
              <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Sign in to continue thoughtful conversations, vote on what matters, and engage with your community.
              </p>
            </div>

            <Separator style={{ background: 'rgba(82,178,116,0.12)' }} />

            <ul className="flex flex-col gap-4">
              {trustPoints.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(82,178,116,0.10)' }}>
                    <Icon size={14} style={{ color: '#52b274' }} aria-hidden />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>{label}</span>
                </li>
              ))}
            </ul>

            <blockquote className="rounded-2xl p-5" style={{ background: 'rgba(82,178,116,0.05)', border: '1px solid rgba(82,178,116,0.12)' }}>
              <Quote size={16} style={{ color: 'rgba(82,178,116,0.50)' }} className="mb-2" aria-hidden />
              <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                The future of thoughtful discourse is here — open, honest, and free from manipulation.
              </p>
            </blockquote>
          </div>

          {/* ── Right — Form card ──────────────────────────── */}
          <div className="w-full">
            {/* Mobile-only logo */}
            <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 w-fit">
              <Image src="/assets/QuoteVoteLogo.png" alt="Quote.Vote Logo" width={28} height={28} className="object-contain" priority />
              <span className="font-extrabold text-base tracking-wide" style={{ color: '#8de0a8' }}>QUOTE.VOTE</span>
            </Link>

            {/* Card — plain div, no shadcn sub-component padding conflicts */}
            <div style={cardStyle} className="p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              {/* Card header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 size={18} style={{ color: '#52b274' }} aria-hidden />
                  <h2 className="text-xl font-bold text-white">Sign in</h2>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Form */}
              <LoginForm onSubmit={onSubmit} loading={loading} loginError={loginError} />

              {/* Footer */}
              <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Don&apos;t have an account?{' '}
                <Link href="/auths/request-access" className="font-medium hover:opacity-80 transition-opacity" style={{ color: '#8de0a8' }}>
                  Request an invite
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </AuthPageShell>
  );
}
