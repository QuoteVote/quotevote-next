import { checkRateLimit, resetRateLimit, rateLimitMap, cleanupRateLimitMap } from '~/data/utils/rateLimiter';
import type { AuthenticatedRequest } from '~/types/express';
import type { GraphQLContext } from '~/types/graphql';

// Mock request object
const mockRequest = (userId: string): AuthenticatedRequest => ({
  user: { _id: userId },
} as AuthenticatedRequest);

describe('rateLimiter', () => {
  beforeEach(() => {
    rateLimitMap.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow a user to make a request within the limit', () => {
    const req = mockRequest('user1');
    const result = checkRateLimit(req, 'testAction');
    expect(result).toBe(true);
  });

  it('should throw an error when the rate limit is exceeded', () => {
    const req = mockRequest('user2');
    const action = 'testAction';
    const limit = 5;

    // Make 5 requests, which should be allowed
    for (let i = 0; i < limit; i++) {
      expect(checkRateLimit(req, action, limit)).toBe(true);
    }

    // The 6th request should throw an error
    expect(() => checkRateLimit(req, action, limit)).toThrow(
      'Rate limit exceeded for testAction. Please try again in 60 seconds.'
    );
  });

  it('should reset the rate limit after the window has passed', () => {
    const req = mockRequest('user3');
    const action = 'testAction';
    const limit = 2;
    const windowMs = 10000; // 10 seconds

    // Make 2 requests
    checkRateLimit(req, action, limit, windowMs);
    checkRateLimit(req, action, limit, windowMs);

    // The 3rd request should fail
    expect(() => checkRateLimit(req, action, limit, windowMs)).toThrow();

    // Advance time by 10 seconds
    jest.advanceTimersByTime(windowMs);

    // The 4th request should now be allowed
    expect(checkRateLimit(req, action, limit, windowMs)).toBe(true);
  });

  it('should reset the rate limit for a specific user and action', () => {
    const req = mockRequest('user4');
    const action = 'testAction';
    const limit = 1;

    // Make 1 request
    checkRateLimit(req, action, limit);

    // The 2nd request should fail
    expect(() => checkRateLimit(req, action, limit)).toThrow();

    // Reset the rate limit
    resetRateLimit(req, action);

    // The 3rd request should now be allowed
    expect(checkRateLimit(req, action, limit)).toBe(true);
  });

  describe('edge cases', () => {
    it('should bypass if userId is missing', () => {
      const req = { user: {} } as unknown as AuthenticatedRequest;
      expect(checkRateLimit(req, 'action')).toBe(true);
      // Hit line 30 branch
      expect(checkRateLimit(null as unknown as AuthenticatedRequest, 'action')).toBe(true);
    });

    it('should handle reset without userId', () => {
      // This now hits the 'if (!reqOrUserId) return;' line
      expect(() => resetRateLimit(null as unknown as AuthenticatedRequest, 'action')).not.toThrow();
    });

    it('should work with a string userId', () => {
      const userId = 'user-string-id';
      expect(checkRateLimit(userId, 'stringAction')).toBe(true);
      expect(rateLimitMap.has(`${userId}:stringAction`)).toBe(true);
    });

    it('should work with a GraphQL context object', () => {
      const gqlContext = {
        user: { _id: 'gqlUser1' }
      } as unknown as Pick<GraphQLContext, 'user'>;
      expect(checkRateLimit(gqlContext, 'gqlAction')).toBe(true);
      expect(rateLimitMap.has('gqlUser1:gqlAction')).toBe(true);
    });

    it('should handle reset with string userId', () => {
      const userId = 'reset-string-id';
      checkRateLimit(userId, 'resetAction');
      expect(rateLimitMap.has(`${userId}:resetAction`)).toBe(true);
      resetRateLimit(userId, 'resetAction');
      expect(rateLimitMap.has(`${userId}:resetAction`)).toBe(false);
    });
  });

  describe('cleanup interval', () => {
    it('should trigger the cleanup logic', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      // One expired, one not expired
      rateLimitMap.set('expired', { count: 1, resetAt: Date.now() - 1000 });
      rateLimitMap.set('recent', { count: 1, resetAt: Date.now() + 100000 });
      
      cleanupRateLimitMap();
      
      expect(rateLimitMap.has('expired')).toBe(false);
      expect(rateLimitMap.has('recent')).toBe(true);
      
      setIntervalSpy.mockRestore();
    });

    it('should manually clean up old entries for coverage', () => {
      const action = 'cleanupAction';
      const userId = 'userCleanup';
      const key = `${userId}:${action}`;
      
      rateLimitMap.set(key, { count: 1, resetAt: Date.now() - 1000 });
      
      cleanupRateLimitMap();
      
      expect(rateLimitMap.has(key)).toBe(false);
    });

    it('should cover resetRateLimit with truthy but non-userId object', () => {
      expect(() => resetRateLimit({ user: {} } as unknown as AuthenticatedRequest, 'action')).not.toThrow();
    });
  });
});
