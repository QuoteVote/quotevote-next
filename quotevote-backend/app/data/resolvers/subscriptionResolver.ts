import { GraphQLError } from 'graphql';
import type * as Common from '~/types/common';
import { assertRoomAccess } from '~/data/utils/roomAccess';
import { NOTIFICATION_CREATED } from '~/data/utils/constants';
import { SUBSCRIPTION_EVENTS, type GraphQLContext, type TypingPayload } from '~/types/graphql';

type SubscriptionArgs = {
  messageRoomId: string;
};

type PresenceArgs = {
  userId?: string | null;
};

type SubscriptionPayload = {
  message?: Common.Message;
  presence?: {
    userId: string;
    status: Common.PresenceStatus;
    statusMessage?: string;
    lastSeen?: Date | string | number | null;
  };
  typing?: TypingPayload;
  notification?: Common.Notification;
};

function requireAuthenticated(context: GraphQLContext): void {
  if (!context.userId) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

async function assertRoomSubscriptionAccess(
  context: GraphQLContext,
  messageRoomId: string
): Promise<void> {
  requireAuthenticated(context);
  const room = await context.prisma.messageRoom.findUnique({
    where: { id: messageRoomId },
    select: { messageType: true, userIds: true },
  });
  assertRoomAccess(room, context.userId);
}

function matchesRoom(payload: SubscriptionPayload, variables: SubscriptionArgs): boolean {
  return (
    payload.message?.messageRoomId === variables.messageRoomId ||
    payload.typing?.messageRoomId === variables.messageRoomId
  );
}

function matchesPresence(payload: SubscriptionPayload, variables: PresenceArgs): boolean {
  return !variables.userId || payload.presence?.userId === variables.userId;
}

function filterIterator<T>(
  iterator: AsyncIterator<T>,
  predicate: (payload: T) => boolean
): AsyncIterableIterator<T> {
  return {
    next: async (): Promise<IteratorResult<T>> => {
      while (true) {
        const result = await iterator.next();
        if (result.done || predicate(result.value)) return result;
      }
    },
    return: async (value?: unknown): Promise<IteratorResult<T>> => {
      if (iterator.return) return iterator.return(value);
      return { done: true, value: value as T };
    },
    throw: async (error?: unknown): Promise<IteratorResult<T>> => {
      if (iterator.throw) return iterator.throw(error);
      throw error;
    },
    [Symbol.asyncIterator](): AsyncIterableIterator<T> {
      return this;
    },
  };
}

export const subscriptionResolver = {
  Subscription: {
    message: {
      subscribe: async (
        _parent: unknown,
        args: SubscriptionArgs,
        context: GraphQLContext
      ): Promise<AsyncIterator<SubscriptionPayload>> => {
        await assertRoomSubscriptionAccess(context, args.messageRoomId);
        return filterIterator(
          context.pubsub.asyncIterableIterator<SubscriptionPayload>(
            SUBSCRIPTION_EVENTS.MESSAGE_CREATED
          ),
          (payload) => matchesRoom(payload, args)
        );
      },
      resolve: (payload: SubscriptionPayload): Common.Message | undefined => payload.message,
    },
    presence: {
      subscribe: (
        _parent: unknown,
        _args: PresenceArgs,
        context: GraphQLContext
      ): AsyncIterator<SubscriptionPayload> => {
        requireAuthenticated(context);
        return filterIterator(
          context.pubsub.asyncIterableIterator<SubscriptionPayload>(
            SUBSCRIPTION_EVENTS.PRESENCE_UPDATED
          ),
          (payload) => matchesPresence(payload, _args)
        );
      },
      resolve: (payload: SubscriptionPayload) => payload.presence,
    },
    notification: {
      subscribe: (
        _parent: unknown,
        args: { userId: string },
        context: GraphQLContext
      ): AsyncIterableIterator<SubscriptionPayload> => {
        requireAuthenticated(context);
        if (args.userId !== context.userId) {
          throw new GraphQLError("Cannot subscribe to another user's notifications", {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        return filterIterator(
          context.pubsub.asyncIterableIterator<SubscriptionPayload>(NOTIFICATION_CREATED),
          (payload) => payload.notification?.userId === args.userId
        );
      },
      resolve: (payload: SubscriptionPayload): Common.Notification | undefined =>
        payload.notification,
    },
    typing: {
      subscribe: async (
        _parent: unknown,
        args: SubscriptionArgs,
        context: GraphQLContext
      ): Promise<AsyncIterator<SubscriptionPayload>> => {
        await assertRoomSubscriptionAccess(context, args.messageRoomId);
        return filterIterator(
          context.pubsub.asyncIterableIterator<SubscriptionPayload>(
            SUBSCRIPTION_EVENTS.TYPING_UPDATED
          ),
          (payload) => matchesRoom(payload, args)
        );
      },
      resolve: (payload: SubscriptionPayload): TypingPayload | undefined => payload.typing,
    },
  },
};
