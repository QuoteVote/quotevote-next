'use client';

import Link from 'next/link';
import { Github, Heart, Mail } from 'lucide-react';
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
 * Professional footer component for guest/public pages.
 * Displays brand message, copyright, and action links with modern, polished styling.
 * Uses shadcn/ui components and Tailwind CSS for styling.
 */
export function GuestFooter({ isRequestAccess = false }: GuestFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'w-full relative',
        'border-t',
        isRequestAccess 
          ? 'bg-gradient-to-b from-background to-background/95 backdrop-blur-sm' 
          : 'bg-gradient-to-b from-white/80 via-white/60 to-transparent backdrop-blur-sm',
        'mt-16 sm:mt-20'
      )}
      style={{
        borderImage: 'linear-gradient(90deg, transparent, rgba(42, 230, 178, 0.2), rgba(39, 196, 225, 0.2), transparent) 1',
        borderTopWidth: '1px',
      }}
    >
      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(10, 35, 66, 0.02) 100%)',
        }}
      />

      <div className={cn(
        'relative z-10',
        'max-w-7xl mx-auto',
        'px-4 sm:px-6 lg:px-8',
        'py-8 sm:py-10 lg:py-12',
        'flex flex-col sm:flex-row',
        'items-center justify-between',
        'gap-6 sm:gap-8'
      )}>
        {/* Left Section - Brand & Copyright */}
        <div className="flex flex-col items-center sm:items-start gap-3 sm:gap-2">
          {/* Brand Message */}
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span 
              className="font-medium tracking-tight"
              style={{ color: BRAND_COLORS.navy }}
            >
              Quote.Vote
            </span>
            <span className="text-gray-400">made with</span>
            <Heart 
              className="size-4 fill-red-500 text-red-500 animate-pulse" 
              style={{ animationDuration: '2s' }}
            />
            <span className="text-gray-400">on Earth</span>
          </div>

          {/* Copyright */}
          <p
            className="text-xs sm:text-sm font-normal text-gray-500"
          >
            © {currentYear} Quote.Vote. All rights reserved.
          </p>
        </div>

        {/* Right Section - Action Links */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Request Invite Link */}
          <Link
            href="/auth/request-access"
            className={cn(
              'group relative',
              'px-5 py-2.5',
              'text-sm font-medium',
              'rounded-lg',
              'border',
              'transition-all duration-300 ease-out',
              'hover:shadow-md hover:shadow-teal-500/20',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500/50',
              'overflow-hidden'
            )}
            style={{
              color: BRAND_COLORS.navy,
              borderColor: BRAND_COLORS.overlay,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            {/* Hover gradient background */}
            <span 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${BRAND_COLORS.teal}15, ${BRAND_COLORS.aqua}15)`,
              }}
            />
            <span 
              className="relative z-10 transition-colors duration-300 group-hover:text-teal-600"
            >
              Request Invite
            </span>
          </Link>

          {/* Donate Link */}
          <a
            href="mailto:admin@quote.vote"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'group relative',
              'px-5 py-2.5',
              'text-sm font-medium',
              'rounded-lg',
              'border',
              'transition-all duration-300 ease-out',
              'hover:shadow-md hover:shadow-cyan-500/20',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500/50',
              'overflow-hidden',
              'flex items-center gap-2'
            )}
            style={{
              color: BRAND_COLORS.navy,
              borderColor: BRAND_COLORS.overlay,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            {/* Hover gradient background */}
            <span 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${BRAND_COLORS.aqua}15, ${BRAND_COLORS.cyan}15)`,
              }}
            />
            <Mail className="size-4 relative z-10 transition-colors duration-300 group-hover:text-cyan-600" />
            <span 
              className="relative z-10 transition-colors duration-300 group-hover:text-cyan-600"
            >
              Donate
            </span>
          </a>

          {/* GitHub Link */}
          <a
            href="https://github.com/QuoteVote/quotevote-monorepo"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'group relative',
              'px-5 py-2.5',
              'text-sm font-medium',
              'rounded-lg',
              'border',
              'transition-all duration-300 ease-out',
              'hover:shadow-md hover:shadow-blue-500/20',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50',
              'overflow-hidden',
              'flex items-center gap-2'
            )}
            style={{
              color: BRAND_COLORS.navy,
              borderColor: BRAND_COLORS.overlay,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            {/* Hover gradient background */}
            <span 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${BRAND_COLORS.cyan}15, ${BRAND_COLORS.navy}15)`,
              }}
            />
            <Github className="size-4 relative z-10 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-110" />
            <span 
              className="relative z-10 transition-colors duration-300 group-hover:text-blue-600"
            >
              GitHub
            </span>
          </a>
        </div>
      </div>

      {/* Bottom accent line */}
      <div 
        className="h-px w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(42, 230, 178, 0.3), rgba(39, 196, 225, 0.3), transparent)',
        }}
      />
    </footer>
  );
}

