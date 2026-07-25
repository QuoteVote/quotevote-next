'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { User } from 'lucide-react';
import type { AvatarProps } from '@/types/components';
import { cn } from '@/lib/utils';
import { parseAvatarToUrl } from '@/lib/avatar';

/**
 * Avatar Component
 *
 * Displays a user profile image with fallback support. Accepts URL strings or
 * avataaars qualities objects (resolved via `parseAvatarToUrl`).
 */
export default function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className,
  onClick,
  ...props
}: AvatarProps) {
  const resolvedSrc = useMemo(
    () => parseAvatarToUrl(src ?? undefined) ?? (typeof src === 'string' ? src : undefined),
    [src]
  );

  // Calculate size classes and dimensions
  const sizeConfig = useMemo(() => {
    if (typeof size === 'number') {
      return {
        className: '',
        dimension: size,
        textSize: size <= 24 ? 'text-xs' : size <= 40 ? 'text-sm' : 'text-base',
      };
    }

    const configs = {
      sm: { className: 'w-8 h-8', dimension: 32, textSize: 'text-xs' },
      md: { className: 'w-10 h-10', dimension: 40, textSize: 'text-sm' },
      lg: { className: 'w-16 h-16', dimension: 64, textSize: 'text-base' },
      xl: { className: 'w-24 h-24', dimension: 96, textSize: 'text-lg' },
    };

    return configs[size] || configs.md;
  }, [size]);

  // Generate initials from alt text if fallback is not provided
  const fallbackContent = useMemo(() => {
    if (fallback !== undefined) {
      return typeof fallback === 'string' ? fallback : fallback;
    }

    // Generate initials from alt text
    if (alt) {
      const words = alt.trim().split(/\s+/);
      if (words.length >= 2) {
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
      }
      if (words[0] && words[0].length > 0) {
        return words[0][0].toUpperCase();
      }
    }

    return null;
  }, [alt, fallback]);

  const baseClasses = cn(
    'relative inline-flex items-center justify-center',
    'rounded-full overflow-hidden',
    'bg-[var(--color-gray-light)]',
    'flex-shrink-0',
    sizeConfig.className,
    onClick && 'cursor-pointer transition-opacity hover:opacity-80',
    className
  );

  return (
    <div
      className={baseClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Trigger click handler for keyboard accessibility
                onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      aria-label={onClick ? alt : undefined}
      style={
        typeof size === 'number'
          ? {
              width: `${sizeConfig.dimension}px`,
              height: `${sizeConfig.dimension}px`,
            }
          : undefined
      }
      {...props}
    >
      {/* Keyed by src so load/error state resets when the avatar changes */}
      <AvatarMedia
        key={resolvedSrc ?? 'fallback'}
        resolvedSrc={resolvedSrc}
        alt={alt}
        dimension={sizeConfig.dimension}
        textSize={sizeConfig.textSize}
        fallbackContent={fallbackContent}
      />
    </div>
  );
}

function AvatarMedia({
  resolvedSrc,
  alt,
  dimension,
  textSize,
  fallbackContent,
}: {
  resolvedSrc?: string;
  alt?: string;
  dimension: number;
  textSize: string;
  fallbackContent: string | React.ReactNode | null;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const showImage = !!resolvedSrc && !imageError;

  if (showImage && resolvedSrc) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt || 'User avatar'}
        width={dimension}
        height={dimension}
        loading="lazy"
        className={cn(
          'object-cover w-full h-full',
          !imageLoaded && 'opacity-0'
        )}
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
        {...(resolvedSrc.startsWith('data:') ||
        resolvedSrc.startsWith('blob:') ||
        resolvedSrc.includes('avataaars.io')
          ? { unoptimized: true }
          : {})}
      />
    );
  }

  return (
    <div
      className={cn(
        'w-full h-full flex items-center justify-center',
        'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]',
        textSize,
        'font-medium'
      )}
      aria-hidden="true"
    >
      {fallbackContent ? (
        <span>{fallbackContent}</span>
      ) : (
        <User
          className={cn(
            dimension <= 32 ? 'w-4 h-4' : dimension <= 40 ? 'w-5 h-5' : 'w-6 h-6'
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
