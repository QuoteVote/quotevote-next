import {
  toPairKey,
  summarizeRoster,
  planRosterBackfill,
  planRosterRollback,
  rollbackCounts,
  databaseNameFromUrl,
  assertTargetDatabase,
} from '~/data/utils/rosterMigration';
import type {
  BuddyRollbackSource,
  RosterAuditRow,
  RosterRollbackPlan,
  UserBlockRollbackSource,
} from '~/types/rosterMigration';

const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const C = 'cccccccccccccccccccccccc';
const D = 'dddddddddddddddddddddddd';
const GONE = 'eeeeeeeeeeeeeeeeeeeeeeee';
const d1 = new Date('2001-01-01T00:00:00Z');
const d2 = new Date('2005-05-05T00:00:00Z');

const row = (
  o: Partial<RosterAuditRow> & Pick<RosterAuditRow, 'userId' | 'buddyId'>
): RosterAuditRow => ({
  initiatedBy: o.userId,
  status: 'accepted',
  created: d1,
  updated: d1,
  ...o,
});

const users = new Set([A, B, C, D]);

describe('toPairKey', () => {
  it('is symmetric', () => {
    expect(toPairKey(A, B)).toBe(toPairKey(B, A));
    expect(toPairKey(B, A)).toBe(`${A}:${B}`);
  });
  it('lowercases input', () => {
    expect(toPairKey(A.toUpperCase(), B)).toBe(`${A}:${B}`);
  });
  it('rejects non 24-hex input', () => {
    expect(() => toPairKey('abc', B)).toThrow();
    expect(() => toPairKey(A, 'z'.repeat(24))).toThrow();
    expect(() => toPairKey(A, '')).toThrow();
  });
});

