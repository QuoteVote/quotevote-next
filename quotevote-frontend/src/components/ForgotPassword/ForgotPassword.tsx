'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail, ArrowRight, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

import { AuthPageShell } from '@/components/AuthPageShell/AuthPageShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/common/Loader';
import { cn } from '@/lib/utils';

import type { ForgotPasswordFormProps, ForgotPasswordProps } from '@/types/components';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});
type EmailFormData = z.infer<typeof emailSchema>;

function ForgotPasswordForm({ onSubmit, loading, error }: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });

  useEffect(() => {
    if (error) setError('email', { type: 'manual', message: error });
  }, [error, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      {(error || errors.email) && (
        <Alert className="bg-red-900/20 border-red-500/30 animate-in fade-in-0 slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-sm text-red-300">
            {error || errors.email?.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2.5">
        <Label
          htmlFor="forgot-email"
          className="text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.70)' }}
        >
          Email address
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Mail
              className={cn(
                'h-4 w-4 transition-colors duration-200',
                errors.email
                  ? 'text-red-400'
                  : 'text-white/30 group-focus-within:text-[#52b274]'
              )}
              aria-hidden
            />
          </div>
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            className={cn(
              'pl-11 h-11 border text-white placeholder:text-white/30 rounded-xl',
              'focus:ring-2 focus:ring-[#52b274]/40 focus:border-[#52b274] focus:outline-none',
              'transition-all duration-200',
              errors.email
                ? 'border-red-500/60 bg-red-900/10'
                : 'border-white/10 bg-white/5 hover:bg-white/8'
            )}
            {...register('email')}
            aria-invalid={!!errors.email}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 animate-in fade-in-0">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-sm font-semibold rounded-xl border-0 text-white group transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        style={{
          background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
          boxShadow: '0 4px 20px rgba(82,178,116,0.30)',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader size={18} absolutelyPositioned={false} />
            <span>Sending…</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Send Reset Link</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        )}
      </Button>

      <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
        Remembered it?{' '}
        <Link
          href="/auths/login"
          className="font-medium hover:opacity-80 transition-opacity"
          style={{ color: '#8de0a8' }}
        >
          Back to Login
        </Link>
      </p>
    </form>
  );
}

export function ForgotPassword({ onSubmit, loading = false, error }: ForgotPasswordProps) {
  return (
    <AuthPageShell showLogin={true}>
      <div className="flex-1 flex items-center justify-center px-4 py-12 lg:py-16">
        <div className="w-full max-w-md mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(82,178,116,0.10)',
                  border: '1px solid rgba(82,178,116,0.25)',
                  boxShadow: '0 0 32px rgba(82,178,116,0.18)',
                }}
              >
                <KeyRound size={28} style={{ color: '#52b274' }} aria-hidden />
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
              Password recovery
            </Badge>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: '#fff' }}
            >
              Forgot your{' '}
              <span
                style={{
                  background: 'linear-gradient(100deg, #52b274 0%, #9de8b8 60%, #52b274 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                password?
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
              No worries — enter your email and we&apos;ll send a reset link straight to your inbox.
            </p>
          </div>

          {/* Card */}
          <div
            className="p-8"
            style={{
              background: 'rgba(13,31,16,0.96)',
              border: '1px solid rgba(82,178,116,0.18)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.50), 0 0 0 1px rgba(82,178,116,0.06)',
              borderRadius: '1.25rem',
            }}
          >
            {/* Card header */}
            <div className="mb-6">
              <Link
                href="/auths/login"
                className="flex items-center gap-1 text-xs font-medium mb-3 w-fit transition-opacity hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                aria-label="Back to login"
              >
                <ArrowLeft size={13} aria-hidden />
                Back to Login
              </Link>
              <h2 className="text-lg font-bold text-white mb-1">Reset password</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
                We&apos;ll email you a secure one-time link.
              </p>
            </div>

            {/* Form */}
            <ForgotPasswordForm
              onSubmit={onSubmit ?? (() => {})}
              loading={loading}
              error={error}
            />
          </div>

        </div>
      </div>
    </AuthPageShell>
  );
}
