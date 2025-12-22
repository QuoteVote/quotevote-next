// src/components/Post/index.ts

/**
 * Post Components Barrel Export
 * Centralizes all Post-related component exports for cleaner imports
 */

// Main Post Components
export { Post } from './Post';
export { PostCard } from './PostCard';
export { PostSkeleton } from './PostSkeleton';
export { PostView } from './PostView';
export { PostPageClient } from './PostPageClient';

// List Components
export { default as PostsList } from './PostsList';
export { default as PaginatedPostsList } from './PaginatedPostsList';

// Re-export types for convenience
export type {
  Post as PostType,
  Creator,
  Vote,
  SelectedText,
  VoteInput,
  CommentInput,
  QuoteInput,
  PostComponentProps,
  PaginatedPostsListProps,
} from '@/types/post';
