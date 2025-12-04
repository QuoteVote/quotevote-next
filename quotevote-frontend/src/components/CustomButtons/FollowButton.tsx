'use client';

import { UserPlus, UserMinus } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import type { FollowButtonProps } from '@/types/components';
import { cn } from '@/lib/utils';

// GraphQL mutations - TODO: Move to @/graphql/mutations when GraphQL operations are migrated
const FOLLOW_MUTATION = gql`
  mutation followUser($user_id: String!, $action: String!) {
    followUser(user_id: $user_id, action: $action) {
      _id
      name
    }
  }
`;

// GraphQL queries - TODO: Move to @/graphql/queries when GraphQL operations are migrated
const GET_USER = gql`
  query getUser($username: String!) {
    user(username: $username) {
      _id
      name
      username
    }
  }
`;

/**
 * FollowButton Component
 * 
 * Button for following/unfollowing users.
 * Can display as icon-only or with text.
 */
export function FollowButton({
  isFollowing,
  username,
  profileUserId,
  showIcon = false,
  className,
}: FollowButtonProps) {
  const [followMutation] = useMutation(FOLLOW_MUTATION, {
    refetchQueries: username
      ? [
          {
            query: GET_USER,
            variables: {
              username,
            },
          },
        ]
      : [],
  });

  const user = useAppStore((state) => state.user.data);
  const updateFollowing = useAppStore((state) => state.updateFollowing);
  const followingId = user?._followingId;
  const followingArray = Array.isArray(followingId) ? followingId : typeof followingId === 'string' ? [followingId] : [];

  // Simple auth check - TODO: Replace with proper useGuestGuard hook when migrated
  const ensureAuth = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return !!token;
  };

  async function handleClick(action: 'follow' | 'un-follow') {
    if (!ensureAuth()) return;

    let newFollowingArray: string[];
    if (action === 'un-follow') {
      newFollowingArray = followingArray.filter((id) => id !== profileUserId);
    } else {
      newFollowingArray = [...followingArray, profileUserId];
    }

    // Update following array - store expects a single string or array
    // For now, we'll update the store with the first ID or empty string
    // TODO: Update store interface to accept string[] if needed
    if (newFollowingArray.length > 0) {
      updateFollowing(newFollowingArray[0]);
    } else {
      updateFollowing('');
    }
    await followMutation({ variables: { user_id: profileUserId, action } });
  }

  if (isFollowing) {
    const action = 'un-follow';
    return showIcon ? (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleClick(action)}
        className={cn(className)}
        aria-label="Unfollow"
      >
        <UserMinus className="size-5" />
      </Button>
    ) : (
      <Button
        variant="default"
        onClick={() => handleClick(action)}
        className={cn(className)}
      >
        Un-Follow
      </Button>
    );
  }

  const action = 'follow';
  return showIcon ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleClick(action)}
      className={cn(className)}
      aria-label="Follow"
    >
      <UserPlus className="size-5" />
    </Button>
  ) : (
    <Button
      variant="default"
      onClick={() => handleClick(action)}
      className={cn(className)}
    >
      Follow
    </Button>
  );
}

