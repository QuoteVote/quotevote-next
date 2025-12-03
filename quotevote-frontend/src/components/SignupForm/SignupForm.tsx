"use client";

/**
 * SignupForm Component
 * 
 * Form component for user registration/signup with validation.
 * Migrated from Material UI to shadcn/ui components.
 * Features geographic location backgrounds to inspire global unity.
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

import { signupSchema } from '@/lib/validation/signupSchema';
import type { SignupFormProps, SignupFormData } from '@/types/signup';

// Geographic location background images to inspire global unity
const backgroundImages = [
    'viviana-rishe-UC8fvOyG5pU-unsplash.jpg',
    'steph-smith-3jYcQf9oiJ8-unsplash.jpg',
    'sergio-rodriguez-rrlEOXRmMAA-unsplash.jpg',
    'sergio-otoya-gCNh426vB30-unsplash.jpg',
    'rondell-chaz-mabunga-EHLKkMDxe3M-unsplash.jpg',
    'rommel-paras-wrHnE3kMplg-unsplash.jpg',
    'peter-thomas-efLcMHXtrg0-unsplash.jpg',
    'julia-caesar-jeXkw2HR1SU-unsplash.jpg',
    'ehmir-bautista-JjDqyWuWZyU-unsplash.jpg',
    'adam-navarro-qXcl3z7_AOc-unsplash.jpg',
    'actionvance-guy5aS3GvgA-unsplash.jpg',
];

export function SignupForm({ user, token: _token, onSubmit, loading, signupError }: SignupFormProps) {
    const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        setError,
        watch,
        control,
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            email: user.email || '',
            username: '',
            password: '',
            tos: false,
            coc: false,
        },
    });

    const tosAccepted = watch('tos');
    const cocAccepted = watch('coc');

    useEffect(() => {
        // Select a random background image on first load
        if (!selectedBackground) {
            const randomIndex = Math.floor(Math.random() * backgroundImages.length);
            setSelectedBackground(backgroundImages[randomIndex]);
        }
    }, [selectedBackground]);

    useEffect(() => {
        if (signupError) {
            const errorMessage =
                typeof signupError === 'string'
                    ? signupError
                    : signupError.data?.message || signupError.message || 'Signup failed';

            setError('password', {
                type: 'manual',
                message: errorMessage,
            });
        }
    }, [signupError, setError]);

    const backgroundStyle = selectedBackground
        ? { backgroundImage: `url('/assets/bg/${selectedBackground}')` }
        : { backgroundImage: `url('/assets/Mountain.png')` };

    return (
        <div
            className="min-h-screen flex items-start justify-center pt-8 px-4 bg-cover bg-center bg-no-repeat"
            style={backgroundStyle}
        >
            <div className="w-full max-w-md mx-auto">
                <Card className="shadow-lg backdrop-blur-sm bg-background/95">
                    <CardHeader>
                        <h1 className="text-2xl font-semibold tracking-tight text-center">
                            Complete Your Registration
                        </h1>
                    </CardHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            {/* Email Field (Disabled) */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email"
                                    {...register('email')}
                                    disabled
                                    aria-invalid={!!errors.email}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Username Field */}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Username"
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
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={loading || !isValid || !tosAccepted || !cocAccepted}
                            >
                                {loading ? 'Submitting...' : 'Submit'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
