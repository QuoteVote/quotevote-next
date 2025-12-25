'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { Button } from '@/components/ui/button';
import { UPDATE_POST_BOOKMARK, CREATE_POST_MESSAGE_ROOM } from '@/graphql/mutations';
import { GET_CHAT_ROOMS, GET_POST, GET_USER_ACTIVITY, GET_TOP_POSTS } from '@/graphql/queries';
import type { BookmarkIconButtonProps } from '@/types/components';

/**
 * BookmarkIconButton Component
 * 
 * Icon button for bookmarking/unbookmarking posts.
 * Creates a message room when bookmarking.
 */
export function BookmarkIconButton({ post, user, limit = 5 }: BookmarkIconButtonProps) {
  const [updatePostBookmark] = useMutation(UPDATE_POST_BOOKMARK);
  const [createPostMessageRoom] = useMutation(CREATE_POST_MESSAGE_ROOM);

  // Simple auth check - TODO: Replace with proper useGuestGuard hook when migrated
  const ensureAuth = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return !!token;
  };

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
            searchKey: '',
            activityEvent: [],
          },
        },
        {
          query: GET_TOP_POSTS,
          variables: {
            limit: limit || 5,
            offset: 0,
            searchKey: '',
            interactions: false,
          },
        },
      ],
    });
  };

  const isBookmarked = post.bookmarkedBy && post.bookmarkedBy.includes(user._id);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={isBookmarked ? 'Unbookmark' : 'Bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck className="size-5" />
      ) : (
        <Bookmark className="size-5" />
      )}
    </Button>
  );
}

