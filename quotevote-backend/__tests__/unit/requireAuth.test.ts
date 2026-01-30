/**
 * Unit tests for requireAuth middleware
 */

import { requireAuth } from '~/data/utils/requireAuth';

// Mock logger
jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('requireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public queries (should return false)', () => {
    it('should return false for "posts" query', () => {
      const query = 'query { posts { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "featuredPosts" query', () => {
      const query = 'query { featuredPosts { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "post" query', () => {
      const query = 'query { post(postId: "123") { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "user" query', () => {
      const query = 'query { user(username: "test") { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "group" query', () => {
      const query = 'query { group(groupId: "123") { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "groups" query', () => {
      const query = 'query { groups { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "messages" query', () => {
      const query = 'query { messages(messageRoomId: "123") { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "actionReactions" query', () => {
      const query = 'query { actionReactions(actionId: "123") { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "messageReactions" query', () => {
      const query = 'query { messageReactions(messageId: "123") { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "getUserFollowInfo" query', () => {
      const query = 'query { getUserFollowInfo(username: "test") { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "checkDuplicateEmail" mutation', () => {
      const query = 'mutation { checkDuplicateEmail(email: "test@example.com") }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "requestUserAccess" mutation', () => {
      const query = 'mutation { requestUserAccess(input: { email: "test@example.com" }) { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "sendPasswordResetEmail" mutation', () => {
      const query = 'mutation { sendPasswordResetEmail(email: "test@example.com") }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "verifyUserPasswordResetToken" query', () => {
      const query = 'query { verifyUserPasswordResetToken(token: "abc123") }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "updateUserPassword" mutation', () => {
      const query = 'mutation { updateUserPassword(username: "test", password: "newpass", token: "abc") }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "addStripeCustomer" mutation', () => {
      const query = 'mutation { addStripeCustomer(input: {}) { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "sendInvestorMail" mutation', () => {
      const query = 'mutation { sendInvestorMail(email: "test@example.com") }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "popPrediction" query', () => {
      const query = 'query { popPrediction { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should return false for "topPosts" query', () => {
      const query = 'query { topPosts { id } }';
      expect(requireAuth(query)).toBe(false);
    });
  });

  describe('Protected queries (should return true)', () => {
    // Note: "addPost" contains "post" (public), so it's treated as public
    // "deletePost" contains "post" (public), so it's treated as public
    // "followUser" contains "user" (public), so it's treated as public
    // This is the current behavior using substring matching

    it('should return true for "createMessage" mutation', () => {
      const query = 'mutation { createMessage(message: {}) { id } }';
      expect(requireAuth(query)).toBe(true);
    });

    it('should return true for "notifications" query', () => {
      const query = 'query { notifications { id } }';
      expect(requireAuth(query)).toBe(true);
    });

    it('should return true for "buddyList" query', () => {
      const query = 'query { buddyList { id } }';
      expect(requireAuth(query)).toBe(true);
    });

    it('should return true for "addComment" mutation', () => {
      const query = 'mutation { addComment(comment: {}) { id } }';
      expect(requireAuth(query)).toBe(true);
    });

    it('should return true for "addVote" mutation', () => {
      const query = 'mutation { addVote(vote: {}) { id } }';
      expect(requireAuth(query)).toBe(true);
    });

    it('should return true for "updateProfile" mutation', () => {
      const query = 'mutation { updateProfile(input: {}) { id } }';
      expect(requireAuth(query)).toBe(true);
    });

    it('should return true for complex query with only protected operations', () => {
      const query = `
        query {
          notifications { id }
          buddyList { id }
        }
      `;
      // Should require auth because it contains only protected queries
      expect(requireAuth(query)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should return true for null query', () => {
      expect(requireAuth(null)).toBe(true);
    });

    it('should return true for undefined query', () => {
      expect(requireAuth(undefined)).toBe(true);
    });

    it('should return true for empty string query', () => {
      expect(requireAuth('')).toBe(true);
    });

    it('should return true for query with only whitespace', () => {
      expect(requireAuth('   ')).toBe(true);
    });

    it('should handle query with public query name as substring (case-sensitive)', () => {
      // "posts" (lowercase) is NOT a substring of "addPosts" (capital P), so it requires auth
      // The matching is case-sensitive
      const query = 'query { addPosts { id } }';
      // This does NOT match "posts" (lowercase) as substring, so it returns true (requires auth)
      expect(requireAuth(query)).toBe(true);
    });

    it('should handle query with public query name as exact substring match', () => {
      // "post" is a substring of "addPost", so it will match and return false (public)
      const query = 'mutation { addPost(post: {}) { id } }';
      // This matches "post" as substring, so it returns false (public)
      expect(requireAuth(query)).toBe(false);
    });

    it('should handle query without public query name as substring', () => {
      // "addComment" doesn't contain any public query names, so it requires auth
      const query = 'query { addComment { id } }';
      expect(requireAuth(query)).toBe(true);
    });

    it('should handle query with case sensitivity', () => {
      // Current implementation uses includes(), so it's case-sensitive
      const query = 'query { POSTS { id } }';
      expect(requireAuth(query)).toBe(true);
    });

    it('should handle query with multiple public queries', () => {
      const query = 'query { posts { id } featuredPosts { id } }';
      expect(requireAuth(query)).toBe(false);
    });
  });

  describe('Query string variations', () => {
    it('should handle query with variables', () => {
      const query = 'query GetPosts($limit: Int) { posts(limit: $limit) { id } }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should handle query with fragments', () => {
      const query = `
        query {
          posts {
            ...PostFields
          }
        }
        fragment PostFields on Post {
          id
          title
        }
      `;
      expect(requireAuth(query)).toBe(false);
    });

    it('should handle mutation with variables', () => {
      const query = 'mutation CheckEmail($email: String!) { checkDuplicateEmail(email: $email) }';
      expect(requireAuth(query)).toBe(false);
    });

    it('should handle query with aliases', () => {
      const query = 'query { allPosts: posts { id } }';
      expect(requireAuth(query)).toBe(false);
    });
  });
});
