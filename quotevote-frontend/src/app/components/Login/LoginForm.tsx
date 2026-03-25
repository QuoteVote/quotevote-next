'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/common/Loader';
import { cn } from '@/lib/utils';

import { loginSchema } from '@/lib/validation/loginSchema';
import type { LoginFormProps, LoginFormData } from '@/types/login';

export function LoginForm({ onSubmit, loading, loginError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    control,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      tos: false,
      coc: false,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch is safe here, compiler skips memoization
  const tosAccepted = watch('tos');
  const cocAccepted = watch('coc');

  useEffect(() => {
    if (loginError) {
      const errorMessage =
        typeof loginError === 'string'
          ? loginError
          : loginError.data?.message || 'Login failed';
      setError('password', { type: 'manual', message: errorMessage });
    }
  }, [loginError, setError]);

  const hasError = loginError || errors.username || errors.password;

  /* ── shared input class ─────────────────────────────────────── */
  const inputCls = (hasErr: boolean) =>
    cn(
      'pl-11 h-11 border text-white placeholder:text-white/30 rounded-xl',
      'focus:ring-2 focus:ring-[#52b274]/40 focus:border-[#52b274] focus:outline-none',
      'transition-all duration-200',
      hasErr
        ? 'border-red-500/60 bg-red-900/10'
        : 'border-white/10 bg-white/5 hover:bg-white/8'
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      {/* Error alert */}
      {hasError && (
        <Alert
          variant="destructive"
          className="bg-red-900/20 border-red-500/30 animate-in fade-in-0 slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-sm text-red-300">
            {loginError
              ? typeof loginError === 'string'
                ? loginError
                : loginError.data?.message || 'Login failed'
              : errors.password?.message || errors.username?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Email / Username */}
      <div className="space-y-2.5">
        <Label htmlFor="username" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
          Email or Username
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Mail
              className={cn(
                'h-4 w-4 transition-colors duration-200',
                errors.username ? 'text-red-400' : 'text-white/30 group-focus-within:text-[#52b274]'
              )}
            />
          </div>
          <Input
            id="username"
            type="text"
            placeholder="you@example.com"
            className={inputCls(!!errors.username)}
            {...register('username')}
            aria-invalid={!!errors.username}
            disabled={loading}
          />
        </div>
        {errors.username && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 animate-in fade-in-0">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
            Password
          </Label>
          <Link
            href="/auths/forgot-password"
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: '#8de0a8' }}
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Lock
              className={cn(
                'h-4 w-4 transition-colors duration-200',
                errors.password ? 'text-red-400' : 'text-white/30 group-focus-within:text-[#52b274]'
              )}
            />
          </div>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className={cn(inputCls(!!errors.password), 'pr-12')}
            {...register('password')}
            aria-invalid={!!errors.password}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.30)' }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={loading}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 animate-in fade-in-0">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="space-y-2.5 pt-1">
        {[
          {
            name: 'tos' as const,
            label: 'Terms of Service',
            href: 'https://github.com/QuoteVote/quotevote-monorepo/blob/main/quote_vote_terms_of_service.md',
          },
          {
            name: 'coc' as const,
            label: 'Code of Conduct',
            href: 'https://github.com/QuoteVote/quotevote-monorepo/blob/main/quote_vote_code_of_conduct.md',
          },
        ].map(({ name, label, href }) => (
          <div key={name} className="flex items-start gap-2.5">
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <Checkbox
                  id={name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={loading}
                  aria-invalid={!!errors[name]}
                  className="mt-0.5 border-white/20 data-[state=checked]:bg-[#52b274] data-[state=checked]:border-[#52b274]"
                />
              )}
            />
            <Label htmlFor={name} className="text-sm leading-relaxed cursor-pointer" style={{ color: 'rgba(255,255,255,0.50)' }}>
              I agree to the{' '}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline-offset-4 hover:underline"
                style={{ color: '#8de0a8' }}
              >
                {label}
              </a>
            </Label>
          </div>
        ))}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-11 text-sm font-semibold mt-2 rounded-xl border-0 text-white group transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #52b274 0%, #3a9058 100%)',
          boxShadow: '0 4px 20px rgba(82,178,116,0.30)',
        }}
        disabled={loading || !tosAccepted || !cocAccepted}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader size={18} absolutelyPositioned={false} />
            <span>Signing in…</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Sign in</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        )}
      </Button>
    </form>
  );
}
