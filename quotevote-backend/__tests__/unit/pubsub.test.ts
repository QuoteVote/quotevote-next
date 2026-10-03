/**
 * Test suite for the system's PubSub utility.
 */

import { pubsub } from '~/data/utils/pubsub';

/**
 * PubSub Utility Tests.
 */
describe('pubsub utility', () => {
  it('delivers published events to an async iterator', async () => {
    const iterator = pubsub.asyncIterableIterator<{ data: string }>('TEST_EVENT');

    await pubsub.publish('TEST_EVENT', { data: 'test' });

    await expect(iterator.next()).resolves.toEqual({
      done: false,
      value: { data: 'test' },
    });
    await iterator.return?.();
  });

  it('delivers an event to multiple subscribers', async () => {
    const first = pubsub.asyncIterableIterator<{ value: number }>('TEST_EVENT');
    const second = pubsub.asyncIterableIterator<{ value: number }>('TEST_EVENT');

    await pubsub.publish('TEST_EVENT', { value: 1 });

    await expect(first.next()).resolves.toEqual({ done: false, value: { value: 1 } });
    await expect(second.next()).resolves.toEqual({ done: false, value: { value: 1 } });
    await first.return?.();
    await second.return?.();
  });

  it('stops delivery after an iterator is closed', async () => {
    const iterator = pubsub.asyncIterableIterator<{ value: number }>('TEST_EVENT');
    await iterator.return?.();

    await pubsub.publish('TEST_EVENT', { value: 1 });

    await expect(iterator.next()).resolves.toEqual({ done: true, value: undefined });
  });

  it('supports callback subscriptions and explicit unsubscribe', async () => {
    const callback = jest.fn();
    const subscriptionId = await pubsub.subscribe('TEST_EVENT', callback);

    await pubsub.publish('TEST_EVENT', { data: 'test' });
    expect(callback).toHaveBeenCalledWith({ data: 'test' });

    pubsub.unsubscribe(subscriptionId);
    await pubsub.publish('TEST_EVENT', { data: 'ignored' });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('supports return and throw on the iterator', async () => {
    const iterator = pubsub.asyncIterableIterator<string>('TEST_EVENT');

    await expect(iterator.return?.()).resolves.toEqual({ done: true, value: undefined });
    await expect(iterator.throw?.(new Error('test'))).rejects.toThrow('test');
  });
});
