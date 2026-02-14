/**
 * Test suite for the system's PubSub utility.
 */

import { pubsub } from '~/data/utils/pubsub';

/**
 * PubSub Utility Tests.
 */
describe('pubsub utility (NoOp)', () => {
  it('should have a publish method that resolves', async () => {
    await expect(pubsub.publish('TEST_EVENT', { data: 'test' })).resolves.toBeUndefined();
  });

  it('should have a subscribe method that returns 0', async () => {
    const result = await pubsub.subscribe('TEST_EVENT', () => {});
    expect(result).toBe(0);
  });

  it('should have an unsubscribe method that does nothing', () => {
    expect(() => pubsub.unsubscribe(0)).not.toThrow();
  });

  it('should have an asyncIterableIterator method that returns an empty iterator', async () => {
    const iterator = pubsub.asyncIterableIterator<string>(['TEST_EVENT']);
    expect(iterator).toBeDefined();
    expect(typeof iterator.next).toBe('function');
    
    const result = await iterator.next();
    expect(result.done).toBe(true);
    expect(result.value).toBeUndefined();
  });

  it('should handle return and throw on the iterator', async () => {
    const iterator = pubsub.asyncIterableIterator<string>(['TEST_EVENT']);
    
    if (iterator.return) {
      const returnResult = await iterator.return();
      expect(returnResult.done).toBe(true);
    }
    
    if (iterator.throw) {
      await expect(iterator.throw(new Error('test'))).rejects.toThrow('test');
    }
  });
});
