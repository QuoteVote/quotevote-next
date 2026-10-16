import { userBlockResolver } from '~/data/resolvers/userBlockResolver';
import { toPairKey } from '~/data/utils/rosterMigration';
import type { GraphQLContext } from '~/types/graphql';

const ME = '60d5ec49ad414d7a8d5464a0';
const OTHER = '60d5ec49ad414d7a8d5464a1';

function mockContext(userId: string | null = ME, blockers: string[] = []) {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ id: OTHER }) },
    userBlock: {
      upsert: jest.fn().mockReturnValue('upsert-op'),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue(blockers.map((blockerId) => ({ blockerId }))),
    },
    buddyRelationship: { deleteMany: jest.fn().mockReturnValue('buddy-op') },
    message: { create: jest.fn(), deleteMany: jest.fn(), update: jest.fn() },
    messageRoom: { create: jest.fn(), deleteMany: jest.fn(), update: jest.fn() },
    follow: { create: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  };
  return { prisma, context: { userId, prisma } as unknown as GraphQLContext };
}

const { blockUser, unblockUser } = userBlockResolver.Mutation;
const { userBlockStatus } = userBlockResolver.Query;

describe('userBlockResolver', () => {
  it('blockUser upserts idempotently and removes only pending buddy rows', async () => {
    const { prisma, context } = mockContext(ME, [ME]);
    const result = await blockUser({}, { userId: OTHER }, context);
    expect(prisma.userBlock.upsert).toHaveBeenCalledWith({
      where: { blockerId_blockedUserId: { blockerId: ME, blockedUserId: OTHER } },
      create: { blockerId: ME, blockedUserId: OTHER },
      update: {},
    });
    expect(prisma.buddyRelationship.deleteMany).toHaveBeenCalledWith({
      where: { pairKey: toPairKey(ME, OTHER), status: 'pending' },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(['upsert-op', 'buddy-op']);
    expect(result).toEqual({ userId: OTHER, blockedByMe: true, blockedMe: false });
    expect(Object.keys(result)).toHaveLength(3);
  });

  it('blockUser pairKey is symmetric', async () => {
    const { prisma, context } = mockContext(OTHER);
    await blockUser({}, { userId: ME }, context);
    expect(prisma.buddyRelationship.deleteMany).toHaveBeenCalledWith({
      where: { pairKey: toPairKey(ME, OTHER), status: 'pending' },
    });
  });

  it('blockUser never touches messages, rooms or follows', async () => {
    const { prisma, context } = mockContext();
    await blockUser({}, { userId: OTHER }, context);
    for (const m of [prisma.message, prisma.messageRoom, prisma.follow]) {
      for (const fn of Object.values(m)) expect(fn).not.toHaveBeenCalled();
    }
  });

  it('unblockUser is idempotent when nothing to delete', async () => {
    const { prisma, context } = mockContext();
    const result = await unblockUser({}, { userId: OTHER }, context);
    expect(prisma.userBlock.deleteMany).toHaveBeenCalledWith({
      where: { blockerId: ME, blockedUserId: OTHER },
    });
    expect(result).toEqual({ userId: OTHER, blockedByMe: false, blockedMe: false });
  });

  it('userBlockStatus reports both directions', async () => {
    const { context } = mockContext(ME, [OTHER]);
    expect(await userBlockStatus({}, { userId: OTHER }, context)).toEqual({
      userId: OTHER,
      blockedByMe: false,
      blockedMe: true,
    });
  });

  it.each([
    ['blockUser', blockUser],
    ['unblockUser', unblockUser],
    ['userBlockStatus', userBlockStatus],
  ])('%s validates input', async (_n, fn) => {
    await expect(fn({}, { userId: OTHER }, mockContext(null).context)).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
    await expect(fn({}, { userId: 'bad' }, mockContext().context)).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' },
    });
    await expect(fn({}, { userId: ME }, mockContext().context)).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' },
    });
    const unknown = mockContext();
    unknown.prisma.user.findUnique.mockResolvedValue(null);
    await expect(fn({}, { userId: OTHER }, unknown.context)).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' },
    });
  });
});