describe('summarizeRoster', () => {
  it('counts totals, statuses and date ranges', () => {
    const s = summarizeRoster(
      [
        row({ userId: A, buddyId: B }),
        row({ userId: A, buddyId: C, status: 'pending', created: d2, updated: d2 }),
        row({ userId: A, buddyId: D, status: 'weird' }),
      ],
      users,
      []
    );
    expect(s.totalRows).toBe(3);
    expect(s.byStatus).toEqual({ accepted: 1, pending: 1, declined: 0, blocked: 0, other: 1 });
    expect(s.created).toEqual({ oldest: d1.toISOString(), newest: d2.toISOString() });
    expect(s.updated.newest).toBe(d2.toISOString());
  });

  it('handles empty input', () => {
    const s = summarizeRoster([], users, []);
    expect(s.totalRows).toBe(0);
    expect(s.created).toEqual({ oldest: null, newest: null });
  });

  it('counts pairs in both directions by status combination', () => {
    const s = summarizeRoster(
      [
        row({ userId: A, buddyId: B }),
        row({ userId: B, buddyId: A }),
        row({ userId: A, buddyId: C, status: 'blocked' }),
        row({ userId: C, buddyId: A }),
        row({ userId: B, buddyId: D, status: 'pending' }),
        row({ userId: D, buddyId: B, status: 'pending' }),
      ],
      users,
      []
    );
    expect(s.pairsBothDirections).toEqual({
      'accepted+accepted': 1,
      'accepted+blocked': 1,
      'pending+pending': 1,
    });
    expect(s.blockedWithReverseAccepted).toBe(1);
  });

  it('counts same-direction duplicates, self rows, orphans, initiatedBy problems', () => {
    const s = summarizeRoster(
      [
        row({ userId: A, buddyId: B }),
        row({ userId: A, buddyId: B }),
        row({ userId: C, buddyId: C }),
        row({ userId: A, buddyId: GONE }),
        row({ userId: GONE, buddyId: B }),
        row({ userId: A, buddyId: D, initiatedBy: GONE }),
        row({ userId: B, buddyId: D, initiatedBy: null }),
        row({ userId: B, buddyId: C, initiatedBy: A }),
      ],
      users,
      []
    );
    expect(s.duplicateSameDirection).toBe(1);
    expect(s.selfRows).toBe(1);
    expect(s.orphans).toEqual({ userId: 1, buddyId: 1, initiatedBy: 2 });
    expect(s.missingInitiatedBy).toBe(1);
    expect(s.initiatedByNotInPair).toBe(2);
  });

  it('summarizes blockedUserIds', () => {
    const s = summarizeRoster([row({ userId: A, buddyId: B, status: 'blocked' })], users, [
      { id: A, blockedUserIds: [B, GONE] },
      { id: C, blockedUserIds: [D] },
      { id: D, blockedUserIds: [] },
    ]);
    expect(s.blockedUserIds).toEqual({
      usersWithEntries: 2,
      totalEntries: 3,
      pointingAtMissingUsers: 1,
      coveredByBlockedRoster: 1,
    });
  });

  it('computes expected backfill output', () => {
    const s = summarizeRoster(
      [
        row({ userId: A, buddyId: B }),
        row({ userId: B, buddyId: A }),
        row({ userId: A, buddyId: C, status: 'pending' }),
        row({ userId: A, buddyId: D, status: 'declined' }),
        row({ userId: B, buddyId: D, status: 'blocked' }),
        row({ userId: C, buddyId: C }),
        row({ userId: A, buddyId: GONE }),
        row({ userId: B, buddyId: C, status: 'weird' }),
      ],
      users,
      [{ id: C, blockedUserIds: [A, B] }]
    );
    expect(s.expectedBackfill).toEqual({
      buddyAccepted: 1,
      buddyPending: 0,
      userBlocks: 3,
      skipped: { self: 1, orphan: 1, declined: 1, unknownStatus: 1, pendingBlocked: 1 },
    });
  });

  it('ignores null created dates in the range', () => {
    const s = summarizeRoster(
      [
        row({ userId: A, buddyId: B, created: null }),
        row({ userId: A, buddyId: C, created: d2, status: 'pending' }),
      ],
      users,
      []
    );
    expect(s.totalRows).toBe(2);
    expect(s.created).toEqual({ oldest: d2.toISOString(), newest: d2.toISOString() });
    const none = summarizeRoster([row({ userId: A, buddyId: B, created: null })], users, []);
    expect(none.created).toEqual({ oldest: null, newest: null });
  });

  it('drops a pending request when the pair is blocked in a roster row', () => {
    const s = summarizeRoster(
      [
        row({ userId: A, buddyId: B, status: 'pending' }),
        row({ userId: B, buddyId: A, status: 'blocked' }),
      ],
      users,
      []
    );
    expect(s.expectedBackfill.buddyPending).toBe(0);
    expect(s.expectedBackfill.skipped).toEqual({ pendingBlocked: 1 });
  });

  it('drops a pending request when the pair is blocked only via blockedUserIds', () => {
    const s = summarizeRoster([row({ userId: A, buddyId: B, status: 'pending' })], users, [
      { id: B, blockedUserIds: [A] },
    ]);
    expect(s.expectedBackfill.buddyPending).toBe(0);
    expect(s.expectedBackfill.skipped).toEqual({ pendingBlocked: 1 });
  });

  it('does not flag reciprocal accepted rows but flags an extra row as duplicates', () => {
    const recip = summarizeRoster(
      [row({ userId: A, buddyId: B }), row({ userId: B, buddyId: A })],
      users,
      []
    );
    expect(recip.expectedBackfill.skipped).toEqual({});
    const three = summarizeRoster(
      [row({ userId: A, buddyId: B }), row({ userId: B, buddyId: A, status: 'pending' })],
      users,
      []
    );
    expect(three.expectedBackfill.buddyAccepted).toBe(1);
    expect(three.expectedBackfill.skipped).toEqual({ duplicatePair: 1 });
  });

  it('never includes ids in output', () => {
    const s = summarizeRoster(
      [row({ userId: A, buddyId: B }), row({ userId: C, buddyId: GONE })],
      users,
      [{ id: A, blockedUserIds: [B, GONE] }]
    );
    const json = JSON.stringify(s);
    for (const id of [A, B, C, D, GONE]) expect(json).not.toContain(id);
  });
});

