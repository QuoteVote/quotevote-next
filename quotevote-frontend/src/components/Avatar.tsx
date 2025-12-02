'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { User } from 'lucide-react';
import type { AvatarProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * Avatar Component
 * 
 * A fully typed, reusable Avatar component that displays user profile images
 * with fallback support for missing images. Supports initials or a default icon
 * as fallback content.
 * 
 * @param src - URL of the avatar image
 * @param alt - Alt text for the image (required for accessibility)
 * @param fallback - Fallback text (typically user initials) or React node
 * @param size - Size variant: 'sm', 'md', 'lg', or a custom number in pixels
 * @param className - Additional CSS classes
 * @param onClick - Optional click handler
 * 
 * @example
 * <Avatar src="/avatar.jpg" alt="John Doe" size="md" />
 * <Avatar alt="Jane Smith" fallback="JS" size="lg" />
 */
export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className,
  onClick,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const showImage = src && !imageError;
  const showFallback = !showImage;

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
      {showImage && (
        <Image
          src={src}
          alt={alt || 'User avatar'}
          width={sizeConfig.dimension}
          height={sizeConfig.dimension}
          className={cn(
            'object-cover w-full h-full',
            !imageLoaded && 'opacity-0'
          )}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          {...(src?.startsWith('data:') || src?.startsWith('blob:')
            ? { unoptimized: true }
            : {})}
        />
      )}

      {showFallback && (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center',
            'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]',
            sizeConfig.textSize,
            'font-medium'
          )}
          aria-hidden="true"
        >
          {fallbackContent ? (
            <span>{fallbackContent}</span>
          ) : (
            <User
              className={cn(
                sizeConfig.dimension <= 32
                  ? 'w-4 h-4'
                  : sizeConfig.dimension <= 40
                  ? 'w-5 h-5'
                  : 'w-6 h-6'
              )}
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </div>
  );
}

