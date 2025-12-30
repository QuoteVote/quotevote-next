"use client";

/**
 * LoginForm Component
 * 
 * Form component for user login with validation.
 * Migrated from Material UI to shadcn/ui components.
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import { loginSchema } from '@/lib/validation/loginSchema';
import type { LoginFormProps, LoginFormData } from '@/types/login';

export function LoginForm({ onSubmit, loading, loginError }: LoginFormProps) {
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

    const tosAccepted = watch('tos');
    const cocAccepted = watch('coc');

    useEffect(() => {
        if (loginError) {
            const errorMessage =
                typeof loginError === 'string'
                    ? loginError
                    : loginError.data?.message || 'Login failed';

            setError('password', {
                type: 'manual',
                message: errorMessage,
            });
        }
    }, [loginError, setError]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                    Email/Username
                </Label>
                <Input
                    id="username"
                    type="text"
                    placeholder="Email/Username"
                    {...register('username')}
                    aria-invalid={!!errors.username}
                    disabled={loading}
                />
                {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                    Password
                </Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                    disabled={loading}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            {/* Terms of Service Checkbox */}
            <div className="flex items-start space-x-2">
                <Controller
                    name="tos"
                    control={control}
                    render={({ field }) => (
                        <Checkbox
                            id="tos"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={loading}
                            aria-invalid={!!errors.tos}
                        />
                    )}
                />
                <div className="grid gap-1.5 leading-none">
                    <Label
                        htmlFor="tos"
                        className="text-sm font-normal leading-relaxed cursor-pointer"
                    >
                        I agree to the{' '}
                        <Link
                            href="https://github.com/QuoteVote/quotevote-monorepo/blob/main/quote_vote_terms_of_service.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:no-underline"
                        >
                            Terms of Service
                        </Link>
                    </Label>
                    {errors.tos && (
                        <p className="text-xs text-destructive">{errors.tos.message}</p>
                    )}
                </div>
            </div>

            {/* Code of Conduct Checkbox */}
            <div className="flex items-start space-x-2">
                <Controller
                    name="coc"
                    control={control}
                    render={({ field }) => (
                        <Checkbox
                            id="coc"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={loading}
                            aria-invalid={!!errors.coc}
                        />
                    )}
                />
                <div className="grid gap-1.5 leading-none">
                    <Label
                        htmlFor="coc"
                        className="text-sm font-normal leading-relaxed cursor-pointer"
                    >
                        I agree to the{' '}
                        <Link
                            href="https://github.com/QuoteVote/quotevote-monorepo/blob/main/quote_vote_code_of_conduct.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:no-underline"
                        >
                            Code of Conduct
                        </Link>
                    </Label>
                    {errors.coc && (
                        <p className="text-xs text-destructive">{errors.coc.message}</p>
                    )}
                </div>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !tosAccepted || !cocAccepted}
            >
                {loading ? 'Logging in...' : 'Log in'}
            </Button>
        </form>
    );
}
