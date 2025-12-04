'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#495057]" />
          <Input
            id="email"
            type="email"
            placeholder="Email"
            className={cn(
              'pl-10',
              errors.email && 'border-destructive focus-visible:ring-destructive/20'
            )}
            {...register('email')}
            aria-invalid={errors.email ? 'true' : 'false'}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
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
            <span className="ml-2">Sending...</span>
          </>
        ) : (
          'Send'
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
    router.push('/auth/login');
  };

  return (
    <Card className="w-full max-w-[350px]">
      <CardContent className="pt-6">
        <div className="mb-5">
          <div className="mb-2.5 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              aria-label="Go Back"
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-montserrat text-xl font-semibold leading-6">
              Forgot password?
            </h2>
          </div>
          <p className="font-roboto text-base font-normal leading-[19px] text-muted-foreground">
            We will send you a link to reset your password.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="w-full">
            <ForgotPasswordForm
              onSubmit={onSubmit}
              loading={loading}
              error={error}
            />
          </div>
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-[#00bcd4] hover:underline"
            >
              Login
            </Link>
          </div>
          <div className="text-center text-sm">
            <span>No account? </span>
            <Link
              href="/auth/request-access"
              className="text-[#00bcd4] hover:underline"
            >
              Request Access
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

