'use client';

/**
 * Individual Post Page
 * 
 * Dashboard page for viewing a specific post with its comments, votes, and quotes.
 * Migrated from PostController component.
 * 
 * Route: /dashboard/post/[group]/[title]/[postId]
 */

import { useParams } from 'next/navigation';
import PostController from '@/components/Post/PostController';

export default function PostDetailPage(): React.ReactNode {
  const params = useParams<{ postId: string }>();
  const postId = params?.postId;

  if (!postId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  return <PostController postId={postId} />;
}
