/**
 * Profile banner background customization.
 *
 * Pure helpers for the user-customizable profile cover banner — a curated
 * color palette, CSS-only patterns (no images, no backend), and a builder
 * that turns a (color, pattern) pair into an inline style object.
 */

import type { CSSProperties } from 'react';
import type {
  ProfileBackgroundPattern,
  ProfileBackgroundPatternOption,
} from '@/types/profile';

export const DEFAULT_PROFILE_BG_COLOR = '#52b274';
export const DEFAULT_PROFILE_BG_PATTERN: ProfileBackgroundPattern = 'none';

/** Curated preset swatches (brand green first). */
export const PROFILE_BG_COLORS: readonly string[] = [
  '#52b274', // brand green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
  '#14b8a6', // teal
  '#0f172a', // slate
] as const;

export const PROFILE_BG_PATTERNS: readonly ProfileBackgroundPatternOption[] = [
  { value: 'none', label: 'Solid' },
  { value: 'zigzag', label: 'Zigzag' },
  { value: 'dots', label: 'Dots' },
  { value: 'stripes', label: 'Stripes' },
  { value: 'grid', label: 'Grid' },
] as const;

const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Falls back to the default when the color is missing or not a valid hex. */
export function normalizeProfileBgColor(color: string | null | undefined): string {
  return color && HEX_COLOR_RE.test(color) ? color : DEFAULT_PROFILE_BG_COLOR;
}

/** Falls back to the default when the pattern is unknown. */
export function normalizeProfileBgPattern(
  pattern: string | null | undefined
): ProfileBackgroundPattern {
  return PROFILE_BG_PATTERNS.some((p) => p.value === pattern)
    ? (pattern as ProfileBackgroundPattern)
    : DEFAULT_PROFILE_BG_PATTERN;
}

/**
 * Builds the inline style for the profile cover banner. The pattern is drawn
 * with a translucent white overlay on top of the chosen solid color so any
 * color stays legible behind the avatar.
 */
export function getProfileBackgroundStyle(
  color: string,
  pattern: ProfileBackgroundPattern
): CSSProperties {
  const safeColor = normalizeProfileBgColor(color);
  const overlay = 'rgba(255, 255, 255, 0.22)';
  const base: CSSProperties = { backgroundColor: safeColor };

  switch (normalizeProfileBgPattern(pattern)) {
    case 'zigzag':
      return {
        ...base,
        backgroundImage: [
          `linear-gradient(135deg, ${overlay} 25%, transparent 25%)`,
          `linear-gradient(225deg, ${overlay} 25%, transparent 25%)`,
          `linear-gradient(45deg, ${overlay} 25%, transparent 25%)`,
          `linear-gradient(315deg, ${overlay} 25%, transparent 25%)`,
        ].join(', '),
        backgroundPosition: '14px 0, 14px 0, 0 0, 0 0',
        backgroundSize: '28px 28px',
        backgroundRepeat: 'repeat',
      };
    case 'dots':
      return {
        ...base,
        backgroundImage: `radial-gradient(${overlay} 2px, transparent 2px)`,
        backgroundSize: '18px 18px',
      };
    case 'stripes':
      return {
        ...base,
        backgroundImage: `repeating-linear-gradient(45deg, ${overlay} 0, ${overlay} 8px, transparent 8px, transparent 16px)`,
      };
    case 'grid':
      return {
        ...base,
        backgroundImage: `linear-gradient(${overlay} 1px, transparent 1px), linear-gradient(90deg, ${overlay} 1px, transparent 1px)`,
        backgroundSize: '22px 22px',
      };
    case 'none':
    default:
      return base;
  }
}
