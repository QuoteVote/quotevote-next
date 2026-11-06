import { GraphQLError } from 'graphql';
import { PRESENCE_RECORD_SELECT, heartbeatResolver } from '~/data/resolvers/heartbeatResolver';
import { pubsub } from '~/data/utils/pubsub';
import { SUBSCRIPTION_EVENTS } from '~/types/graphql';
import type { GraphQLContext } from '~/types/graphql';

jest.mock('~/data/utils/pubsub', () => ({
  pubsub: {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    asyncIterableIterator: jest.fn(),
  },
}));

const actorId = '60d5ec49ad414d7a8d5464a0';
const presenceId = '60d5ec49ad414d7a8d5464a1';
const now = new Date('2024-01-15T12:00:00.000Z');

function presenceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: presenceId,
    userId: actorId,
    status: 'online',
    statusMessage: null,
    preferredStatus: 'online',
    preferredStatusMessage: '',
    lastHeartbeat: now,
    lastSeen: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mockContext(
  options: {
    user?: GraphQLContext['user'];
    presence?: Record<string, jest.Mock>;
  } = {}
): GraphQLContext {
  const user =
    options.user === undefined
      ? ({
          _id: actorId,
          username: 'alice',
          email: 'alice@example.com',
          admin: false,
        } as NonNullable<GraphQLContext['user']>)
      : options.user;

  return {
    prisma: {
      presence: {
        findUnique: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
        ...options.presence,
      },
    } as unknown as GraphQLContext['prisma'],
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id?.toString() ?? null,
    requestId: 'test-request-id',
  };
}

