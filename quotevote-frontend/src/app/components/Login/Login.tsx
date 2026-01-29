"use client";

/**
 * Login Component
 * 
 * Sharp, clean login page component with white theme.
 * Features minimalist design with solid colors and sharp edges.
 * Includes a split-screen layout with image on the left.
 */

import Image from 'next/image';
import { useAppStore } from '@/store/useAppStore';
import { LoginForm } from './LoginForm';
import type { LoginProps } from '@/types/login';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Login({ onSubmit = () => { }, loading = false }: LoginProps) {
    const loginError = useAppStore((state) => state.user.loginError);

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
                    {/* Optional overlay for better text readability if needed */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                </div>

                {/* Right Side - Login Form */}
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
                                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">
                                    Welcome back
                                </h1>
                                <p className="text-[var(--color-text-secondary)] text-sm">
                                    Sign in to your account
                                </p>
                            </div>

                            {/* Form Section */}
                            <div className="px-6 py-5">
                                <LoginForm
                                    onSubmit={onSubmit}
                                    loading={loading}
                                    loginError={loginError}
                                />
                            </div>

                            {/* Footer Section */}
                            <div className="px-6 pb-6 space-y-3 border-t border-[var(--color-gray-light)] pt-4">
                                <div className="flex items-center justify-end text-sm">
                                    <Link
                                        href="/forgot-password"
                                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors font-medium"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <div className="relative py-3">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[var(--color-gray-light)]" />
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="bg-[var(--color-white)] px-4 py-1 text-[var(--color-text-muted)]">
                                            New here?
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
