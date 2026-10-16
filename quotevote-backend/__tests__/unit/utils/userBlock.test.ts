import { GraphQLError } from 'graphql';
import { assertNoBlockBetween, findBlockBetween, requireTargetUser } from '~/data/utils/userBlock';
import type { GraphQLContext } from '~/types/graphql';

const A = '60d5ec49ad414d7a8d5464a0';
const B = '60d5ec49ad414d7a8d5464a1';
const MESSAGE = 'Cannot send message: a block exists between these users';

function prismaWith(blockers: string[]): GraphQLContext['prisma'] {
  return {
    userBlock: {
      findMany: jest.fn().mockResolvedValue(blockers.map((blockerId) => ({ blockerId }))),
    },
  } as unknown as GraphQLContext['prisma'];
}

async function caught(promise: Promise<unknown>): Promise<GraphQLError> {
  try {
    await promise;
  } catch (e) {
    return e as GraphQLError;
  }
  throw new Error('expected rejection');
}

describe('findBlockBetween', () => {
  it('queries once with both directions', async () => {
    const prisma = prismaWith([]);
    await findBlockBetween(prisma, A, B);
    expect(prisma.userBlock.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.userBlock.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { blockerId: A, blockedUserId: B },
          { blockerId: B, blockedUserId: A },
        ],
      },
      select: { blockerId: true },
    });
  });

  it('flags directions correctly', async () => {
    expect(await findBlockBetween(prismaWith([]), A, B)).toEqual({
      aBlocksB: false,
      bBlocksA: false,
    });
    expect(await findBlockBetween(prismaWith([A]), A, B)).toEqual({
      aBlocksB: true,
      bBlocksA: false,
    });
    expect(await findBlockBetween(prismaWith([B]), A, B)).toEqual({
      aBlocksB: false,
      bBlocksA: true,
    });
    expect(await findBlockBetween(prismaWith([A, B]), A, B)).toEqual({
      aBlocksB: true,
      bBlocksA: true,
    });
  });
});

describe('assertNoBlockBetween', () => {
  describe.each(['createMessage into existing USER room', 'createUserMessageRoom for new DM'])(
    '%s',
    () => {
      it('resolves when no block exists', async () => {
        await expect(assertNoBlockBetween(prismaWith([]), A, B)).resolves.toBeUndefined();
      });

      it.each([
        ['A blocks B', [A]],
        ['B blocks A', [B]],
        ['both block', [A, B]],
      ])('throws FORBIDDEN when %s, in both argument orders', async (_n, blockers) => {
        const prisma = prismaWith(blockers);
        const e1 = await caught(assertNoBlockBetween(prisma, A, B));
        const e2 = await caught(assertNoBlockBetween(prisma, B, A));
        for (const e of [e1, e2]) {
          expect(e).toBeInstanceOf(GraphQLError);
          expect(e.extensions.code).toBe('FORBIDDEN');
          expect(e.message).toBe(MESSAGE);
        }
      });
    }
  );
});

describe('requireTargetUser', () => {
  const ctx = (userId: string | null, found: unknown = { id: B }): GraphQLContext =>
    ({
      userId,
      prisma: { user: { findUnique: jest.fn().mockResolvedValue(found) } },
    }) as unknown as GraphQLContext;

  it('returns the caller id and checks the target', async () => {
    const c = ctx(A);
    await expect(requireTargetUser(c, B)).resolves.toBe(A);
    expect(c.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: B },
      select: { id: true },
    });
  });

  it.each([
    ['unauthenticated', null, B, 'UNAUTHENTICATED'],
    ['invalid id', A, 'nope', 'BAD_USER_INPUT'],
    ['self', A, A, 'BAD_USER_INPUT'],
  ])('rejects %s', async (_n, me, target, code) => {
    const e = await caught(requireTargetUser(ctx(me), target));
    expect(e.extensions.code).toBe(code);
  });

  it('rejects unknown user', async () => {
    const e = await caught(requireTargetUser(ctx(A, null), B));
    expect(e.extensions.code).toBe('BAD_USER_INPUT');
    expect(e.message).toBe('User not found');
  });
});
