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

export const DEFAULT_PROFILE_BG_COLOR = '#0f7d56'; // brand green, as in the design
export const DEFAULT_PROFILE_BG_PATTERN: ProfileBackgroundPattern = 'zigzag';

/** Preset swatches from the approved design (Edit profile), green first. */
export const PROFILE_BG_COLORS: readonly string[] = [
  '#0f7d56', // green
  '#2c5c9e', // blue
  '#6b3a78', // plum
  '#b4530a', // rust
  '#16201b', // ink
  '#c9b48a', // sand
] as const;

/** Names for the swatches, for screen readers. */
export const PROFILE_BG_COLOR_NAMES: Readonly<Record<string, string>> = {
  '#0f7d56': 'Green',
  '#2c5c9e': 'Blue',
  '#6b3a78': 'Plum',
  '#b4530a': 'Rust',
  '#16201b': 'Ink',
  '#c9b48a': 'Sand',
};

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
  pattern: ProfileBackgroundPattern,
  /** Pattern tile size: 36 on the profile banner, 28 on cards, 16 in the swatches. */
  size = 28
): CSSProperties {
  const safeColor = normalizeProfileBgColor(color);
  const base: CSSProperties = { backgroundColor: safeColor };

  switch (normalizeProfileBgPattern(pattern)) {
    case 'zigzag': {
      const overlay = 'rgba(255, 255, 255, 0.1)';
      return {
        ...base,
        backgroundImage: [
          `linear-gradient(135deg, ${overlay} 25%, transparent 25%)`,
          `linear-gradient(225deg, ${overlay} 25%, transparent 25%)`,
        ].join(', '),
        backgroundSize: `${size}px ${size}px`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'dots': {
      const dot = Math.max(2, Math.round(size / 6));
      return {
        ...base,
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) ${dot}px, transparent ${dot + 0.5}px)`,
        backgroundSize: `${Math.round(size * 0.75)}px ${Math.round(size * 0.75)}px`,
      };
    }
    case 'stripes': {
      const band = Math.round(size * 0.375);
      return {
        ...base,
        backgroundImage: `repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.16) 0 ${band}px, transparent ${band}px ${Math.round(size * 0.875)}px)`,
      };
    }
    case 'grid':
      return {
        ...base,
        backgroundImage:
          'linear-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px)',
        backgroundSize: `${Math.round(size * 0.75)}px ${Math.round(size * 0.75)}px`,
      };
    case 'none':
    default:
      return base;
  }
}
