
/**
 * Utility functions to handle MongoDB ObjectID serialization issues
 */
import { IdLike, MongoObjectID, PostWithIds, VotedByEntry, CreatorRef } from '@/types/store'

/**
 * Recursively converts MongoDB ObjectID objects to strings in a data structure
 * @param {any} data - The data to process
 * @returns {any} - The processed data with ObjectIDs converted to strings
 */
export function serializeObjectIds<T = unknown>(data: T): T | string | Record<string, unknown> | Array<unknown> {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return (data as Array<unknown>).map(item => serializeObjectIds(item));
  }

  // Handle objects
  if (typeof data === 'object') {
    // Check if it's a MongoDB ObjectID
    const maybeObjId = data as Partial<MongoObjectID>
    if (maybeObjId._bsontype === 'ObjectID' && maybeObjId.id) {
      try {
        // Try to use toString method if available
        if (typeof maybeObjId.toString === 'function') {
          return maybeObjId.toString();
        }
        // Fallback: convert the buffer to a hex string
        if (Buffer.isBuffer(maybeObjId.id as Buffer)) {
          return (maybeObjId.id as Buffer).toString('hex');
        }
        // Another fallback: try to access the id as a string
        return String(maybeObjId.id);
      } catch (_error) {
        return String(maybeObjId.id);
      }
    }

    // Process regular objects
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = serializeObjectIds(value);
    }
    return result;
  }

  // Return primitives as-is
  return data;
}

/**
 * Specifically handles the votedBy field serialization
 * @param {Array} votedBy - The votedBy array from a post
 * @returns {Array} - The processed votedBy array
 */
export function serializeVotedBy(votedBy: unknown): VotedByEntry[] {
  if (!Array.isArray(votedBy)) {
    return [];
  }

  return votedBy.map((vote: unknown) => {
    if (typeof vote === 'object' && vote !== null) {
      const v = vote as VotedByEntry
      return {
        ...v,
        userId: serializeObjectIds(v.userId) as IdLike,
        _id: serializeObjectIds(v._id) as IdLike
      };
    }
    return vote as VotedByEntry;
  });
}

/**
 * Processes a post object to fix ObjectID serialization issues
 * @param {Object} post - The post object
 * @returns {Object} - The processed post object
 */
export function serializePost<T extends PostWithIds>(post: PostWithIds): T {
  if (!post || typeof post !== 'object') {
    return post;
  }

  return {
    ...post,
    votedBy: serializeVotedBy((post as PostWithIds).votedBy),
    approvedBy: Array.isArray((post as PostWithIds).approvedBy)
      ? ((post as PostWithIds).approvedBy as IdLike[]).map((id: IdLike) => serializeObjectIds(id) as IdLike)
      : (post as PostWithIds).approvedBy,
    rejectedBy: Array.isArray((post as PostWithIds).rejectedBy)
      ? ((post as PostWithIds).rejectedBy as IdLike[]).map((id: IdLike) => serializeObjectIds(id) as IdLike)
      : (post as PostWithIds).rejectedBy,
    bookmarkedBy: Array.isArray((post as PostWithIds).bookmarkedBy)
      ? ((post as PostWithIds).bookmarkedBy as IdLike[]).map((id: IdLike) => serializeObjectIds(id) as IdLike)
      : (post as PostWithIds).bookmarkedBy,
    reportedBy: Array.isArray((post as PostWithIds).reportedBy)
      ? ((post as PostWithIds).reportedBy as IdLike[]).map((id: IdLike) => serializeObjectIds(id) as IdLike)
      : (post as PostWithIds).reportedBy,
    _id: serializeObjectIds((post as PostWithIds)._id) as IdLike,
    userId: serializeObjectIds((post as PostWithIds).userId) as IdLike,
    groupId: serializeObjectIds((post as PostWithIds).groupId) as IdLike,
    creator: post.creator ? {
      ...(post.creator as Record<string, unknown>),
      _id: serializeObjectIds(((post as PostWithIds).creator as CreatorRef)?._id) as IdLike
    } : post.creator
  } as unknown as T;
} 