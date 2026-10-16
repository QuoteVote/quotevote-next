import { Prisma } from '@prisma/client';
import { buddyResolver } from '~/data/resolvers/buddyResolver';
import { toPairKey } from '~/data/utils/rosterMigration';
import { BuddyUserType } from '~/data/types/Buddy';
import type { GraphQLContext } from '~/types/graphql';

const ME = '60d5ec49ad414d7a8d5464a0';
const OTHER = '60d5ec49ad414d7a8d5464a1';
const THIRD = '60d5ec49ad414d7a8d5464a2';
const REQ = '60d5ec49ad414d7a8d5464b0';

const user = (id: string) => ({ id, name: `n${id}`, username: `u${id}`, avatar: null });
const row = (over: Record<string, unknown> = {}) => ({
  id: REQ,
  status: 'pending',
  requesterId: ME,
  recipientId: OTHER,
  createdAt: new Date('2024-01-01'),
  acceptedAt: null,
  requester: user(ME),
  recipient: user(OTHER),
  ...over,
});

function mockContext(userId: string | null = ME) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: OTHER }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    userBlock: { findMany: jest.fn().mockResolvedValue([]) },
    buddyRelationship: {
      create: jest.fn().mockResolvedValue(row()),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUnique: jest.fn().mockResolvedValue(row({ status: 'accepted' })),
      findMany: jest.fn().mockResolvedValue([]),
    },
    presence: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return { prisma, context: { userId, prisma } as unknown as GraphQLContext };
}

const { addBuddy, acceptBuddy, declineBuddy, removeBuddy } = buddyResolver.Mutation;
const { getBuddyList, buddyRequests } = buddyResolver.Query;

const code = async (p: Promise<unknown>) =>
  p.then(
    () => 'none',
    (e) => (e as { extensions: { code: string } }).extensions.code
  );

