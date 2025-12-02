'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Frown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
  const [showPassword, setShowPassword] = useState(false);

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

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#495057]" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className={cn(
              'pl-10 pr-10',
              errors.password && 'border-destructive focus-visible:ring-destructive/20'
            )}
            {...register('password')}
            aria-invalid={errors.password ? 'true' : 'false'}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={handleClickShowPassword}
            aria-label="toggle password visibility"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#495057]" />
            <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            className={cn(
              'pl-10',
              errors.confirmPassword && 'border-destructive focus-visible:ring-destructive/20'
            )}
            {...register('confirmPassword')}
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={loading}
        size="lg"
      >
        {loading ? (
          <>
            <Loader size={20} absolutelyPositioned={false} />
            <span className="ml-2">Updating...</span>
          </>
        ) : (
          'Confirm Password'
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
      <Card className="w-full max-w-[500px] sm:max-w-[300px]">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center">
            <Loader />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[500px] sm:max-w-[300px]">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          {passwordUpdated ? (
            <>
              <p className="font-roboto text-center text-base font-normal leading-[19px] text-muted-foreground">
                Your password has been changed successfully!
              </p>
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
                size="lg"
              >
                Login
              </Button>
            </>
          ) : (
            <>
              {isValidToken && (
                <>
                  <h2 className="font-montserrat text-xl font-semibold leading-6">
                    Choose New Password
                  </h2>
                  <div className="w-full">
                    <PasswordResetForm
                      onSubmit={onSubmit}
                      loading={loading}
                      error={error}
                    />
                  </div>
                </>
              )}
              {!isValidToken && (
                <>
                  <Frown className="h-12 w-12 text-muted-foreground" />
                  <h2 className="font-montserrat text-xl font-semibold leading-6">
                    Password Reset
                  </h2>
                  <div className="flex items-center gap-2 text-base leading-[19px] text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-roboto">
                      Sorry, your password reset link is invalid or expired.
                    </p>
                  </div>
                  <Link
                    href="/auth/forgot"
                    className="text-sm text-[#00bcd4] hover:underline"
                  >
                    Request reset password.
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

