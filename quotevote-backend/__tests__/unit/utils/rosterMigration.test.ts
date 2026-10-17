import { toPairKey, summarizeRoster } from '~/data/utils/rosterMigration';
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
      buddyPending: 1,
      userBlocks: 3,
      skipped: { self: 1, orphan: 1, declined: 1, duplicatePair: 1, unknownStatus: 1 },
    });
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
