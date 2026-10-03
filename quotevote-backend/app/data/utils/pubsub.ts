import type { PubSub } from '../../types/graphql';

type Listener = (payload: unknown) => void;

class InMemoryPubSub implements PubSub {
  private readonly listeners = new Map<string, Map<number, Listener>>();
  private nextSubscriptionId = 1;

  async publish(triggerName: string, payload: unknown): Promise<void> {
    const triggerListeners = this.listeners.get(triggerName);
    if (!triggerListeners) return;

    for (const listener of triggerListeners.values()) {
      listener(payload);
    }
  }

  async subscribe(triggerName: string, onMessage: Listener): Promise<number> {
    const triggerListeners = this.listeners.get(triggerName) ?? new Map<number, Listener>();
    const subscriptionId = this.nextSubscriptionId++;
    triggerListeners.set(subscriptionId, onMessage);
    this.listeners.set(triggerName, triggerListeners);
    return subscriptionId;
  }

  unsubscribe(subscriptionId: number): void {
    for (const [triggerName, triggerListeners] of this.listeners) {
      if (!triggerListeners.delete(subscriptionId)) continue;
      if (triggerListeners.size === 0) this.listeners.delete(triggerName);
      return;
    }
  }

  asyncIterableIterator<T>(triggers: string | string[]): AsyncIterableIterator<T> {
    const triggerNames = Array.isArray(triggers) ? triggers : [triggers];
    const queue: T[] = [];
    const pending: Array<{
      resolve: (result: IteratorResult<T>) => void;
      reject: (error: unknown) => void;
    }> = [];
    let closed = false;

    const push = (payload: unknown): void => {
      if (closed) return;
      const result = { done: false, value: payload as T };
      const waiter = pending.shift();
      if (waiter) {
        waiter.resolve(result);
      } else {
        queue.push(result.value);
      }
    };

    const subscriptionIds = triggerNames.map((triggerName) => {
      const triggerListeners = this.listeners.get(triggerName) ?? new Map<number, Listener>();
      const subscriptionId = this.nextSubscriptionId++;
      triggerListeners.set(subscriptionId, push);
      this.listeners.set(triggerName, triggerListeners);
      return subscriptionId;
    });

    const close = (): IteratorResult<T> => {
      if (closed) return { done: true, value: undefined as never };
      closed = true;
      subscriptionIds.forEach((subscriptionId) => this.unsubscribe(subscriptionId));
      while (pending.length > 0) {
        pending.shift()?.resolve({ done: true, value: undefined as never });
      }
      return { done: true, value: undefined as never };
    };

    return {
      next: async (): Promise<IteratorResult<T>> => {
        if (queue.length > 0) {
          return { done: false, value: queue.shift() as T };
        }
        if (closed) return { done: true, value: undefined as never };
        return new Promise<IteratorResult<T>>((resolve, reject) => {
          pending.push({ resolve, reject });
        });
      },
      return: async (): Promise<IteratorResult<T>> => close(),
      throw: async (error?: unknown): Promise<IteratorResult<T>> => {
        close();
        throw error;
      },
      [Symbol.asyncIterator](): AsyncIterableIterator<T> {
        return this;
      },
    };
  }
}

export const pubsub: PubSub = new InMemoryPubSub();
