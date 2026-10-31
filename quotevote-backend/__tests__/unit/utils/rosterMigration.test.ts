import { toPairKey, summarizeRoster, planRosterBackfill } from '~/data/utils/rosterMigration';
import type { RosterAuditRow } from '~/types/rosterMigration';

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
