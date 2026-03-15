'use client';

import Link from 'next/link';
import { ArrowRight, MailCheck, RefreshCw } from 'lucide-react';

import { AuthPageShell } from '@/components/AuthPageShell/AuthPageShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function EmailSent() {
  return (
    <AuthPageShell showLogin={false}>
      <div className="flex-1 flex items-center justify-center px-4 py-12 lg:py-16">
        <div className="w-full max-w-md mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            {/* Animated check icon */}
            <div className="flex justify-center mb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(82,178,116,0.12)',
                  border: '1px solid rgba(82,178,116,0.30)',
                  boxShadow: '0 0 40px rgba(82,178,116,0.25)',
                }}
              >
                <MailCheck size={28} style={{ color: '#52b274' }} aria-hidden />
              </div>
            </div>
            <Badge
              className="mb-4 px-3 py-1 text-xs font-semibold rounded-full"
              style={{
                background: 'rgba(82,178,116,0.10)',
                border: '1px solid rgba(82,178,116,0.25)',
                color: '#8de0a8',
              }}
            >
              Email sent
            </Badge>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: '#fff' }}
            >
              Check your{' '}
              <span
                style={{
                  background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                inbox
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
              We&apos;ve sent a password reset link to your email address.
            </p>
          </div>

          {/* Card */}
          <div
            className="p-8 space-y-6"
            style={{
              background: 'rgba(13,31,16,0.96)',
              border: '1px solid rgba(82,178,116,0.18)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.50), 0 0 0 1px rgba(82,178,116,0.06)',
              borderRadius: '1.25rem',
            }}
          >
            <h2 className="text-lg font-bold text-white">What to do next</h2>
              {/* Steps */}
              <ol className="space-y-3">
                {[
                  'Open the email we sent you',
                  'Click the reset link (valid for 1 hour)',
                  'Choose a new password and sign in',
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span
                      className="text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: 'rgba(82,178,116,0.10)',
                        border: '1px solid rgba(82,178,116,0.20)',
                        color: '#52b274',
                      }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>

              {/* Spam notice */}
              <div
                className="rounded-xl px-4 py-3 text-xs leading-relaxed"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                Can&apos;t find it? Check your spam or junk folder, or make sure the email address
                you entered is correct.
              </div>

              <Separator style={{ background: 'rgba(82,178,116,0.10)' }} />

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full h-11 text-sm font-semibold rounded-xl border-0 text-white group transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
                    boxShadow: '0 4px 20px rgba(82,178,116,0.30)',
                  }}
                >
                  <Link href="/auths/login">
                    <span className="flex items-center justify-center gap-2">
                      Go to Login
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full h-11 text-sm font-medium rounded-xl border transition-all"
                  style={{
                    color: 'rgba(255,255,255,0.50)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: 'transparent',
                  }}
                >
                  <Link href="/auths/forgot-password">
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Resend email
                    </span>
                  </Link>
                </Button>
              </div>
          </div>

        </div>
      </div>
    </AuthPageShell>
  );
}
