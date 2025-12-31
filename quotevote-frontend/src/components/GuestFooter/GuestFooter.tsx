'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import type { GuestFooterProps } from '@/types/components';

// Brand colors from logo
const BRAND_COLORS = {
  teal: '#2AE6B2',
  aqua: '#27C4E1',
  cyan: '#178BE1',
  navy: '#0A2342',
  overlay: 'rgba(14, 17, 22, 0.06)',
} as const;

/**
 * GuestFooter Component
 *
 * Footer component for guest/public pages.
 * Displays brand message, copyright, and action links (Request Invite, Donate, GitHub).
 * Uses shadcn/ui components and Tailwind CSS for styling.
 */
export function GuestFooter({ isRequestAccess = false }: GuestFooterProps) {
  const { isMobile } = useResponsive();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'w-full mt-[60px] mb-5 min-h-[48px] border-t',
        'flex items-center justify-between',
        isMobile ? 'flex-col gap-5 px-4 py-5' : 'flex-row gap-0 px-4 py-6',
        isRequestAccess ? 'bg-background' : 'bg-transparent',
        'text-center sm:text-left'
      )}
      style={{
        borderColor: BRAND_COLORS.overlay,
      }}
    >
      {/* Left Section - Brand & Copyright */}
      <div className="flex flex-col gap-1">
        <p
          className="flex items-center flex-wrap gap-1 text-[clamp(14px,4vw,18px)] font-normal leading-[1.4]"
          style={{ color: BRAND_COLORS.navy }}
        >
          Quote.Vote made with{' '}
          <span
            className="text-[clamp(16px,4.5vw,20px)] mx-1"
            style={{ color: '#e25555' }}
          >
            ❤️
          </span>{' '}
          on Earth
        </p>

        {/* Copyright */}
        <p
          className="text-xs font-normal opacity-80"
          style={{ color: BRAND_COLORS.navy }}
        >
          © {currentYear} Quote.Vote. All rights reserved.
        </p>
      </div>

      {/* Right Section - Links */}
      <div
        className={cn(
          'flex items-center flex-wrap justify-center',
          isMobile
            ? 'gap-[clamp(12px,3vw,24px)]'
            : 'gap-[clamp(16px,4vw,36px)]'
        )}
      >
        {/* Request Invite Button */}
        <Link
          href="/auth/request-access"
          className={cn(
            'text-[clamp(14px,3.5vw,16px)] font-medium no-underline',
            'px-4 py-2 rounded-md transition-all',
            'border bg-transparent',
            'hover:-translate-y-[1px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
          )}
          style={{
            color: BRAND_COLORS.navy,
            borderColor: BRAND_COLORS.overlay,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = BRAND_COLORS.teal;
            e.currentTarget.style.color = BRAND_COLORS.teal;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = BRAND_COLORS.overlay;
            e.currentTarget.style.color = BRAND_COLORS.navy;
          }}
        >
          Request Invite
        </Link>

        {/* Donate Button */}
        <a
          href="mailto:admin@quote.vote"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-[clamp(14px,3.5vw,16px)] font-medium no-underline',
            'px-4 py-2 rounded-md transition-all',
            'border bg-transparent',
            'hover:-translate-y-[1px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
          )}
          style={{
            color: BRAND_COLORS.navy,
            borderColor: BRAND_COLORS.overlay,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = BRAND_COLORS.aqua;
            e.currentTarget.style.color = BRAND_COLORS.aqua;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = BRAND_COLORS.overlay;
            e.currentTarget.style.color = BRAND_COLORS.navy;
          }}
        >
          Donate
        </a>

        {/* GitHub Button */}
        <a
          href="https://github.com/QuoteVote/quotevote-monorepo"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-[clamp(14px,3.5vw,16px)] font-medium no-underline',
            'px-4 py-2 rounded-md transition-all',
            'border bg-transparent',
            'flex items-center gap-2',
            'hover:-translate-y-[1px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
          )}
          style={{
            color: BRAND_COLORS.navy,
            borderColor: BRAND_COLORS.overlay,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = BRAND_COLORS.cyan;
            e.currentTarget.style.color = BRAND_COLORS.cyan;
            const icon = e.currentTarget.querySelector('svg');
            if (icon) {
              icon.style.color = BRAND_COLORS.cyan;
              icon.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = BRAND_COLORS.overlay;
            e.currentTarget.style.color = BRAND_COLORS.navy;
            const icon = e.currentTarget.querySelector('svg');
            if (icon) {
              icon.style.color = BRAND_COLORS.navy;
              icon.style.transform = 'scale(1)';
            }
          }}
        >
          <Github
            className="size-4 transition-all"
            style={{ color: BRAND_COLORS.navy }}
          />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}

