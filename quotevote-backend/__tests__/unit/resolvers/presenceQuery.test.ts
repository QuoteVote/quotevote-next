import { heartbeatResolver } from '~/data/resolvers/heartbeatResolver';
import type { GraphQLContext } from '~/types/graphql';

const viewerId = '60d5ec49ad414d7a8d5464a0';
const otherId = '60d5ec49ad414d7a8d5464b0';
const presenceId = '60d5ec49ad414d7a8d5464a1';
const now = new Date('2026-01-15T12:00:00.000Z');

function presenceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: presenceId,
    userId: otherId,
    status: 'dnd',
    statusMessage: 'In a meeting',
    lastHeartbeat: new Date(now.getTime() - 30_000),
    lastSeen: now,
    ...overrides,
  };
}

function mockContext(
  options: { viewer?: string | null; presence?: unknown; blocks?: unknown[] } = {}
): GraphQLContext {
  const viewer = options.viewer === undefined ? viewerId : options.viewer;
  return {
    prisma: {
      presence: {
        findUnique: jest
          .fn()
          .mockResolvedValue(options.presence === undefined ? presenceRecord() : options.presence),
      },
      userBlock: {
        findMany: jest.fn().mockResolvedValue(options.blocks ?? []),
      },
    } as unknown as GraphQLContext['prisma'],
    user: viewer ? ({ _id: viewer } as unknown as GraphQLContext['user']) : null,
    userId: viewer,
    requestId: 'test-request-id',
  } as GraphQLContext;
}

const getPresence = (ctx: GraphQLContext, userId = otherId) =>
  heartbeatResolver.Query.getPresence(null, { userId }, ctx);

describe('heartbeatResolver Query.getPresence', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns another member's status and message", async () => {
    const ctx = mockContext();

    await expect(getPresence(ctx)).resolves.toMatchObject({
      _id: presenceId,
      userId: otherId,
      status: 'dnd',
      statusMessage: 'In a meeting',
    });
    expect(ctx.prisma.presence.findUnique).toHaveBeenCalledWith({
      where: { userId: otherId },
      select: expect.not.objectContaining({ createdAt: true }),
    });
  });

  it('returns offline with no message for a member who is invisible', async () => {
    const ctx = mockContext({ presence: presenceRecord({ status: 'invisible' }) });

    await expect(getPresence(ctx)).resolves.toMatchObject({
      status: 'offline',
      statusMessage: '',
    });
  });

  it('returns your own invisible status to you', async () => {
    const ctx = mockContext({
      presence: presenceRecord({ userId: viewerId, status: 'invisible' }),
    });

    await expect(getPresence(ctx, viewerId)).resolves.toMatchObject({ status: 'invisible' });
    expect(ctx.prisma.userBlock.findMany).not.toHaveBeenCalled();
  });

  it('returns offline when the last heartbeat is older than two minutes', async () => {
    const ctx = mockContext({
      presence: presenceRecord({ lastHeartbeat: new Date(now.getTime() - 121_000) }),
    });

    await expect(getPresence(ctx)).resolves.toMatchObject({
      status: 'offline',
      statusMessage: '',
    });
  });

  it('returns the default offline answer when there is no record', async () => {
    const ctx = mockContext({ presence: null });

    await expect(getPresence(ctx)).resolves.toEqual({
      userId: otherId,
      status: 'offline',
      statusMessage: '',
    });
  });

  it.each([
    ['the viewer blocked them', { blockerId: viewerId }],
    ['they blocked the viewer', { blockerId: otherId }],
  ])('hides presence when %s', async (_label, block) => {
    const ctx = mockContext({ blocks: [block] });

    await expect(getPresence(ctx)).resolves.toEqual({
      userId: otherId,
      status: 'offline',
      statusMessage: '',
    });
    expect(ctx.prisma.presence.findUnique).not.toHaveBeenCalled();
  });

  it('returns the default offline answer for an id that is not an ObjectId, without querying', async () => {
    const ctx = mockContext();

    await expect(getPresence(ctx, 'not-an-id')).resolves.toEqual({
      userId: 'not-an-id',
      status: 'offline',
      statusMessage: '',
    });
    expect(ctx.prisma.presence.findUnique).not.toHaveBeenCalled();
  });

  it('skips the block check when there is no viewer', async () => {
    const ctx = mockContext({ viewer: null });

    await expect(getPresence(ctx)).resolves.toMatchObject({ status: 'dnd' });
    expect(ctx.prisma.userBlock.findMany).not.toHaveBeenCalled();
  });
});