describe('heartbeatResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Mutation.heartbeat', () => {
    it('requires authentication', async () => {
      await expect(
        heartbeatResolver.Mutation.heartbeat(null, {}, mockContext({ user: null }))
      ).rejects.toThrow(GraphQLError);
    });

    it('creates an online presence with preferred defaults on the first heartbeat', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const upsert = jest.fn().mockResolvedValue(presenceRecord());
      const context = mockContext({ presence: { findUnique, upsert } });

      const result = await heartbeatResolver.Mutation.heartbeat(null, {}, context);

      expect(findUnique).toHaveBeenCalledWith({
        where: { userId: actorId },
        select: PRESENCE_RECORD_SELECT,
      });
      expect(upsert).toHaveBeenCalledWith({
        where: { userId: actorId },
        select: PRESENCE_RECORD_SELECT,
        create: {
          userId: actorId,
          status: 'online',
          preferredStatus: 'online',
          preferredStatusMessage: '',
          lastHeartbeat: now,
          lastSeen: now,
        },
        update: { lastHeartbeat: now, lastSeen: now },
      });
      expect(result).toEqual({
        success: true,
        timestamp: now.toISOString(),
        status: 'online',
        statusMessage: '',
      });
      expect('roster' in (context.prisma as unknown as Record<string, unknown>)).toBe(false);
    });

    it.each(['away', 'dnd', 'invisible'] as const)(
      'preserves an existing %s status while refreshing timestamps',
      async (status) => {
        const existing = presenceRecord({ status, statusMessage: 'Busy' });
        const findUnique = jest.fn().mockResolvedValue(existing);
        const update = jest.fn().mockResolvedValue(existing);

        const result = await heartbeatResolver.Mutation.heartbeat(
          null,
          {},
          mockContext({ presence: { findUnique, update } })
        );

        expect(update).toHaveBeenCalledWith({
          where: { userId: actorId },
          select: PRESENCE_RECORD_SELECT,
          data: { lastHeartbeat: now, lastSeen: now },
        });
        expect(result.status).toBe(status);
        expect(result.statusMessage).toBe('Busy');
      }
    );

    it('restores preferred status and message when stale cleanup marked presence offline', async () => {
      const existing = presenceRecord({
        status: 'offline',
        statusMessage: '',
        preferredStatus: 'dnd',
        preferredStatusMessage: 'Focusing',
      });
      const restored = presenceRecord({
        status: 'dnd',
        statusMessage: 'Focusing',
        preferredStatus: 'dnd',
        preferredStatusMessage: 'Focusing',
      });
      const update = jest.fn().mockResolvedValue(restored);

      const result = await heartbeatResolver.Mutation.heartbeat(
        null,
        {},
        mockContext({
          presence: { findUnique: jest.fn().mockResolvedValue(existing), update },
        })
      );

      expect(update).toHaveBeenCalledWith({
        where: { userId: actorId },
        select: PRESENCE_RECORD_SELECT,
        data: {
          lastHeartbeat: now,
          lastSeen: now,
          status: 'dnd',
          statusMessage: 'Focusing',
        },
      });
      expect(result).toEqual({
        success: true,
        timestamp: now.toISOString(),
        status: 'dnd',
        statusMessage: 'Focusing',
      });
    });

    it.each([null, 'offline'])(
      'falls back to online when the preferred status is %s',
      async (preferredStatus) => {
        const existing = presenceRecord({ status: 'offline', preferredStatus });
        const update = jest
          .fn()
          .mockResolvedValue(presenceRecord({ status: 'online', preferredStatus }));

        await heartbeatResolver.Mutation.heartbeat(
          null,
          {},
          mockContext({
            presence: { findUnique: jest.fn().mockResolvedValue(existing), update },
          })
        );

        expect(update).toHaveBeenCalledWith({
          where: { userId: actorId },
          select: PRESENCE_RECORD_SELECT,
          data: expect.objectContaining({ status: 'online' }),
        });
      }
    );
  });

  describe('Mutation.updatePresence', () => {
    it('requires authentication', async () => {
      await expect(
        heartbeatResolver.Mutation.updatePresence(
          null,
          { presence: { status: 'away', statusMessage: 'BRB' } },
          mockContext({ user: null })
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('rejects invalid status', async () => {
      const upsert = jest.fn();
      await expect(
        heartbeatResolver.Mutation.updatePresence(
          null,
          { presence: { status: 'busy' } },
          mockContext({ presence: { upsert } })
        )
      ).rejects.toThrow(/status must be one of/);
      expect(upsert).not.toHaveBeenCalled();
    });

    it('upserts presence and publishes update', async () => {
      const upsert = jest.fn().mockResolvedValue(
        presenceRecord({
          status: 'away',
          statusMessage: 'In a meeting',
          preferredStatus: 'away',
          preferredStatusMessage: 'In a meeting',
        })
      );

      const result = await heartbeatResolver.Mutation.updatePresence(
        null,
        { presence: { status: 'away', statusMessage: '  In a meeting  ' } },
        mockContext({ presence: { upsert } })
      );

      const data = {
        status: 'away',
        statusMessage: 'In a meeting',
        preferredStatus: 'away',
        preferredStatusMessage: 'In a meeting',
        lastHeartbeat: now,
        lastSeen: now,
      };
      expect(upsert).toHaveBeenCalledWith({
        where: { userId: actorId },
        select: PRESENCE_RECORD_SELECT,
        create: { userId: actorId, ...data },
        update: data,
      });
      expect(pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.PRESENCE_UPDATED, {
        presence: {
          userId: actorId,
          status: 'away',
          statusMessage: 'In a meeting',
          lastSeen: now,
        },
      });
      expect(result).toEqual({
        _id: presenceId,
        userId: actorId,
        status: 'away',
        statusMessage: 'In a meeting',
        lastHeartbeat: now,
        lastSeen: now,
      });
    });

    it('stores online as the preferred status when explicitly going offline', async () => {
      const upsert = jest.fn().mockResolvedValue(
        presenceRecord({
          status: 'offline',
          statusMessage: 'Signing off',
          preferredStatus: 'online',
          preferredStatusMessage: 'Signing off',
        })
      );

      await heartbeatResolver.Mutation.updatePresence(
        null,
        { presence: { status: 'offline', statusMessage: '  Signing off  ' } },
        mockContext({ presence: { upsert } })
      );

      expect(upsert).toHaveBeenCalledWith({
        where: { userId: actorId },
        select: PRESENCE_RECORD_SELECT,
        create: expect.objectContaining({
          status: 'offline',
          preferredStatus: 'online',
          preferredStatusMessage: 'Signing off',
        }),
        update: expect.objectContaining({
          status: 'offline',
          preferredStatus: 'online',
          preferredStatusMessage: 'Signing off',
        }),
      });
    });

    it('truncates status messages over 200 characters', async () => {
      const longMessage = 'x'.repeat(250);
      const upsert = jest
        .fn()
        .mockResolvedValue(presenceRecord({ statusMessage: 'x'.repeat(200) }));

      await heartbeatResolver.Mutation.updatePresence(
        null,
        { presence: { status: 'online', statusMessage: longMessage } },
        mockContext({ presence: { upsert } })
      );

      expect(upsert.mock.calls[0][0].update.statusMessage).toHaveLength(200);
    });
  });
});
