'use client';

import { useQuery } from '@apollo/client/react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, MessageCircle, Share2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GET_POST_BY_ID_QUERY } from '@/graphql/queries';
import { formatPostDate } from '@/lib/utils/date';
import type { Post as PostType } from '@/types/post';

interface PostViewProps {
  postId: string;
}

interface PostQueryData {
  post: PostType;
}

/**
 * PostView - Displays a single post with full details
 *
 * Features:
 * - Full post content display
 * - Like/comment/share actions
 * - Back navigation
 * - Loading and error states
 *
 * @param props - PostViewProps with postId
 */
export function PostView({ postId }: PostViewProps): JSX.Element {
  const router = useRouter();
  const { data, loading, error } = useQuery<PostQueryData>(GET_POST_BY_ID_QUERY, {
    variables: { postId },
  });

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card data-testid="post-view-loading">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load post: {error.message}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // No data state
  if (!data?.post) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Post not found</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const { post } = data;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Post card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.creator.avatar?.url} alt={post.creator.name} />
              <AvatarFallback style={{ backgroundColor: post.creator.avatar?.color }}>
                {post.creator.avatar?.initials ||
                  post.creator.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{post.creator.name}</h3>
              {post.creator.username && (
                <p className="text-sm text-muted-foreground">
                  @{post.creator.username}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatPostDate(post.created || post.createdAt)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <h2 className="text-xl font-bold mb-4">{post.title}</h2>
          <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
            {post.text || post.content}
          </p>
        </CardContent>

        <CardFooter className="flex gap-2 border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            className={post.isLiked ? 'text-red-500' : ''}
          >
            <Heart
              className={`mr-2 h-4 w-4 ${
                post.isLiked ? 'fill-current' : ''
              }`}
            />
            {post.likesCount || 0}
          </Button>

          <Button variant="ghost" size="sm">
            <MessageCircle className="mr-2 h-4 w-4" />
            {post.commentsCount || 0}
          </Button>

          <Button variant="ghost" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </CardFooter>
      </Card>

      {/* Comments section placeholder */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Comments</h3>
        <p className="text-muted-foreground text-center py-8">
          Comments section coming soon...
        </p>
      </div>
    </div>
  );
}
