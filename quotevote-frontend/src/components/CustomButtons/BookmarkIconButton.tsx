"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import useGuestGuard from "@/hooks/useGuestGuard";
import { UPDATE_POST_BOOKMARK, CREATE_POST_MESSAGE_ROOM } from "@/graphql/mutations";
import { GET_CHAT_ROOMS, GET_POST, GET_USER_ACTIVITY, GET_TOP_POSTS } from "@/graphql/queries";
import type { BookmarkIconButtonProps } from "@/types/components";
import { cn } from "@/lib/utils";

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

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ensureAuth()) return;

    await updatePostBookmark({
      variables: { postId: post._id, userId: user._id },
    });

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

  const isBookmarked = post.bookmarkedBy && post.bookmarkedBy.includes(user._id);
  const label = isBookmarked ? "Remove saved post" : "Save post";

  if (showLabel) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={!!isBookmarked}
        className={cn(
          "h-8 rounded-full px-2.5 text-xs font-semibold text-[#6b7280] border-[#d1d5db] bg-white shadow-none gap-1 shrink-0",
          isBookmarked && "text-amber-600 border-amber-300 bg-amber-50",
          className
        )}
      >
        {isBookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
        Save
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={isBookmarked ? "Unbookmark" : "Bookmark"}
      className={className}
    >
      {isBookmarked ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
    </Button>
  );
}
