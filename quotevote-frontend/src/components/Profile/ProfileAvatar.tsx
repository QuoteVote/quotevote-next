'use client';

import { useAppStore } from '@/store';
import { DisplayAvatar } from '@/components/DisplayAvatar';
import type { ProfileAvatarProps } from '@/types/profile';

const SIZE_MAP: Record<string, number> = { sm: 32, md: 40, lg: 64, xl: 96 };

export function ProfileAvatar({ size = 'md', className }: ProfileAvatarProps) {
  const avatar = useAppStore((state) => state.user.data.avatar);
  const username = useAppStore((state) => state.user.data.username as string | undefined);

  const px = typeof size === 'number' ? size : (SIZE_MAP[size] ?? 40);

  return (
    <div className={className}>
      <DisplayAvatar
        avatar={avatar as string | Record<string, unknown> | undefined}
        username={username}
        size={px}
      />
    </div>
  );
}
