import { checkRateLimit, resetRateLimit, rateLimitMap } from '~/data/utils/rateLimiter';
import type { AuthenticatedRequest } from '~/types/express';

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
});
