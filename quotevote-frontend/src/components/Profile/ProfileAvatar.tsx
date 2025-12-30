'use client';

import { useAppStore } from '@/store';
import Avatar from '@/components/Avatar';
import type { ProfileAvatarProps } from '@/types/profile';

export function ProfileAvatar({
  size = 'md',
  className,
}: ProfileAvatarProps) {
  const avatar = useAppStore((state) => state.user.data.avatar);

  // Handle avatar object structure
  let avatarSrc: string | undefined;
  if (typeof avatar === 'string') {
    avatarSrc = avatar;
  } else if (avatar && typeof avatar === 'object' && 'url' in avatar) {
    const avatarObj = avatar as { url?: string };
    avatarSrc = typeof avatarObj.url === 'string' ? avatarObj.url : undefined;
  }

  return (
    <div className={className}>
      <Avatar
        src={avatarSrc}
        alt="User avatar"
        size={size}
      />
    </div>
  );
}

