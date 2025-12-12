"use client";

/**
 * Login Component
 * 
 * Main login page component that wraps the LoginForm.
 * Migrated from Material UI to shadcn/ui with Tailwind CSS.
 * Features geographic location backgrounds to inspire global unity.
 */

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { LoginForm } from './LoginForm';
import type { LoginProps } from '@/types/login';
import Link from 'next/link';

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

export function Login({ onSubmit = () => { }, loading = false }: LoginProps) {
    const loginError = useAppStore((state) => state.user.loginError);
    // Use lazy initializer to select random background on first render
    const [selectedBackground] = useState<string>(() => {
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        return backgroundImages[randomIndex];
    });

    const backgroundStyle = selectedBackground
        ? { backgroundImage: `url('/assets/bg/${selectedBackground}')` }
        : { backgroundImage: `url('/assets/Mountain.png')` };

    return (
        <div
            className="min-h-screen flex items-start justify-center pt-8 px-4 bg-cover bg-center bg-no-repeat"
            style={backgroundStyle}
        >
            <div className="w-full max-w-md mx-auto">
                <Card className="p-8 shadow-lg backdrop-blur-sm bg-background/95">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
                        </div>

                        {/* Login Form */}
                        <LoginForm
                            onSubmit={onSubmit}
                            loading={loading}
                            loginError={loginError}
                        />

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link
                                href="/auth/forgot"
                                className="text-sm text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Request Access Link */}
                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">No account? </span>
                            <Link
                                href="/auth/request-access"
                                className="text-primary hover:underline"
                            >
                                Request Access
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
