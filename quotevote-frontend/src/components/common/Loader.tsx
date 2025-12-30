'use client';

import { useMemo } from 'react';
import type { LoaderProps } from '@/types/components';
import { cn } from '@/lib/utils';

const DEFAULT_LOADER_STYLE: React.CSSProperties = {
  width: 'auto',
  height: 'auto',
  zIndex: 100,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const ABSOLUTELY_POSITIONED_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(50% - 15px)',
  left: 'calc(50% - 36px)',
};

/**
 * Loader Component
 * 
 * A loading spinner component with customizable size and positioning.
 * Replaces Material UI CircularProgress with a Tailwind-based spinner.
 */
export function Loader({
  size = 40,
  loaderStyle,
  mergeStyles = false,
  absolutelyPositioned = true,
  PulseLoaderProps,
  thickness = 3.6,
  loadingLabel,
}: LoaderProps) {
  const computedStyle = useMemo(() => {
    if (!mergeStyles && loaderStyle) {
      return loaderStyle;
    }

    return {
      ...DEFAULT_LOADER_STYLE,
      ...(absolutelyPositioned ? ABSOLUTELY_POSITIONED_STYLE : {}),
      ...(loaderStyle || {}),
    };
  }, [loaderStyle, mergeStyles, absolutelyPositioned]);

  // Calculate border width from thickness (thickness is a percentage-like value)
  const borderWidth = Math.max(1, Math.round((thickness / 10) * (size / 10)));

  return (
    <div style={computedStyle} {...PulseLoaderProps}>
      <div
        className={cn(
          'animate-spin rounded-full border-solid',
          'border-[var(--color-primary)] border-t-transparent'
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderWidth: `${borderWidth}px`,
        }}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {loadingLabel && (
        <div className="ml-2.5 text-sm text-[var(--color-text-secondary)]">
          Loading...
        </div>
      )}
    </div>
  );
}

