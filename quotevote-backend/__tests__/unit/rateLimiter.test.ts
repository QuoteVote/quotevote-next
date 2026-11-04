import {
  RATE_LIMIT_COLLECTION,
  checkRateLimit,
  resetExpiryIndexState,
  resetRateLimit,
} from '~/data/utils/rateLimiter';
import { logger } from '~/data/utils/logger';
import type { AuthenticatedRequest } from '~/types/express';
import type { GraphQLContext } from '~/types/graphql';
import { createRateLimitStore, type RateLimitStore } from '../helpers/rateLimitStore';

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockRequest = (userId: string): AuthenticatedRequest =>
  ({ user: { _id: userId } }) as AuthenticatedRequest;

describe('rateLimiter', () => {
  let store: RateLimitStore;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetExpiryIndexState();
    store = createRateLimitStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests within the limit and stores the count by user and action', async () => {
    await expect(checkRateLimit(store, mockRequest('user1'), 'testAction')).resolves.toBe(true);
    expect(store.docs.get('user1:testAction')?.count).toBe(1);
  });

  it('throws once the limit is exceeded', async () => {
    const req = mockRequest('user2');
    for (let i = 0; i < 5; i += 1) {
      await expect(checkRateLimit(store, req, 'testAction', 5)).resolves.toBe(true);
    }

    await expect(checkRateLimit(store, req, 'testAction', 5)).rejects.toThrow(
      'Rate limit exceeded for testAction. Please try again in 60 seconds.'
    );
  });

  it('starts a new window once the old one has passed', async () => {
    const req = mockRequest('user3');
    await checkRateLimit(store, req, 'testAction', 2, 10000);
    await checkRateLimit(store, req, 'testAction', 2, 10000);
    await expect(checkRateLimit(store, req, 'testAction', 2, 10000)).rejects.toThrow();

    jest.advanceTimersByTime(10000);

    await expect(checkRateLimit(store, req, 'testAction', 2, 10000)).resolves.toBe(true);
    expect(store.docs.get('user3:testAction')?.count).toBe(1);
  });

  it('shares counts between instances that use the same database', async () => {
    const otherInstance = { $runCommandRaw: store.$runCommandRaw };
    await checkRateLimit(store, 'shared', 'testAction', 1);

    await expect(checkRateLimit(otherInstance, 'shared', 'testAction', 1)).rejects.toThrow();
  });

  it('counts with one atomic upsert per check', async () => {
    jest.setSystemTime(new Date('2026-11-02T10:00:00.000Z'));

    await checkRateLimit(store, 'user5', 'testAction', 3, 60000);

    expect(store.$runCommandRaw).toHaveBeenLastCalledWith({
      findAndModify: RATE_LIMIT_COLLECTION,
      query: { _id: 'user5:testAction' },
      update: [
        {
          $set: {
            count: {
              $cond: [
                { $gt: ['$resetAt', { $date: '2026-11-02T10:00:00.000Z' }] },
                { $add: ['$count', 1] },
                1,
              ],
            },
            resetAt: {
              $cond: [
                { $gt: ['$resetAt', { $date: '2026-11-02T10:00:00.000Z' }] },
                '$resetAt',
                { $date: '2026-11-02T10:01:00.000Z' },
              ],
            },
          },
        },
      ],
      upsert: true,
      new: true,
    });
  });

  it('creates the expiry index once per process', async () => {
    await checkRateLimit(store, 'user6', 'a');
    await checkRateLimit(store, 'user6', 'b');

    const indexCalls = store.$runCommandRaw.mock.calls.filter(([c]) => 'createIndexes' in c);
    expect(indexCalls).toEqual([
      [
        {
          createIndexes: RATE_LIMIT_COLLECTION,
          indexes: [{ key: { resetAt: 1 }, name: 'resetAt_expiry', expireAfterSeconds: 0 }],
        },
      ],
    ]);
  });

  it('retries the expiry index after a failure and still counts', async () => {
    store.$runCommandRaw.mockRejectedValueOnce(new Error('not primary'));

    await expect(checkRateLimit(store, 'user7', 'a')).resolves.toBe(true);
    await checkRateLimit(store, 'user7', 'a');

    expect(logger.warn).toHaveBeenCalledWith(
      'Rate limit expiry index was not created',
      expect.objectContaining({ error: 'not primary' })
    );
    expect(store.$runCommandRaw.mock.calls.filter(([c]) => 'createIndexes' in c)).toHaveLength(2);
    expect(store.docs.get('user7:a')?.count).toBe(2);
  });

  it('lets the request through and logs when the count cannot be read', async () => {
    await checkRateLimit(store, 'user8', 'a');
    store.$runCommandRaw.mockRejectedValueOnce(new Error('db down'));

    await expect(checkRateLimit(store, 'user8', 'a', 1)).resolves.toBe(true);
    expect(logger.error).toHaveBeenCalledWith(
      'Rate limit check failed',
      expect.objectContaining({ action: 'a', error: 'db down' })
    );
  });

  it('resets the count for a user and action', async () => {
    const req = mockRequest('user4');
    await checkRateLimit(store, req, 'testAction', 1);
    await expect(checkRateLimit(store, req, 'testAction', 1)).rejects.toThrow();

    await resetRateLimit(store, req, 'testAction');

    await expect(checkRateLimit(store, req, 'testAction', 1)).resolves.toBe(true);
  });

  describe('edge cases', () => {
    it('skips the check without a user', async () => {
      const req = { user: {} } as unknown as AuthenticatedRequest;
      await expect(checkRateLimit(store, req, 'action')).resolves.toBe(true);
      await expect(
        checkRateLimit(store, null as unknown as AuthenticatedRequest, 'action')
      ).resolves.toBe(true);
      expect(store.$runCommandRaw).not.toHaveBeenCalled();
    });

    it('skips the reset without a user', async () => {
      await resetRateLimit(store, null as unknown as AuthenticatedRequest, 'action');
      await resetRateLimit(store, { user: {} } as unknown as AuthenticatedRequest, 'action');
      expect(store.$runCommandRaw).not.toHaveBeenCalled();
    });

    it('accepts a GraphQL context', async () => {
      const ctx = { user: { _id: 'gqlUser1' } } as unknown as Pick<GraphQLContext, 'user'>;
      await expect(checkRateLimit(store, ctx, 'gqlAction')).resolves.toBe(true);
      expect(store.docs.has('gqlUser1:gqlAction')).toBe(true);
    });
  });
});