describe('planRosterBackfill', () => {
  const d3 = new Date('2009-09-09T00:00:00Z');

  it('turns reciprocal accepted rows into one accepted relationship', () => {
    const plan = planRosterBackfill(
      [
        row({ userId: B, buddyId: A, initiatedBy: A, created: d2, updated: d3 }),
        row({ userId: A, buddyId: B, initiatedBy: A, created: d1, updated: d2 }),
      ],
      users,
      []
    );
    expect(plan.buddies).toEqual([
      {
        pairKey: `${A}:${B}`,
        requesterId: A,
        recipientId: B,
        status: 'accepted',
        createdAt: d1,
        acceptedAt: d2,
      },
    ]);
    expect(plan.blocks).toEqual([]);
    expect(plan.skipped).toEqual({});
  });

  it('uses the earliest row as requester when initiatedBy is not in the pair', () => {
    const plan = planRosterBackfill(
      [
        row({ userId: A, buddyId: B, initiatedBy: null, created: d2 }),
        row({ userId: B, buddyId: A, initiatedBy: C, created: d1 }),
      ],
      users,
      []
    );
    expect(plan.buddies[0]).toMatchObject({ requesterId: B, recipientId: A });
  });

  it('turns a pending row into a pending request from userId to buddyId', () => {
    const plan = planRosterBackfill(
      [row({ userId: C, buddyId: A, status: 'pending', created: d2 })],
      users,
      []
    );
    expect(plan.buddies).toEqual([
      {
        pairKey: `${A}:${C}`,
        requesterId: C,
        recipientId: A,
        status: 'pending',
        createdAt: d2,
        acceptedAt: null,
      },
    ]);
  });

  it('keeps the earliest request when a pair is pending both ways', () => {
    const plan = planRosterBackfill(
      [
        row({ userId: A, buddyId: B, status: 'pending', created: d2 }),
        row({ userId: B, buddyId: A, status: 'pending', created: d1 }),
      ],
      users,
      []
    );
    expect(plan.buddies).toHaveLength(1);
    expect(plan.buddies[0]).toMatchObject({ requesterId: B, status: 'pending', createdAt: d1 });
  });

  it('falls back to updated when created is missing', () => {
    const plan = planRosterBackfill(
      [row({ userId: A, buddyId: B, status: 'pending', created: null, updated: d3 })],
      users,
      []
    );
    expect(plan.buddies[0].createdAt).toEqual(d3);
  });

  it('collects blocks from blocked rows and blockedUserIds once each', () => {
    const plan = planRosterBackfill([row({ userId: B, buddyId: D, status: 'blocked' })], users, [
      { id: B, blockedUserIds: [D.toUpperCase(), B] },
      { id: C, blockedUserIds: [A, GONE] },
    ]);
    expect(plan.blocks).toEqual([
      { blockerId: B, blockedUserId: D },
      { blockerId: C, blockedUserId: A },
    ]);
  });

  it('keeps an accepted pair when blocked but drops a blocked pending request', () => {
    const plan = planRosterBackfill(
      [row({ userId: A, buddyId: B }), row({ userId: A, buddyId: C, status: 'pending' })],
      users,
      [
        { id: B, blockedUserIds: [A] },
        { id: C, blockedUserIds: [A] },
      ]
    );
    expect(plan.buddies.map((b) => b.pairKey)).toEqual([`${A}:${B}`]);
    expect(plan.skipped).toEqual({ pendingBlocked: 1 });
  });

  it('lowercases ids so they match toPairKey', () => {
    const plan = planRosterBackfill(
      [row({ userId: B.toUpperCase(), buddyId: A, status: 'pending' })],
      users,
      []
    );
    expect(plan.buddies[0]).toMatchObject({ pairKey: toPairKey(A, B), requesterId: B });
  });

  it('gives the same result when run twice', () => {
    const rows = [
      row({ userId: A, buddyId: B }),
      row({ userId: A, buddyId: C, status: 'pending' }),
    ];
    const blocked = [{ id: D, blockedUserIds: [A] }];
    expect(planRosterBackfill(rows, users, blocked)).toEqual(
      planRosterBackfill(rows, users, blocked)
    );
  });

  it('matches the audit expectedBackfill counts', () => {
    const rows = [
      row({ userId: A, buddyId: B }),
      row({ userId: B, buddyId: A }),
      row({ userId: A, buddyId: C, status: 'pending' }),
      row({ userId: B, buddyId: C, status: 'pending' }),
      row({ userId: A, buddyId: D, status: 'declined' }),
      row({ userId: B, buddyId: D, status: 'blocked' }),
      row({ userId: C, buddyId: C }),
      row({ userId: A, buddyId: GONE }),
      row({ userId: C, buddyId: D, status: 'weird' }),
    ];
    const blocked = [{ id: C, blockedUserIds: [A] }];
    const plan = planRosterBackfill(rows, users, blocked);
    expect(summarizeRoster(rows, users, blocked).expectedBackfill).toEqual({
      buddyAccepted: plan.buddies.filter((b) => b.status === 'accepted').length,
      buddyPending: plan.buddies.filter((b) => b.status === 'pending').length,
      userBlocks: plan.blocks.length,
      skipped: plan.skipped,
    });
    expect(plan.buddies).toHaveLength(2);
  });
});

