'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PROFILE_BG_COLOR,
  DEFAULT_PROFILE_BG_PATTERN,
  normalizeProfileBgColor,
  normalizeProfileBgPattern,
} from '@/lib/utils/profileBackground';
import type {
  ProfileBackground,
  ProfileBackgroundPattern,
} from '@/types/profile';

const COLOR_KEY = 'profileBgColor';
const PATTERN_KEY = 'profileBgPattern';
const SYNC_EVENT = 'profile-background-change';

function readColor(): string {
  if (typeof window === 'undefined') return DEFAULT_PROFILE_BG_COLOR;
  try {
    return normalizeProfileBgColor(localStorage.getItem(COLOR_KEY));
  } catch (_error) {
    return DEFAULT_PROFILE_BG_COLOR;
  }
}

function readPattern(): ProfileBackgroundPattern {
  if (typeof window === 'undefined') return DEFAULT_PROFILE_BG_PATTERN;
  try {
    return normalizeProfileBgPattern(localStorage.getItem(PATTERN_KEY));
  } catch (_error) {
    return DEFAULT_PROFILE_BG_PATTERN;
  }
}

/**
 * Client-side profile banner background preference.
 *
 * Persisted to localStorage (no backend per migration rules) and kept in sync
 * across hook instances/tabs via a custom event + the native `storage` event,
 * so editing it in Settings is reflected on the profile banner.
 *
 * Initial state always uses defaults so SSR and the first client paint match;
 * persisted values hydrate in an effect after mount.
 */
export function useProfileBackground(): ProfileBackground {
  const [hydrated, setHydrated] = useState(false);
  const [color, setColorState] = useState<string>(DEFAULT_PROFILE_BG_COLOR);
  const [pattern, setPatternState] =
    useState<ProfileBackgroundPattern>(DEFAULT_PROFILE_BG_PATTERN);

  useEffect(() => {
    setColorState(readColor());
    setPatternState(readPattern());
    setHydrated(true);

    const sync = () => {
      setColorState(readColor());
      setPatternState(readPattern());
    };
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setColor = useCallback((next: string) => {
    const safe = normalizeProfileBgColor(next);
    setColorState(safe);
    try {
      localStorage.setItem(COLOR_KEY, safe);
      window.dispatchEvent(new Event(SYNC_EVENT));
    } catch (_error) {
      // ignore localStorage write errors
    }
  }, []);

  const setPattern = useCallback((next: ProfileBackgroundPattern) => {
    const safe = normalizeProfileBgPattern(next);
    setPatternState(safe);
    try {
      localStorage.setItem(PATTERN_KEY, safe);
      window.dispatchEvent(new Event(SYNC_EVENT));
    } catch (_error) {
      // ignore localStorage write errors
    }
  }, []);

  return { color, pattern, setColor, setPattern, hydrated };
}
