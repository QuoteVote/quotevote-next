"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import useGuestGuard from "@/hooks/useGuestGuard";
import { UPDATE_POST_BOOKMARK, CREATE_POST_MESSAGE_ROOM } from "@/graphql/mutations";
import { GET_CHAT_ROOMS, GET_POST, GET_USER_ACTIVITY, GET_TOP_POSTS } from "@/graphql/queries";
import type { BookmarkIconButtonProps } from "@/types/components";
import { POST_ACTION_NEUTRAL_CLASS, POST_ACTION_PILL_CLASS } from "@/lib/constants/postActions";
import { cn } from "@/lib/utils";
import { announceBookmarkChange } from "@/lib/utils/bookmarkFeedback";

/**
 * BookmarkIconButton Component
 *
 * Icon button for bookmarking/unbookmarking posts.
 * Creates a message room when bookmarking.
 */
export function BookmarkIconButton({
  post,
  user,
  limit = 5,
  showLabel = false,
  className,
}: BookmarkIconButtonProps) {
  const [updatePostBookmark] = useMutation(UPDATE_POST_BOOKMARK);
  const [createPostMessageRoom] = useMutation(CREATE_POST_MESSAGE_ROOM);
  const ensureAuth = useGuestGuard();

  const isBookmarked = !!post.bookmarkedBy?.includes(user._id);
  const label = isBookmarked ? "Remove saved post" : "Save post";

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ensureAuth()) return;

    // GraphQL errors are already shown by the global Apollo error link.
    try {
      await updatePostBookmark({
        variables: { postId: post._id, userId: user._id },
      });
    } catch {
      return;
    }
    announceBookmarkChange(isBookmarked);

    await createPostMessageRoom({
      variables: { postId: post._id },
      refetchQueries: [
        {
          query: GET_CHAT_ROOMS,
        },
        {
          query: GET_POST,
          variables: {
            postId: post._id,
          },
        },
        {
          query: GET_USER_ACTIVITY,
          variables: {
            user_id: user._id,
            limit: limit || 5,
            offset: 0,
            searchKey: "",
            activityEvent: [],
          },
        },
        {
          query: GET_TOP_POSTS,
          variables: {
            limit: limit || 5,
            offset: 0,
            searchKey: "",
            interactions: false,
          },
        },
      ],
    });
  };

  if (showLabel) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={isBookmarked}
        className={cn(
          POST_ACTION_PILL_CLASS,
          "gap-2 shrink-0",
          isBookmarked
            ? "border-[#f3de9c] bg-[#fff7dd] text-[#875a0e] hover:bg-[#fff1c4] hover:text-[#875a0e] dark:border-[#6b5313] dark:bg-[#3a2c0f] dark:text-[#f3c96b] [.neo-brutalism_&]:border-[var(--shell-line)] [.neo-brutalism_&]:bg-[#ffe533] [.neo-brutalism_&]:text-[#070b14]"
            : POST_ACTION_NEUTRAL_CLASS,
          className
        )}
      >
        {isBookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
        {isBookmarked ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={isBookmarked}
      className={cn(isBookmarked && "text-amber-600 dark:text-amber-400", className)}
    >
      {isBookmarked ? (
        <BookmarkCheck className="size-5" fill="currentColor" fillOpacity={0.2} />
      ) : (
        <Bookmark className="size-5" />
      )}
    </Button>
  );
}
