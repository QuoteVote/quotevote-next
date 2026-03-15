'use client';

import { AuthPageShell } from '@/components/AuthPageShell/AuthPageShell';
import { RequestAccessForm } from '@/components/RequestAccess/RequestAccessForm';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquareQuote,
  ThumbsUp,
  ShieldOff,
  CheckCircle2,
} from 'lucide-react';

const steps = [
  { n: '01', title: 'Submit your email', desc: 'No password needed yet — just your email address.' },
  { n: '02', title: 'Get approved', desc: 'Our team reviews requests and sends invite links.' },
  { n: '03', title: 'Start the conversation', desc: 'Quote, vote, and engage on any topic you care about.' },
];

const pillars = [
  { icon: MessageSquareQuote, title: 'Quote & Respond', desc: 'Target specific text for precise replies.', color: '#52b274' },
  { icon: ThumbsUp, title: 'Democratic Voting', desc: 'Let the community decide what matters.', color: '#27c4e1' },
  { icon: ShieldOff, title: 'Zero Ads', desc: 'Open source and donation-supported forever.', color: '#8de0a8' },
];

export function RequestAccessPageContent() {
  return (
    <AuthPageShell showLogin={true}>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 lg:py-16">
        <div className="w-full max-w-lg mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <Badge
              className="mb-4 px-3 py-1 text-xs font-semibold rounded-full"
              style={{
                background: 'rgba(82,178,116,0.10)',
                border: '1px solid rgba(82,178,116,0.25)',
                color: '#8de0a8',
              }}
            >
              Invite-only access
            </Badge>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: '#fff' }}
            >
              Join the{' '}
              <span
                style={{
                  background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                conversation
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Quote.Vote is community-driven and invite-only. Drop your email and
              we&apos;ll notify you when a spot opens.
            </p>
          </div>

          {/* Form card */}
          <div
            className="mb-8 p-7"
            style={{
              background: 'rgba(13,31,16,0.96)',
              border: '1px solid rgba(82,178,116,0.18)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.50), 0 0 0 1px rgba(82,178,116,0.06)',
              borderRadius: '1.25rem',
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle2 size={18} style={{ color: '#52b274' }} aria-hidden />
              <h2 className="text-lg font-bold text-white">Request your invite</h2>
            </div>
            <RequestAccessForm />
          </div>

          {/* How it works */}
          <div className="mb-8">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4 text-center"
              style={{ color: 'rgba(82,178,116,0.60)' }}
            >
              How it works
            </p>
            <div className="flex flex-col gap-3">
              {steps.map(({ n, title, desc }) => (
                <div key={n} className="flex items-start gap-4">
                  <span
                    className="text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(82,178,116,0.10)',
                      border: '1px solid rgba(82,178,116,0.20)',
                      color: '#52b274',
                    }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator style={{ background: 'rgba(82,178,116,0.10)' }} className="mb-8" />

          {/* Pillars */}
          <div className="grid grid-cols-3 gap-3">
            {pillars.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="rounded-xl p-4 flex flex-col gap-2 text-center"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Icon size={16} style={{ color }} className="mx-auto" aria-hidden />
                <p className="text-xs font-semibold text-white">{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </AuthPageShell>
  );
}
