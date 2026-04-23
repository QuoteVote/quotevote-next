'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { parseAvatarToUrl, getDefaultAvatar, buildAvatarUrl } from '@/lib/avatar';

export interface DisplayAvatarProps {
  /** Raw avatar data from the store/API: qualities object, JSON string, URL, or undefined. */
  avatar?: string | Record<string, unknown> | null;
  /** Username — used to generate a deterministic default cartoon when no avatar is set. */
  username?: string;
  /** Pixel size for width and height. */
  size?: number;
  className?: string;
}

/**
 * Renders a circular cartoon avatar using avataaars.io.
 * Always shows a cartoon character — never falls back to initials or a generic icon.
 *
 * When the user has a configured avatar (avataaars qualities object or URL), it is
 * rendered directly. When no avatar is configured, a deterministic cartoon is
 * generated from the username so the same user always gets the same default.
 */
export function DisplayAvatar({ avatar, username = '', size = 40, className }: DisplayAvatarProps) {
  const src = useMemo(() => {
    const configured = parseAvatarToUrl(avatar ?? undefined);
    if (configured) return configured;
    return buildAvatarUrl(getDefaultAvatar(username));
  }, [avatar, username]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={username ? `${username}'s avatar` : 'User avatar'}
      width={size}
      height={size}
      className={cn('rounded-full object-cover flex-shrink-0', className)}
      style={{ width: size, height: size }}
    />
  );
}