describe('planRosterRollback', () => {
  const d3 = new Date('2009-09-09T00:00:00Z');
  const buddy = (
    o: Partial<BuddyRollbackSource> & Pick<BuddyRollbackSource, 'requesterId' | 'recipientId'>
  ): BuddyRollbackSource => ({ status: 'accepted', createdAt: d1, ...o });
  const block = (blockerId: string, blockedUserId: string): UserBlockRollbackSource => ({
    blockerId,
    blockedUserId,
    createdAt: d2,
  });
  const empty = { create: [], update: [], remove: [], skipped: {}, leftAlone: {} };

  /** Applies a plan to roster rows the way the script does. */
  const apply = (rosters: RosterAuditRow[], plan: RosterRollbackPlan): RosterAuditRow[] => {
    const key = (u: string, b: string): string => `${u.toLowerCase()}>${b.toLowerCase()}`;
    const gone = new Set(plan.remove.map((r) => key(r.userId, r.buddyId)));
    const changed = new Map(plan.update.map((r) => [key(r.userId, r.buddyId), r]));
    const kept = rosters
      .filter((r) => !gone.has(key(r.userId, r.buddyId)))
      .map((r) => {
        const u = changed.get(key(r.userId, r.buddyId));
        return u ? { ...r, status: u.status, initiatedBy: u.initiatedBy } : r;
      });
    return [...kept, ...plan.create.map((r) => ({ ...r, updated: d3 }))];
  };

  it('writes an accepted buddy as two rows initiated by the requester', () => {
    const plan = planRosterRollback([buddy({ requesterId: A, recipientId: B })], [], [], users);
    expect(plan).toEqual({
      ...empty,
      create: [
        { userId: A, buddyId: B, status: 'accepted', initiatedBy: A, created: d1 },
        { userId: B, buddyId: A, status: 'accepted', initiatedBy: A, created: d1 },
      ],
    });
  });

  it('writes a pending request as one row from requester to recipient', () => {
    const plan = planRosterRollback(
      [buddy({ requesterId: C, recipientId: A, status: 'pending', createdAt: d2 })],
      [],
      [],
      users
    );
    expect(plan.create).toEqual([
      { userId: C, buddyId: A, status: 'pending', initiatedBy: C, created: d2 },
    ]);
  });

  it('replaces the blocker row of an accepted pair and keeps the reverse accepted row', () => {
    const plan = planRosterRollback(
      [buddy({ requesterId: B, recipientId: A })],
      [block(A, B)],
      [],
      users
    );
    expect(plan.create).toEqual([
      { userId: A, buddyId: B, status: 'blocked', initiatedBy: A, created: d2 },
      { userId: B, buddyId: A, status: 'accepted', initiatedBy: B, created: d1 },
    ]);
  });

  it('drops a pending request when the pair has a block in either direction', () => {
    const plan = planRosterRollback(
      [
        buddy({ requesterId: A, recipientId: B, status: 'pending' }),
        buddy({ requesterId: A, recipientId: C, status: 'pending' }),
      ],
      [block(B, A), block(A, C)],
      [],
      users
    );
    expect(plan.create).toEqual([
      { userId: B, buddyId: A, status: 'blocked', initiatedBy: B, created: d2 },
      { userId: A, buddyId: C, status: 'blocked', initiatedBy: A, created: d2 },
    ]);
    expect(plan.skipped).toEqual({ pendingBlocked: 2 });
  });

  it('uses one buddy row per pair: the earliest accepted, else the earliest', () => {
    const plan = planRosterRollback(
      [
        buddy({ requesterId: A, recipientId: B, status: 'pending', createdAt: d1 }),
        buddy({ requesterId: B, recipientId: A, status: 'accepted', createdAt: d3 }),
        buddy({ requesterId: B, recipientId: A, status: 'accepted', createdAt: d2 }),
        buddy({ requesterId: C, recipientId: D, status: 'pending', createdAt: d2 }),
        buddy({ requesterId: D, recipientId: C, status: 'pending', createdAt: d1 }),
      ],
      [],
      [],
      users
    );
    expect(plan.create).toEqual([
      { userId: B, buddyId: A, status: 'accepted', initiatedBy: B, created: d2 },
      { userId: A, buddyId: B, status: 'accepted', initiatedBy: B, created: d2 },
      { userId: D, buddyId: C, status: 'pending', initiatedBy: D, created: d1 },
    ]);
    expect(plan.skipped).toEqual({ duplicatePair: 3 });
  });

  it('updates a pending row that is now accepted and creates the reverse row', () => {
    const plan = planRosterRollback(
      [buddy({ requesterId: A, recipientId: B })],
      [],
      [row({ userId: A, buddyId: B, status: 'pending' })],
      users
    );
    expect(plan.update).toEqual([
      { userId: A, buddyId: B, status: 'accepted', initiatedBy: A, created: d1 },
    ]);
    expect(plan.create).toEqual([
      { userId: B, buddyId: A, status: 'accepted', initiatedBy: A, created: d1 },
    ]);
    expect(plan.remove).toEqual([]);
  });

  it('updates any existing row on a wanted direction, also a declined one', () => {
    const plan = planRosterRollback(
      [buddy({ requesterId: A, recipientId: B, status: 'pending' })],
      [],
      [row({ userId: A, buddyId: B, status: 'declined' })],
      users
    );
    expect(plan.update).toHaveLength(1);
    expect(plan.create).toEqual([]);
    expect(plan.leftAlone).toEqual({});
  });

  it('updates a row whose initiatedBy is different', () => {
    const plan = planRosterRollback(
      [buddy({ requesterId: A, recipientId: B })],
      [],
      [
        row({ userId: A, buddyId: B, initiatedBy: B }),
        row({ userId: B, buddyId: A, initiatedBy: null }),
      ],
      users
    );
    expect(plan.update.map((r) => r.initiatedBy)).toEqual([A, A]);
    expect(plan.create).toEqual([]);
  });

  it('removes rows for removed buddies, declined requests and unblocks', () => {
    const plan = planRosterRollback(
      [],
      [],
      [
        row({ userId: A, buddyId: B }),
        row({ userId: B, buddyId: A }),
        row({ userId: C, buddyId: A, status: 'pending' }),
        row({ userId: D, buddyId: A, status: 'blocked' }),
      ],
      users
    );
    expect(plan.remove).toEqual([
      { userId: A, buddyId: B },
      { userId: B, buddyId: A },
      { userId: C, buddyId: A },
      { userId: D, buddyId: A },
    ]);
  });

  it('leaves declined, unknown, self and orphan rows alone and counts them', () => {
    const plan = planRosterRollback(
      [],
      [],
      [
        row({ userId: A, buddyId: B, status: 'declined' }),
        row({ userId: A, buddyId: C, status: 'weird' }),
        row({ userId: C, buddyId: C }),
        row({ userId: A, buddyId: GONE, status: 'blocked' }),
      ],
      users
    );
    expect(plan).toEqual({
      ...empty,
      leftAlone: { declined: 1, unknownStatus: 1, self: 1, orphan: 1 },
    });
  });

  it('skips self and orphan buddy and block rows', () => {
    const plan = planRosterRollback(
      [buddy({ requesterId: A, recipientId: A }), buddy({ requesterId: A, recipientId: GONE })],
      [block(B, B), block(GONE, B)],
      [],
      users
    );
    expect(plan).toEqual({ ...empty, skipped: { self: 2, orphan: 2 } });
  });

  it('lowercases ids before it compares', () => {
    const plan = planRosterRollback(
      [buddy({ requesterId: A.toUpperCase(), recipientId: B, status: 'pending' })],
      [],
      [row({ userId: A, buddyId: B.toUpperCase(), status: 'pending', initiatedBy: A })],
      [A.toUpperCase(), B, C, D]
    );
    expect(plan).toEqual(empty);
  });

  it('plans nothing on a second run after the plan is applied', () => {
    const buddies = [
      buddy({ requesterId: A, recipientId: B }),
      buddy({ requesterId: C, recipientId: A, status: 'pending' }),
      buddy({ requesterId: B, recipientId: D }),
    ];
    const blocks = [block(D, B), block(C, D)];
    const rosters = [
      row({ userId: A, buddyId: B, status: 'pending' }),
      row({ userId: A, buddyId: C, status: 'pending' }),
      row({ userId: B, buddyId: C }),
      row({ userId: C, buddyId: B }),
      row({ userId: D, buddyId: C, status: 'blocked' }),
      row({ userId: A, buddyId: D, status: 'declined' }),
    ];
    const first = planRosterRollback(buddies, blocks, rosters, users);
    expect(first.create.length + first.update.length + first.remove.length).toBeGreaterThan(0);
    const second = planRosterRollback(buddies, blocks, apply(rosters, first), users);
    expect(second).toEqual({ ...empty, skipped: first.skipped, leftAlone: { declined: 1 } });
  });

  it('gives back the legacy rows that planRosterBackfill read', () => {
    const legacy = [
      row({ userId: A, buddyId: B, initiatedBy: B }),
      row({ userId: B, buddyId: A, initiatedBy: B }),
      row({ userId: A, buddyId: C, status: 'pending', initiatedBy: A }),
      row({ userId: B, buddyId: D, status: 'blocked', initiatedBy: B }),
      row({ userId: D, buddyId: B, initiatedBy: B }),
      row({ userId: C, buddyId: D, status: 'declined' }),
    ];
    const backfill = planRosterBackfill(legacy, users, []);
    const plan = planRosterRollback(
      backfill.buddies,
      backfill.blocks.map((b) => ({ ...b, createdAt: d1 })),
      legacy,
      users
    );
    expect(plan).toEqual({ ...empty, leftAlone: { declined: 1 } });
  });
});