describe('buddyResolver mutations', () => {
  it('addBuddy creates a pending row', async () => {
    const { prisma, context } = mockContext();
    const result = await addBuddy({}, { userId: OTHER }, context);
    const arg = prisma.buddyRelationship.create.mock.calls[0][0];
    expect(arg.data).toEqual({
      requesterId: ME,
      recipientId: OTHER,
      pairKey: toPairKey(ME, OTHER),
      status: 'pending',
    });
    expect(JSON.stringify(arg.include)).not.toContain('email');
    expect(result._id).toBe(REQ);
    expect(result.requester).toEqual({ _id: ME, name: `n${ME}`, username: `u${ME}`, avatar: null });
  });

  it('addBuddy rejects unauthenticated, self, invalid and unknown users', async () => {
    expect(await code(addBuddy({}, { userId: OTHER }, mockContext(null).context))).toBe(
      'UNAUTHENTICATED'
    );
    expect(await code(addBuddy({}, { userId: ME }, mockContext().context))).toBe('BAD_USER_INPUT');
    expect(await code(addBuddy({}, { userId: 'x' }, mockContext().context))).toBe('BAD_USER_INPUT');
    const m = mockContext();
    m.prisma.user.findUnique.mockResolvedValue(null);
    expect(await code(addBuddy({}, { userId: OTHER }, m.context))).toBe('BAD_USER_INPUT');
  });

  it.each([
    ['I block them', ME],
    ['they block me', OTHER],
  ])('addBuddy is FORBIDDEN when %s', async (_l, blocker) => {
    const m = mockContext();
    m.prisma.userBlock.findMany.mockResolvedValue([{ blockerId: blocker }]);
    expect(await code(addBuddy({}, { userId: OTHER }, m.context))).toBe('FORBIDDEN');
    expect(m.prisma.buddyRelationship.create).not.toHaveBeenCalled();
  });

  it('addBuddy maps P2002 to CONFLICT with one message, other errors rethrown', async () => {
    const m = mockContext();
    m.prisma.buddyRelationship.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' })
    );
    await expect(addBuddy({}, { userId: OTHER }, m.context)).rejects.toMatchObject({
      message: 'Buddy relationship or request already exists',
      extensions: { code: 'CONFLICT' },
    });
    m.prisma.buddyRelationship.create.mockRejectedValue(new Error('boom'));
    await expect(addBuddy({}, { userId: OTHER }, m.context)).rejects.toThrow('boom');
  });

  it('acceptBuddy updates only a pending request addressed to me', async () => {
    const { prisma, context } = mockContext();
    const result = await acceptBuddy({}, { requestId: REQ }, context);
    const arg = prisma.buddyRelationship.updateMany.mock.calls[0][0];
    expect(arg.where).toEqual({ id: REQ, recipientId: ME, status: 'pending' });
    expect(arg.data.status).toBe('accepted');
    expect(arg.data.acceptedAt).toBeInstanceOf(Date);
    expect(result.status).toBe('accepted');
  });

  it('acceptBuddy errors', async () => {
    expect(await code(acceptBuddy({}, { requestId: REQ }, mockContext(null).context))).toBe(
      'UNAUTHENTICATED'
    );
    expect(await code(acceptBuddy({}, { requestId: 'bad' }, mockContext().context))).toBe(
      'BAD_USER_INPUT'
    );
    const m = mockContext();
    m.prisma.buddyRelationship.updateMany.mockResolvedValue({ count: 0 });
    expect(await code(acceptBuddy({}, { requestId: REQ }, m.context))).toBe('NOT_FOUND');
    m.prisma.buddyRelationship.updateMany.mockResolvedValue({ count: 1 });
    m.prisma.buddyRelationship.findUnique.mockResolvedValue(null);
    expect(await code(acceptBuddy({}, { requestId: REQ }, m.context))).toBe('NOT_FOUND');
  });

  it('declineBuddy deletes only a pending request addressed to me', async () => {
    const { prisma, context } = mockContext();
    expect(await declineBuddy({}, { requestId: REQ }, context)).toEqual({
      _id: REQ,
      success: true,
    });
    expect(prisma.buddyRelationship.deleteMany).toHaveBeenCalledWith({
      where: { id: REQ, recipientId: ME, status: 'pending' },
    });
  });

  it('declineBuddy errors', async () => {
    expect(await code(declineBuddy({}, { requestId: REQ }, mockContext(null).context))).toBe(
      'UNAUTHENTICATED'
    );
    expect(await code(declineBuddy({}, { requestId: 'bad' }, mockContext().context))).toBe(
      'BAD_USER_INPUT'
    );
    const m = mockContext();
    m.prisma.buddyRelationship.deleteMany.mockResolvedValue({ count: 0 });
    expect(await code(declineBuddy({}, { requestId: REQ }, m.context))).toBe('NOT_FOUND');
  });

  it('removeBuddy deletes the accepted pair', async () => {
    const { prisma, context } = mockContext();
    expect(await removeBuddy({}, { userId: OTHER }, context)).toEqual({
      _id: OTHER,
      success: true,
    });
    expect(prisma.buddyRelationship.deleteMany).toHaveBeenCalledWith({
      where: { pairKey: toPairKey(ME, OTHER), status: 'accepted' },
    });
  });

  it('removeBuddy errors', async () => {
    expect(await code(removeBuddy({}, { userId: OTHER }, mockContext(null).context))).toBe(
      'UNAUTHENTICATED'
    );
    expect(await code(removeBuddy({}, { userId: ME }, mockContext().context))).toBe(
      'BAD_USER_INPUT'
    );
    const m = mockContext();
    m.prisma.buddyRelationship.deleteMany.mockResolvedValue({ count: 0 });
    expect(await code(removeBuddy({}, { userId: OTHER }, m.context))).toBe('NOT_FOUND');
  });
});

