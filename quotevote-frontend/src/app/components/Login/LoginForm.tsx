"use client";

/**
 * LoginForm Component
 * 
 * Sharp, clean form component with white theme.
 * Features clean inputs and sharp edges.
 */

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

    const hasError = loginError || errors.username || errors.password;

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
                        {loginError
                            ? (typeof loginError === 'string'
                                ? loginError
                                : loginError.data?.message || 'Login failed')
                            : errors.password?.message || errors.username?.message}
                    </AlertDescription>
                </Alert>
            )}

            {/* Email/Username Field */}
            <div className="space-y-1.5">
                <Label 
                    htmlFor="username" 
                    className="text-sm font-semibold text-[var(--color-text-primary)]"
                >
                    Email or Username
                </Label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Mail className={cn(
                            "h-4 w-4 transition-colors duration-200",
                            errors.username 
                                ? "text-red-500" 
                                : "text-[var(--color-text-light)] group-focus-within:text-[var(--color-primary)]"
                        )} />
                    </div>
                    <Input
                        id="username"
                        type="text"
                        placeholder="you@example.com"
                        className={cn(
                            'pl-11 h-10 bg-[var(--color-white)] border-[var(--color-gray-light)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-light)]',
                            'focus:bg-[var(--color-white)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
                            'transition-all duration-200',
                            errors.username && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        )}
                        {...register('username')}
                        aria-invalid={!!errors.username}
                        disabled={loading}
                    />
                </div>
                {errors.username && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in-0">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{errors.username.message}</span>
                    </p>
                )}
            </div>

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
                        placeholder="Enter your password"
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

            {/* Terms and Conditions */}
            <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2.5">
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
                                className="mt-0.5 border-[var(--color-gray-light)] data-[state=checked]:bg-[var(--color-primary)] data-[state=checked]:border-[var(--color-primary)]"
                            />
                        )}
                    />
                    <div className="flex-1 space-y-0.5">
                        <Label
                            htmlFor="tos"
                            className="text-sm leading-relaxed cursor-pointer text-[var(--color-text-secondary)]"
                        >
                            I agree to the{' '}
                            <Link
                                href="https://github.com/QuoteVote/quotevote-monorepo/blob/main/quote_vote_terms_of_service.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-primary)] hover:opacity-80 font-medium underline-offset-4 hover:underline transition-colors"
                            >
                                Terms of Service
                            </Link>
                        </Label>
                        {errors.tos && (
                            <p className="text-xs text-red-600 flex items-center gap-1.5">
                                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                {errors.tos.message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-2.5">
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
                                className="mt-0.5 border-[var(--color-gray-light)] data-[state=checked]:bg-[var(--color-primary)] data-[state=checked]:border-[var(--color-primary)]"
                            />
                        )}
                    />
                    <div className="flex-1 space-y-0.5">
                        <Label
                            htmlFor="coc"
                            className="text-sm leading-relaxed cursor-pointer text-[var(--color-text-secondary)]"
                        >
                            I agree to the{' '}
                            <Link
                                href="https://github.com/QuoteVote/quotevote-monorepo/blob/main/quote_vote_code_of_conduct.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-primary)] hover:opacity-80 font-medium underline-offset-4 hover:underline transition-colors"
                            >
                                Code of Conduct
                            </Link>
                        </Label>
                        {errors.coc && (
                            <p className="text-xs text-red-600 flex items-center gap-1.5">
                                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                {errors.coc.message}
                            </p>
                        )}
                    </div>
                </div>
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
                disabled={loading || !tosAccepted || !cocAccepted}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader size={20} absolutelyPositioned={false} />
                        <span>Signing in...</span>
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
