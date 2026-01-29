'use client';

/**
 * Email Sent Component
 * 
 * Matches login page theme with split-screen layout and consistent styling.
 */

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function EmailSent() {
  const router = useRouter();

  const handleLogin = () => {
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

        {/* Right Side - Content */}
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
                <div className="flex justify-center mb-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border-2 border-green-200">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">
                  Email Sent
                </h1>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  We have sent you an email to reset your password.
                </p>
              </div>

              {/* Content Section */}
              <div className="px-6 py-5">
                <p className="text-sm text-[var(--color-text-secondary)] text-center leading-relaxed">
                  Please check your inbox and follow the instructions to reset your password. 
                  If you don&apos;t see the email, check your spam folder.
                </p>
              </div>

              {/* Footer Section */}
              <div className="px-6 pb-6 space-y-3 border-t border-[var(--color-gray-light)] pt-4">
                <Button
                  onClick={handleLogin}
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

                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--color-gray-light)]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[var(--color-white)] px-4 py-1 text-[var(--color-text-muted)]">
                      Didn&apos;t receive it?
                    </span>
                  </div>
                </div>

                <Link
                  href="/forgot-password"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-[var(--color-gray-light)] bg-[var(--color-background-off-white)] hover:bg-[var(--color-background)] text-[var(--color-text-primary)] font-medium transition-colors group"
                >
                  <span>Resend Email</span>
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
