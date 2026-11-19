"use client";

import { Check, UserMinus, UserPlus } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { FOLLOW_USER } from "@/graphql/mutations";
import { GET_USER } from "@/graphql/queries";
import useGuestGuard from "@/hooks/useGuestGuard";
import type { FollowButtonProps } from "@/types/components";
import { cn } from "@/lib/utils";

// Outlined while not following, filled with white text once following (both pass WCAG AA).
const FOLLOW_CLASS =
  "border border-blue-600 bg-background text-blue-700 shadow-none hover:bg-blue-50 hover:text-blue-800 dark:border-blue-400 dark:bg-transparent dark:text-blue-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200";
// Hovering "Following" previews the unfollow action in red.
const FOLLOWING_CLASS =
  "group border border-blue-600 bg-blue-600 text-white shadow-none hover:border-red-600 hover:bg-red-600 hover:text-white dark:border-blue-600 dark:bg-blue-600 dark:hover:border-red-600 dark:hover:bg-red-600";

/**
 * FollowButton Component
 *
 * Follow / Following toggle with optimistic UI updates. "Following" is a filled state,
 * selecting it unfollows, and each change is confirmed in a toast (announced to screen readers).
 */
export function FollowButton({
  isFollowing,
  username,
  profileUserId,
  showIcon = false,
  design = false,
  small = false,
  className,
}: FollowButtonProps) {
  const ensureAuth = useGuestGuard();
  const user = useAppStore((state) => state.user.data);
  const updateFollowing = useAppStore((state) => state.updateFollowing);
  const followingId = user?._followingId;
  const followingArray = Array.isArray(followingId)
    ? followingId
    : typeof followingId === "string"
      ? [followingId]
      : [];
  const who = username ? `@${username}` : "this user";

  const [followMutation, { loading }] = useMutation(FOLLOW_USER, {
    refetchQueries: username ? [{ query: GET_USER, variables: { username } }] : [],
  });

  async function handleClick() {
    // Ignore repeat clicks instead of disabling, so keyboard focus stays on the button.
    if (loading || !ensureAuth()) return;
    const action = isFollowing ? "un-follow" : "follow";

    // Optimistic local state update
    const newFollowingArray =
      action === "un-follow"
        ? followingArray.filter((id) => id !== profileUserId)
        : [...followingArray, profileUserId];

    updateFollowing(newFollowingArray);

    try {
      await followMutation({ variables: { user_id: profileUserId, action } });
      toast.success(action === "follow" ? `You're following ${who}` : `You unfollowed ${who}`);
    } catch {
      // Revert on error
      updateFollowing(followingArray);
    }
  }

  if (showIcon) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn(isFollowing && "text-blue-600 dark:text-blue-400", className)}
        aria-label={isFollowing ? `Following ${who}, select to unfollow` : `Follow ${who}`}
        aria-busy={loading}
      >
        {isFollowing ? <Check className="size-5" /> : <UserPlus className="size-5" />}
      </Button>
    );
  }

  if (design) {
    const size = small ? "qv-auth-btn-sm" : "";
    if (isFollowing) {
      return (
        <button
          type="button"
          onClick={handleClick}
          title={`Unfollow ${who}`}
          aria-busy={loading}
          className={cn(
            "qv-auth-btn group",
            size,
            "border-[#bfd0fa] bg-[#e9f0ff] text-[#1a44c0] hover:border-[#f3c4c4]! hover:bg-[var(--auth-surface)]! hover:text-[var(--auth-danger)]! [.dark_&]:border-[#24496b] [.dark_&]:bg-[#13324a] [.dark_&]:text-[#8cc8ff]",
            className
          )}
        >
          <span className="group-hover:hidden" aria-hidden="true">
            Following
          </span>
          <span className="hidden group-hover:inline" aria-hidden="true">
            Unfollow
          </span>
          <span className="sr-only">Following, select to unfollow</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-busy={loading}
        className={cn("qv-auth-btn qv-auth-btn-primary", size, className)}
      >
        Follow
      </button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        onClick={handleClick}
        className={cn("min-w-28", FOLLOWING_CLASS, className)}
        title={`Unfollow ${who}`}
        aria-busy={loading}
      >
        <Check className="group-hover:hidden" aria-hidden="true" />
        <UserMinus className="hidden group-hover:block" aria-hidden="true" />
        <span className="group-hover:hidden" aria-hidden="true">
          Following
        </span>
        <span className="hidden group-hover:inline" aria-hidden="true">
          Unfollow
        </span>
        <span className="sr-only">Following, select to unfollow</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={cn("min-w-28", FOLLOW_CLASS, className)}
      aria-busy={loading}
    >
      <UserPlus aria-hidden="true" />
      Follow
    </Button>
  );
}
