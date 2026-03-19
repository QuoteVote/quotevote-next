'use client';

import { UserPlus, UserMinus } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { FOLLOW_USER } from '@/graphql/mutations';
import { GET_USER } from '@/graphql/queries';
import useGuestGuard from '@/hooks/useGuestGuard';
import type { FollowButtonProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * FollowButton Component
 *
 * Button for following/unfollowing users with optimistic UI updates.
 */
export function FollowButton({
  isFollowing,
  username,
  profileUserId,
  showIcon = false,
  className,
}: FollowButtonProps) {
  const ensureAuth = useGuestGuard();
  const user = useAppStore((state) => state.user.data);
  const updateFollowing = useAppStore((state) => state.updateFollowing);
  const followingId = user?._followingId;
  const followingArray = Array.isArray(followingId) ? followingId : typeof followingId === 'string' ? [followingId] : [];

  const [followMutation, { loading }] = useMutation(FOLLOW_USER, {
    refetchQueries: username
      ? [{ query: GET_USER, variables: { username } }]
      : [],
  });

  async function handleClick(action: 'follow' | 'un-follow') {
    if (!ensureAuth()) return;

    // Optimistic local state update
    let newFollowingArray: string[];
    if (action === 'un-follow') {
      newFollowingArray = followingArray.filter((id) => id !== profileUserId);
    } else {
      newFollowingArray = [...followingArray, profileUserId];
    }

    if (newFollowingArray.length > 0) {
      updateFollowing(newFollowingArray[0]);
    } else {
      updateFollowing('');
    }

    try {
      await followMutation({ variables: { user_id: profileUserId, action } });
    } catch {
      // Revert on error
      if (action === 'un-follow') {
        updateFollowing(profileUserId);
      } else {
        const reverted = followingArray.filter((id) => id !== profileUserId);
        updateFollowing(reverted.length > 0 ? reverted[0] : '');
      }
    }
  }

  if (isFollowing) {
    return showIcon ? (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleClick('un-follow')}
        className={cn(className)}
        aria-label="Unfollow"
        disabled={loading}
      >
        <UserMinus className="size-5" />
      </Button>
    ) : (
      <Button
        variant="default"
        onClick={() => handleClick('un-follow')}
        className={cn(className)}
        disabled={loading}
      >
        Un-Follow
      </Button>
    );
  }

  return showIcon ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleClick('follow')}
      className={cn(className)}
      aria-label="Follow"
      disabled={loading}
    >
      <UserPlus className="size-5" />
    </Button>
  ) : (
    <Button
      variant="default"
      onClick={() => handleClick('follow')}
      className={cn(className)}
      disabled={loading}
    >
      Follow
    </Button>
  );
}
