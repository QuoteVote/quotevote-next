'use client';

import Link from 'next/link';
import type { UserFollowDisplayProps } from '@/types/profile';
import Avatar from '@/components/Avatar';
import { FollowButton } from '../CustomButtons/FollowButton';

export function UserFollowDisplay({
  avatar,
  username,
  numFollowers,
  numFollowing,
  id,
  isFollowing,
}: UserFollowDisplayProps) {
  // Handle avatar object structure
  const avatarSrc =
    typeof avatar === 'string'
      ? avatar
      : avatar?.url || undefined;

  return (
    <div
      className="flex flex-row items-center justify-center gap-4 p-4 border-b last:border-b-0"
      id="component-user-follow-display"
    >
      <div className="flex-shrink-0">
        <Avatar
          src={avatarSrc}
          alt={username}
          size={50}
        />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <Link
          href={`/profile/${username}`}
          className="font-medium hover:underline"
        >
          {username}
        </Link>
        <p className="text-sm text-muted-foreground">
          {numFollowers} followers {numFollowing} following
        </p>
      </div>
      <div className="flex-shrink-0">
        <FollowButton
          isFollowing={isFollowing}
          profileUserId={id}
          username={username}
        />
      </div>
    </div>
  );
}

