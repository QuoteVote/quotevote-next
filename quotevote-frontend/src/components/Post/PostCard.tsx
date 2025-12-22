// src/components/ui/Post/PostCard.tsx
'use client';

import { Post } from './Post';
import type { Post as PostType } from '@/types/post';

interface PostCardProps extends PostType {
  onHidePost?: (post: PostType) => void;
  user: {
    _id: string;
    _followingId: string[];
    admin?: boolean;
    name?: string;
    username?: string;
  };
  postHeight?: number;
  postActions?: unknown[];
  refetchPost?: () => void;
}

/**
 * PostCard - Wrapper around Post component for list display
 * Handles data transformation and prop mapping
 * 
 * @param props - Post data and callbacks
 */
export function PostCard(props: PostCardProps): JSX.Element {
  const { onHidePost, user, postHeight, postActions, refetchPost, ...post } = props;

  return (
    <Post
      post={post}
      user={user}
      postHeight={postHeight}
      postActions={postActions}
      refetchPost={refetchPost}
    />
  );
}
