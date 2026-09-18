/**
 * Unit tests for the Prisma → legacy User mapper.
 *
 * Pure-function tests: no database, no mocks, no GraphQL context. Each test
 * asserts a specific aspect of the field-name translation so regressions in
 * the mapper surface here before reaching resolver tests.
 */

import { toPublicUser, type PrismaUserRecord } from '~/data/utils/userPrismaMapper';

function basePrismaUser(overrides: Partial<PrismaUserRecord> = {}): PrismaUserRecord {
  return {
    id: '507f1f77bcf86cd799439011',
    email: 'alice@example.com',
    username: 'alice',
    name: 'Alice',
    accountStatus: 'active',
    ...overrides,
  };
}

describe('userPrismaMapper.toPublicUser', () => {
  it('maps Prisma id → legacy _id', () => {
    const result = toPublicUser(basePrismaUser({ id: 'abc-123' }));
    expect(result._id).toBe('abc-123');
  });

  it('maps isAdmin → admin, wallet → _wallet, votesId → _votesId', () => {
    const result = toPublicUser(
      basePrismaUser({
        isAdmin: true,
        wallet: 'wallet-addr',
        votesId: 'votes-ref',
      })
    );
    expect(result.admin).toBe(true);
    expect(result._wallet).toBe('wallet-addr');
    expect(result._votesId).toBe('votes-ref');
  });

  it('maps followingIds/followerIds → legacy underscore-prefixed arrays', () => {
    const result = toPublicUser(
      basePrismaUser({
        followingIds: ['user1', 'user2'],
        followerIds: ['user3'],
      })
    );
    expect(result._followingId).toEqual(['user1', 'user2']);
    expect(result._followersId).toEqual(['user3']);
  });

  it('translates embedded reputation and backfills _id', () => {
    const result = toPublicUser(
      basePrismaUser({
        reputation: {
          overallScore: 85,
          inviteNetworkScore: 10,
          conductScore: 20,
          activityScore: 30,
          metrics: {
            totalInvitesSent: 5,
            totalInvitesAccepted: 4,
            totalInvitesDeclined: 1,
            averageInviteeReputation: 70,
            totalReportsReceived: 0,
            totalReportsResolved: 0,
            totalUpvotes: 100,
            totalDownvotes: 5,
            totalPosts: 12,
            totalComments: 42,
          },
          lastCalculated: new Date('2026-01-01'),
        },
      })
    );

    expect(result.reputation).toBeDefined();
    expect(result.reputation?._id).toBe('507f1f77bcf86cd799439011');
    expect(result.reputation?.overallScore).toBe(85);
    expect(result.reputation?.metrics?.totalPosts).toBe(12);
  });

  it('returns undefined reputation when Prisma record has none', () => {
    const result = toPublicUser(basePrismaUser({ reputation: null }));
    expect(result.reputation).toBeUndefined();
  });

  it('defaults boolean flags to false when absent', () => {
    const result = toPublicUser(basePrismaUser());
    expect(result.admin).toBe(false);
    expect(result.emailVerified).toBe(false);
    expect(result.isModerator).toBe(false);
    expect(result.contributorBadge).toBe(false);
  });

  it('defaults array fields to empty arrays when absent', () => {
    const result = toPublicUser(basePrismaUser());
    expect(result._followingId).toEqual([]);
    expect(result._followersId).toEqual([]);
    expect(result.blockedUserIds).toEqual([]);
  });

  it('preserves passthrough fields unchanged', () => {
    const result = toPublicUser(
      basePrismaUser({
        email: 'bob@example.com',
        username: 'bob',
        name: 'Bob',
        bio: 'Hello',
        avatar: { color: 'blue' },
        upvotes: 10,
        downvotes: 2,
      })
    );
    expect(result.email).toBe('bob@example.com');
    expect(result.username).toBe('bob');
    expect(result.name).toBe('Bob');
    expect(result.bio).toBe('Hello');
    expect(result.avatar).toEqual({ color: 'blue' });
    expect(result.upvotes).toBe(10);
    expect(result.downvotes).toBe(2);
  });

  it('coerces null optionals to undefined for legacy shape', () => {
    const result = toPublicUser(
      basePrismaUser({
        name: null,
        bio: null,
        lastBotReportDate: null,
      })
    );
    expect(result.name).toBeUndefined();
    expect(result.bio).toBeUndefined();
    expect(result.lastBotReportDate).toBeUndefined();
  });
});
