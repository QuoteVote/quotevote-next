'use client';

/**
 * Forgot Password Component
 * 
 * Matches login page theme with split-screen layout and consistent styling.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/common/Loader';
import type { ForgotPasswordFormProps, ForgotPasswordProps } from '@/types/components';
import { cn } from '@/lib/utils';

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

function ForgotPasswordForm({ onSubmit, loading, error }: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  useEffect(() => {
    if (error) {
      setError('email', {
        type: 'manual',
        message: error,
      });
    }
  }, [error, setError]);

  const hasError = error || errors.email;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      {/* Error Alert */}
      {hasError && (
        <Alert 
          variant="destructive" 
          className="bg-red-50 border-red-200 animate-in fade-in-0 slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-sm text-red-700">
            {error || errors.email?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <Label 
          htmlFor="email" 
          className="text-sm font-semibold text-[var(--color-text-primary)]"
        >
          Email
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Mail className={cn(
              "h-4 w-4 transition-colors duration-200",
              errors.email 
                ? "text-red-500" 
                : "text-[var(--color-text-light)] group-focus-within:text-[var(--color-primary)]"
            )} />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className={cn(
              'pl-11 h-10 bg-[var(--color-white)] border-[var(--color-gray-light)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-light)]',
              'focus:bg-[var(--color-white)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
              'transition-all duration-200',
              errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            )}
            {...register('email')}
            aria-invalid={!!errors.email}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in-0">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{errors.email.message}</span>
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className={cn(
          "w-full h-10 text-base font-semibold mt-4",
          "bg-[var(--color-primary)] hover:opacity-90",
          "text-[var(--color-primary-contrast)] border-0 shadow-md",
          "hover:shadow-lg",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "rounded-lg group"
        )}
        size="lg"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader size={20} absolutelyPositioned={false} />
            <span>Sending...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Send Reset Link</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        )}
      </Button>
    </form>
  );
}

export function ForgotPassword({
  onSubmit,
  loading = false,
  error,
}: ForgotPasswordProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/login');
  };

  return (
    <div className="h-[calc(100vh-80px)] w-full">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/assets/bg/viviana-rishe-UC8fvOyG5pU-unsplash.jpg"
              alt="Quote.Vote"
              fill
              className="object-cover"
              priority
              quality={90}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6 relative">
          <div className="w-full max-w-md mx-auto relative z-10">
            <div className="bg-[var(--color-white)] rounded-xl shadow-md border border-[var(--color-gray-light)]">
              {/* Header Section */}
              <div className="px-6 pt-6 pb-4 text-center border-b border-[var(--color-gray-light)]">
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[var(--color-primary)] p-1 shadow-md">
                    <div className="w-full h-full rounded-md bg-[var(--color-white)] flex items-center justify-center">
                      <Image
                        src="/icons/android-chrome-192x192.png"
                        alt="Quote.Vote"
                        width={40}
                        height={40}
                        className="rounded"
                        priority
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGoBack}
                    aria-label="Go Back"
                    className="h-8 w-8 -ml-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                    Forgot password?
                  </h1>
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  We will send you a link to reset your password.
                </p>
              </div>

              {/* Form Section */}
              <div className="px-6 py-5">
                <ForgotPasswordForm
                  onSubmit={onSubmit ? (data) => onSubmit(data) : () => {}}
                  loading={loading}
                  error={error}
                />
              </div>

              {/* Footer Section */}
              <div className="px-6 pb-6 space-y-3 border-t border-[var(--color-gray-light)] pt-4">
                <div className="flex items-center justify-center text-sm">
                  <Link
                    href="/login"
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors font-medium"
                  >
                    Back to Login
                  </Link>
                </div>

                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--color-gray-light)]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[var(--color-white)] px-4 py-1 text-[var(--color-text-muted)]">
                      No account?
                    </span>
                  </div>
                </div>

                <Link
                  href="/request-access"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-[var(--color-gray-light)] bg-[var(--color-background-off-white)] hover:bg-[var(--color-background)] text-[var(--color-text-primary)] font-medium transition-colors group"
                >
                  <span>Request Access</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
