import type { PubSub } from '../../types/graphql';

// Temporary NoOp PubSub until real implementation
export const pubsub: PubSub = {
  publish: async () => { },
  subscribe: async () => 0,
  unsubscribe: () => { },
  asyncIterableIterator: <T>() => {
    const emptyIterator = (async function* () { })();
    return emptyIterator as AsyncIterableIterator<T>;
  }
};