describe('buddyResolver queries', () => {
  const accepted = [
    { requesterId: ME, recipientId: OTHER },
    { requesterId: THIRD, recipientId: ME },
  ];

  it('getBuddyList requires auth', async () => {
    expect(await code(getBuddyList({}, {}, mockContext(null).context))).toBe('UNAUTHENTICATED');
    expect(await code(buddyRequests({}, {}, mockContext(null).context))).toBe('UNAUTHENTICATED');
  });

  it('getBuddyList returns buddies with mapped presence, batched', async () => {
    const m = mockContext();
    m.prisma.buddyRelationship.findMany.mockResolvedValue(accepted);
    m.prisma.user.findMany.mockResolvedValue([user(OTHER), user(THIRD)]);
    m.prisma.presence.findMany.mockResolvedValue([
      { id: 'p1', userId: OTHER, status: 'invisible', lastHeartbeat: new Date() },
    ]);
    const list = await getBuddyList({}, {}, m.context);
    expect(list).toHaveLength(2);
    const a = list.find((b) => b.user._id === OTHER)!;
    expect(a.presence?.status).toBe('offline');
    expect(a.user).toEqual({ _id: OTHER, name: `n${OTHER}`, username: `u${OTHER}`, avatar: null });
    expect(list.find((b) => b.user._id === THIRD)!.presence).toBeNull();
    expect(m.prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(m.prisma.presence.findMany).toHaveBeenCalledTimes(1);
    expect(m.prisma.userBlock.findMany).toHaveBeenCalledTimes(1);
    const sel = m.prisma.user.findMany.mock.calls[0][0].select;
    expect(sel).toEqual({ id: true, name: true, username: true, avatar: true });
  });

  it('getBuddyList keeps online presence and shows the pair in both users lists', async () => {
    const m = mockContext(OTHER);
    m.prisma.buddyRelationship.findMany.mockResolvedValue([accepted[0]]);
    m.prisma.user.findMany.mockResolvedValue([user(ME)]);
    m.prisma.presence.findMany.mockResolvedValue([
      { id: 'p', userId: ME, status: 'online', lastHeartbeat: new Date() },
    ]);
    const list = await getBuddyList({}, {}, m.context);
    expect(list.map((b) => b.user._id)).toEqual([ME]);
    expect(list[0].presence?.status).toBe('online');
  });

  it('getBuddyList hides blocked pairs (either direction) and shows them again once unblocked', async () => {
    const m = mockContext();
    m.prisma.buddyRelationship.findMany.mockResolvedValue(accepted);
    m.prisma.user.findMany.mockResolvedValue([user(THIRD)]);
    m.prisma.userBlock.findMany.mockResolvedValue([{ blockerId: OTHER, blockedUserId: ME }]);
    const hidden = await getBuddyList({}, {}, m.context);
    expect(m.prisma.user.findMany.mock.calls[0][0].where.id.in).toEqual([THIRD]);
    expect(hidden.map((b) => b.user._id)).toEqual([THIRD]);

    m.prisma.userBlock.findMany.mockResolvedValue([]);
    m.prisma.user.findMany.mockResolvedValue([user(OTHER), user(THIRD)]);
    const shown = await getBuddyList({}, {}, m.context);
    expect(shown).toHaveLength(2);
  });

  it('getBuddyList returns [] without further queries when no buddies', async () => {
    const m = mockContext();
    expect(await getBuddyList({}, {}, m.context)).toEqual([]);
    expect(m.prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('buddyRequests returns pending rows and drops blocked pairs', async () => {
    const m = mockContext();
    m.prisma.buddyRelationship.findMany.mockResolvedValue([
      row(),
      row({
        id: 'r2',
        requesterId: THIRD,
        recipientId: ME,
        requester: user(THIRD),
        recipient: user(ME),
      }),
    ]);
    m.prisma.userBlock.findMany.mockResolvedValue([{ blockerId: ME, blockedUserId: THIRD }]);
    const result = await buddyRequests({}, {}, m.context);
    expect(result.map((r) => r._id)).toEqual([REQ]);
    expect(result[0].createdAt).toEqual(new Date('2024-01-01'));
    const arg = m.prisma.buddyRelationship.findMany.mock.calls[0][0];
    expect(arg.where.status).toBe('pending');
    expect(JSON.stringify(arg.include)).not.toContain('email');
  });
});

describe('BuddyUser type', () => {
  it('exposes exactly _id, name, username, avatar', () => {
    expect(Object.keys(BuddyUserType.getFields()).sort()).toEqual([
      '_id',
      'avatar',
      'name',
      'username',
    ]);
  });
});
