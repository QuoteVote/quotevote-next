'use client';

/**
 * Password Reset Component
 * 
 * Matches login page theme with split-screen layout and consistent styling.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, Frown, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/common/Loader';
import type { PasswordResetFormProps, PasswordResetProps } from '@/types/components';
import { cn } from '@/lib/utils';

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password should be more than six characters')
      .max(20, 'Password should be less than twenty characters')
      .regex(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
        'Password should contain a number, an uppercase, and lowercase letter'
      ),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

function PasswordResetForm({
  onSubmit,
  loading,
  error,
}: PasswordResetFormProps) {
  const handleFormSubmit = (data: PasswordFormData) => {
    onSubmit(data);
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (error) {
      setError('password', {
        type: 'manual',
        message: error,
      });
    }
  }, [error, setError]);

  const hasError = error || errors.password || errors.confirmPassword;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full space-y-4">
      {/* Error Alert */}
      {hasError && (
        <Alert 
          variant="destructive" 
          className="bg-red-50 border-red-200 animate-in fade-in-0 slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-sm text-red-700">
            {error || errors.password?.message || errors.confirmPassword?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Password Field */}
      <div className="space-y-1.5">
        <Label 
          htmlFor="password" 
          className="text-sm font-semibold text-[var(--color-text-primary)]"
        >
          Password
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Lock className={cn(
              "h-4 w-4 transition-colors duration-200",
              errors.password 
                ? "text-red-500" 
                : "text-[var(--color-text-light)] group-focus-within:text-[var(--color-primary)]"
            )} />
          </div>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your new password"
            className={cn(
              'pl-11 pr-12 h-10 bg-[var(--color-white)] border-[var(--color-gray-light)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-light)]',
              'focus:bg-[var(--color-white)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
              'transition-all duration-200',
              errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            )}
            {...register('password')}
            aria-invalid={!!errors.password}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--color-text-light)] hover:text-[var(--color-text-secondary)] transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in-0">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{errors.password.message}</span>
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <Label 
          htmlFor="confirmPassword" 
          className="text-sm font-semibold text-[var(--color-text-primary)]"
        >
          Confirm Password
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Lock className={cn(
              "h-4 w-4 transition-colors duration-200",
              errors.confirmPassword 
                ? "text-red-500" 
                : "text-[var(--color-text-light)] group-focus-within:text-[var(--color-primary)]"
            )} />
          </div>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your new password"
            className={cn(
              'pl-11 pr-12 h-10 bg-[var(--color-white)] border-[var(--color-gray-light)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-light)]',
              'focus:bg-[var(--color-white)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
              'transition-all duration-200',
              errors.confirmPassword && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            )}
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--color-text-light)] hover:text-[var(--color-text-secondary)] transition-colors"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            disabled={loading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in-0">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{errors.confirmPassword.message}</span>
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
            <span>Updating...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Reset Password</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        )}
      </Button>
    </form>
  );
}

export function PasswordReset({
  onSubmit,
  loading = false,
  error,
  passwordUpdated = false,
  isValidToken,
  loadingData = false,
}: PasswordResetProps) {
  const router = useRouter();

  if (loadingData) {
    return (
      <div className="h-[calc(100vh-80px)] w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

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
              {passwordUpdated ? (
                <>
                  {/* Success State */}
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
                    <div className="flex justify-center mb-3">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border-2 border-green-200">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">
                      Password Updated
                    </h1>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Your password has been changed successfully!
                    </p>
                  </div>

                  <div className="px-6 py-5">
                    <p className="text-sm text-[var(--color-text-secondary)] text-center leading-relaxed mb-4">
                      You can now log in with your new password.
                    </p>
                    <Button
                      onClick={() => router.push('/login')}
                      className={cn(
                        "w-full h-10 text-base font-semibold",
                        "bg-[var(--color-primary)] hover:opacity-90",
                        "text-[var(--color-primary-contrast)] border-0 shadow-md",
                        "hover:shadow-lg",
                        "transition-all duration-200",
                        "rounded-lg group"
                      )}
                      size="lg"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>Go to Login</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Button>
                  </div>
                </>
              ) : isValidToken ? (
                <>
                  {/* Form State */}
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
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">
                      Choose New Password
                    </h1>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Enter your new password below.
                    </p>
                  </div>

                  <div className="px-6 py-5">
                    <PasswordResetForm
                      onSubmit={onSubmit ? (data) => onSubmit(data) : () => {}}
                      loading={loading}
                      error={error}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Invalid Token State */}
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
                    <div className="flex justify-center mb-3">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border-2 border-red-200">
                        <Frown className="h-8 w-8 text-red-600" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">
                      Invalid Link
                    </h1>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      Your password reset link is invalid or expired.
                    </p>
                  </div>

                  <div className="px-6 py-5">
                    <Alert variant="destructive" className="bg-red-50 border-red-200 mb-4">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-sm text-red-700">
                        Sorry, your password reset link is invalid or expired.
                      </AlertDescription>
                    </Alert>
                    <Link
                      href="/forgot-password"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-[var(--color-gray-light)] bg-[var(--color-background-off-white)] hover:bg-[var(--color-background)] text-[var(--color-text-primary)] font-medium transition-colors group"
                    >
                      <span>Request New Reset Link</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
