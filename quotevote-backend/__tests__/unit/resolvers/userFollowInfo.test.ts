import { userResolver } from '~/data/resolvers/userResolver';
import type { GraphQLContext } from '~/types/graphql';

const profileId = '507f1f77bcf86cd799439011';
const followerA = '507f1f77bcf86cd799439021';
const followerB = '507f1f77bcf86cd799439022';
const followedC = '507f1f77bcf86cd799439023';
const disabledD = '507f1f77bcf86cd799439024';

const profile = {
  // Legacy follow arrays can repeat an id.
  followerIds: [followerA, followerB, followerA, disabledD],
  followingIds: [followerA, followedC],
  accountStatus: 'active',
};

const users = [
  {
    id: followerA,
    username: 'anna',
    avatar: { url: 'a.png' },
    followerIds: [profileId, profileId],
    followingIds: [profileId],
    accountStatus: 'active',
  },
  {
    id: followerB,
    username: 'ben',
    avatar: null,
    followerIds: [],
    followingIds: [profileId, followedC],
    accountStatus: 'active',
  },
  {
    id: followedC,
    username: 'cara',
    avatar: 'c.png',
    followerIds: [profileId],
    followingIds: [],
    accountStatus: 'active',
  },
  {
    id: disabledD,
    username: 'dan',
    avatar: null,
    followerIds: [],
    followingIds: [profileId],
    accountStatus: 'disabled',
  },
];

function mockContext(viewer: GraphQLContext['user'] = null): GraphQLContext {
  return {
    prisma: {
      user: {
        findFirst: jest.fn().mockResolvedValue(profile),
        findMany: jest
          .fn()
          .mockImplementation(({ where }: { where: { id: { in: string[] } } }) =>
            Promise.resolve(users.filter((u) => where.id.in.includes(u.id)))
          ),
      },
    } as unknown as GraphQLContext['prisma'],
    user: viewer,
    userId: viewer?._id?.toString() ?? null,
    requestId: 'test-request-id',
  } as GraphQLContext;
}

describe('userResolver Query.getUserFollowInfo', () => {
  it('lists followers once each, in order, with their counts, for a guest', async () => {
    const ctx = mockContext();

    const result = await userResolver.Query.getUserFollowInfo(
      null,
      { username: 'louis', filter: 'followers' },
      ctx
    );

    expect(result).toEqual([
      {
        id: followerA,
        username: 'anna',
        avatar: { url: 'a.png' },
        numFollowers: 1,
        numFollowing: 1,
        profileFollows: true,
      },
      {
        id: followerB,
        username: 'ben',
        avatar: null,
        numFollowers: 0,
        numFollowing: 2,
        profileFollows: false,
      },
    ]);
  });

  it('lists the accounts the profile follows', async () => {
    const ctx = mockContext({ _id: followerB } as unknown as GraphQLContext['user']);

    const result = await userResolver.Query.getUserFollowInfo(
      null,
      { username: 'louis', filter: 'following' },
      ctx
    );

    expect(result.map((u) => u.username)).toEqual(['anna', 'cara']);
    expect(result.every((u) => u.profileFollows)).toBe(true);
  });

  it('defaults to followers when no filter is given', async () => {
    const ctx = mockContext();

    const result = await userResolver.Query.getUserFollowInfo(null, { username: 'louis' }, ctx);

    expect(result.map((u) => u.username)).toEqual(['anna', 'ben']);
  });

  it('loads every listed user in one query with public fields only', async () => {
    const ctx = mockContext();

    await userResolver.Query.getUserFollowInfo(null, { username: 'louis' }, ctx);

    expect(ctx.prisma.user.findMany).toHaveBeenCalledTimes(1);
    const { select, where } = (ctx.prisma.user.findMany as jest.Mock).mock.calls[0][0];
    expect(where).toEqual({ id: { in: [followerA, followerB, disabledD] } });
    expect(Object.keys(select).sort()).toEqual(
      ['accountStatus', 'avatar', 'followerIds', 'followingIds', 'id', 'username'].sort()
    );
  });

  it('finds the profile without filtering accountStatus in the query', async () => {
    const ctx = mockContext();

    await userResolver.Query.getUserFollowInfo(null, { username: ' louis ' }, ctx);

    expect((ctx.prisma.user.findFirst as jest.Mock).mock.calls[0][0].where).toEqual({
      username: 'louis',
    });
  });

  it('returns an empty list for an unknown user', async () => {
    const ctx = mockContext();
    (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      userResolver.Query.getUserFollowInfo(null, { username: 'nobody' }, ctx)
    ).resolves.toEqual([]);
    expect(ctx.prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('returns an empty list for a disabled profile', async () => {
    const ctx = mockContext();
    (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue({
      ...profile,
      accountStatus: 'disabled',
    });

    await expect(
      userResolver.Query.getUserFollowInfo(null, { username: 'louis' }, ctx)
    ).resolves.toEqual([]);
  });

  it('returns an empty list when nobody follows the profile', async () => {
    const ctx = mockContext();
    (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue({
      ...profile,
      followerIds: [],
    });

    await expect(
      userResolver.Query.getUserFollowInfo(null, { username: 'louis' }, ctx)
    ).resolves.toEqual([]);
    expect(ctx.prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('returns an empty list for a blank username without querying', async () => {
    const ctx = mockContext();

    await expect(
      userResolver.Query.getUserFollowInfo(null, { username: '  ' }, ctx)
    ).resolves.toEqual([]);
    expect(ctx.prisma.user.findFirst).not.toHaveBeenCalled();
  });
});
