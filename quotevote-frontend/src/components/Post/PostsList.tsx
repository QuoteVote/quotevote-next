// src/components/Post/PostsList.tsx
'use client';

import { JSX, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { Loader2 } from 'lucide-react';
import { Post } from './Post';
import { PostSkeleton } from './PostSkeleton';
import { GET_TOP_POSTS } from '@/graphql/queries';
import type { PostsData, PostsListProps } from '@/types/post';

/**
 * Loading spinner component
 */
function LoadingSpinner({ size = 30 }: { size?: number }): JSX.Element {
  return (
    <div className="flex justify-center py-4">
      <Loader2 className="animate-spin" style={{ width: size, height: size }} />
    </div>
  );
}

/**
 * PostsList component - Main container with Apollo integration
 * Fetches posts and handles pagination with Load More button
 */
export default function PostsList({
  userId,
  limit = 10,
  variables = {},
}: PostsListProps): JSX.Element {
  const { data, loading, fetchMore } = useQuery<PostsData>(GET_TOP_POSTS, {
    variables: {
      ...variables,
      userId,
      limit,
      offset: 0,
    },
    notifyOnNetworkStatusChange: true,
  });

  const handleLoadMore = useCallback((): void => {
    if (!data || loading) return;

    const newOffset = data.posts.entities.length;
    
    fetchMore({
      variables: {
        ...variables,
        userId,
        limit,
        offset: newOffset,
      },
    });
  }, [data, loading, fetchMore, variables, userId, limit]);

  // Initial loading
  if (loading && !data) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  // Empty state
  if (!data || data.posts.entities.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <p className="text-muted-foreground">No posts found.</p>
      </div>
    );
  }

  const posts = data.posts.entities.map((post, index) => ({ 
    ...post, 
    rank: index + 1 
  }));

  const hasMore = data.posts.pagination.total_count > data.posts.entities.length;

  return (
    <div className="w-full">
      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Post
            key={post._id || post.id}
            post={post}
            user={{
              _id: userId || '',
              _followingId: [],
              admin: false,
            }}
            refetchPost={() => {}}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-6 mt-4">
          {loading ? (
            <LoadingSpinner size={24} />
          ) : (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Load More Posts
            </button>
          )}
        </div>
      )}

      {/* End message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p>You've reached the end! 🎉</p>
        </div>
      )}
    </div>
  );
}
