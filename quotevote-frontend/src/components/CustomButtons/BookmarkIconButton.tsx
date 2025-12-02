'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { Button } from '@/components/ui/button';
import type { BookmarkIconButtonProps } from '@/types/components';

// GraphQL mutations - TODO: Move to @/graphql/mutations when GraphQL operations are migrated
const UPDATE_POST_BOOKMARK = gql`
  mutation updatePostBookmark($postId: String!, $userId: String!) {
    updatePostBookmark(postId: $postId, userId: $userId) {
      _id
      bookmarkedBy
    }
  }
`;

const CREATE_POST_MESSAGE_ROOM = gql`
  mutation createPostMessageRoom($postId: String!) {
    createPostMessageRoom(postId: $postId) {
      _id
      users
      messageType
      created
      title
      avatar
    }
  }
`;

// GraphQL queries - TODO: Move to @/graphql/queries when GraphQL operations are migrated
const GET_CHAT_ROOMS = gql`
  query getChatRooms {
    chatRooms {
      _id
    }
  }
`;

const GET_POST = gql`
  query getPost($postId: String!) {
    post(postId: $postId) {
      _id
      bookmarkedBy
    }
  }
`;

const GET_USER_ACTIVITY = gql`
  query getUserActivity($user_id: String!, $limit: Int!, $offset: Int!, $searchKey: String!, $activityEvent: [String!]!) {
    userActivity(user_id: $user_id, limit: $limit, offset: $offset, searchKey: $searchKey, activityEvent: $activityEvent) {
      _id
    }
  }
`;

const GET_TOP_POSTS = gql`
  query getTopPosts($limit: Int!, $offset: Int!, $searchKey: String!, $interactions: Boolean!) {
    topPosts(limit: $limit, offset: $offset, searchKey: $searchKey, interactions: $interactions) {
      _id
    }
  }
`;

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