describe('rollbackCounts', () => {
  it('counts by action and status and holds no ids', () => {
    const plan = planRosterRollback(
      [
        { requesterId: A, recipientId: B, status: 'accepted', createdAt: d1 },
        { requesterId: C, recipientId: D, status: 'pending', createdAt: d1 },
      ],
      [{ blockerId: A, blockedUserId: C, createdAt: d1 }],
      [
        row({ userId: C, buddyId: D, status: 'accepted' }),
        row({ userId: B, buddyId: D, status: 'pending' }),
        row({ userId: D, buddyId: D }),
      ],
      users
    );
    const counts = rollbackCounts(plan);
    expect(counts).toEqual({
      create: { blocked: 1, accepted: 2 },
      update: { pending: 1 },
      remove: 1,
      skipped: {},
      leftAlone: { self: 1 },
    });
    const text = JSON.stringify(counts);
    for (const id of [A, B, C, D]) expect(text).not.toContain(id);
  });
});

describe('databaseNameFromUrl', () => {
  it('reads the database name', () => {
    expect(databaseNameFromUrl('mongodb://127.0.0.1:27018/qv_copy')).toBe('qv_copy');
  });
  it('ignores the query string, credentials and extra hosts', () => {
    expect(databaseNameFromUrl('mongodb://u:p%2Fw@h1:27017,h2:27017/qv?replicaSet=rs0&w=1')).toBe(
      'qv'
    );
    expect(databaseNameFromUrl('mongodb+srv://u:p@cluster.example.net/prod?retryWrites=true')).toBe(
      'prod'
    );
  });
  it('returns null when there is no database name', () => {
    expect(databaseNameFromUrl('mongodb://127.0.0.1:27017')).toBeNull();
    expect(databaseNameFromUrl('mongodb://127.0.0.1:27017/?replicaSet=rs0')).toBeNull();
    expect(databaseNameFromUrl('not a url')).toBeNull();
  });
});

describe('assertTargetDatabase', () => {
  const url = 'mongodb://127.0.0.1:27018/qv_copy?replicaSet=rs0';
  it('returns the name when --db matches', () => {
    expect(assertTargetDatabase(url, 'qv_copy')).toBe('qv_copy');
  });
  it('throws when --db is missing or different', () => {
    expect(() => assertTargetDatabase(url, undefined)).toThrow(/--db/);
    expect(() => assertTargetDatabase(url, '')).toThrow(/--db/);
    expect(() => assertTargetDatabase(url, 'qv_prod')).toThrow(/does not match/);
  });
  it('throws when DATABASE_URL is missing or has no database name', () => {
    expect(() => assertTargetDatabase(undefined, 'qv')).toThrow(/DATABASE_URL/);
    expect(() => assertTargetDatabase('mongodb://h:1/', 'qv')).toThrow(/DATABASE_URL/);
  });
  it('does not put the URL in the error', () => {
    expect(() => assertTargetDatabase('mongodb://u:secret@h/qv', 'x')).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('secret') })
    );
  });
});
