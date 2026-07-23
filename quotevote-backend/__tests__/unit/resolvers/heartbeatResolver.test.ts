import { GraphQLError } from 'graphql';
import { heartbeatResolver } from '~/data/resolvers/heartbeatResolver';
import Presence from '~/data/models/Presence';
import { pubsub } from '~/data/utils/pubsub';
import { SUBSCRIPTION_EVENTS } from '~/types/graphql';
import type { GraphQLContext } from '~/types/graphql';

jest.mock('~/data/models/Presence');
jest.mock('~/data/utils/pubsub', () => ({
  pubsub: {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    asyncIterableIterator: jest.fn(),
  },
}));

const actorId = '60d5ec49ad414d7a8d5464a0';

function mockContext(overrides: Partial<NonNullable<GraphQLContext['user']>> = {}): GraphQLContext {
  return {
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user: {
      _id: actorId,
      username: 'alice',
      email: 'alice@example.com',
      admin: false,
      ...overrides,
    } as NonNullable<GraphQLContext['user']>,
  };
}

describe('heartbeatResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation.heartbeat', () => {
    it('requires authentication', async () => {
      await expect(
        heartbeatResolver.Mutation.heartbeat(null, {}, { ...mockContext(), user: null })
      ).rejects.toThrow(GraphQLError);
    });

    it('updates heartbeat and returns success', async () => {
      (Presence.updateHeartbeat as jest.Mock).mockResolvedValue({
        lastHeartbeat: new Date('2024-01-15T12:00:00.000Z'),
        status: 'away',
        statusMessage: 'In a meeting',
      });

      const result = await heartbeatResolver.Mutation.heartbeat(null, {}, mockContext());

      expect(Presence.updateHeartbeat).toHaveBeenCalledWith(actorId);
      expect(result).toEqual({
        success: true,
        timestamp: '2024-01-15T12:00:00.000Z',
        status: 'away',
        statusMessage: 'In a meeting',
      });
    });
  });

  describe('Mutation.updatePresence', () => {
    it('requires authentication', async () => {
      await expect(
        heartbeatResolver.Mutation.updatePresence(
          null,
          { presence: { status: 'away', statusMessage: 'BRB' } },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('rejects invalid status', async () => {
      await expect(
        heartbeatResolver.Mutation.updatePresence(
          null,
          { presence: { status: 'busy' } },
          mockContext()
        )
      ).rejects.toThrow(/status must be one of/);
      expect(Presence.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('upserts presence and publishes update', async () => {
      const now = new Date('2024-01-15T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      (Presence.findOneAndUpdate as jest.Mock).mockResolvedValue({
        _id: { toString: () => 'presence-1' },
        userId: { toString: () => actorId },
        status: 'away',
        statusMessage: 'In a meeting',
        preferredStatus: 'away',
        preferredStatusMessage: 'In a meeting',
        lastHeartbeat: now,
        lastSeen: now,
      });

      const result = await heartbeatResolver.Mutation.updatePresence(
        null,
        { presence: { status: 'away', statusMessage: '  In a meeting  ' } },
        mockContext()
      );

      expect(Presence.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: actorId },
        {
          $set: {
            status: 'away',
            statusMessage: 'In a meeting',
            preferredStatus: 'away',
            preferredStatusMessage: 'In a meeting',
            lastHeartbeat: now,
            lastSeen: now,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      expect(pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.PRESENCE_UPDATED, {
        presence: {
          userId: actorId,
          status: 'away',
          statusMessage: 'In a meeting',
          lastSeen: now,
        },
      });
      expect(result).toEqual({
        _id: 'presence-1',
        userId: actorId,
        status: 'away',
        statusMessage: 'In a meeting',
        lastHeartbeat: now,
        lastSeen: now,
      });

      jest.useRealTimers();
    });

    it('truncates status messages over 200 characters', async () => {
      const longMessage = 'x'.repeat(250);
      (Presence.findOneAndUpdate as jest.Mock).mockResolvedValue({
        _id: { toString: () => 'presence-1' },
        userId: { toString: () => actorId },
        status: 'online',
        statusMessage: 'x'.repeat(200),
        lastHeartbeat: new Date(),
        lastSeen: new Date(),
      });

      await heartbeatResolver.Mutation.updatePresence(
        null,
        { presence: { status: 'online', statusMessage: longMessage } },
        mockContext()
      );

      const updateArg = (Presence.findOneAndUpdate as jest.Mock).mock.calls[0][1] as {
        $set: { statusMessage: string };
      };
      expect(updateArg.$set.statusMessage).toHaveLength(200);
    });
  });
});
