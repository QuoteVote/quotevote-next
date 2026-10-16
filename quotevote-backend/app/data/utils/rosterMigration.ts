import type {
  DateRange,
  RosterAuditRow,
  RosterSummary,
  UserBlockedIds,
} from '~/types/rosterMigration';

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

const sortedKey = (a: string, b: string): string => {
  const [x, y] = [a.toLowerCase(), b.toLowerCase()].sort();
  return `${x}:${y}`;
};

/** Order-independent, case-normalised key for a pair of user ids. */
export function toPairKey(a: string, b: string): string {
  if (!OBJECT_ID_RE.test(a) || !OBJECT_ID_RE.test(b)) {
    throw new Error('toPairKey expects 24-character hex ObjectIds');
  }
  return sortedKey(a, b);
}

const range = (dates: Date[]): DateRange => {
  if (dates.length === 0) return { oldest: null, newest: null };
  const times = dates.map((d) => d.getTime());
  return {
    oldest: new Date(Math.min(...times)).toISOString(),
    newest: new Date(Math.max(...times)).toISOString(),
  };
};

const KNOWN = ['pending', 'accepted', 'declined', 'blocked'];

/**
 * Counts-only summary of the legacy roster collection. Pure: no DB access and
 * the result never contains ids.
 */
export function summarizeRoster(
  rows: RosterAuditRow[],
  existingUserIds: Iterable<string>,
  usersWithBlockedIds: UserBlockedIds[]
): RosterSummary {
  const exists = new Set<string>();
  for (const id of existingUserIds) exists.add(id.toLowerCase());
  const has = (id: string): boolean => exists.has(id.toLowerCase());

  const byStatus: Record<string, number> = {
    pending: 0,
    accepted: 0,
    declined: 0,
    blocked: 0,
    other: 0,
  };
  const orphans = { userId: 0, buddyId: 0, initiatedBy: 0 };
  let selfRows = 0;
  let duplicateSameDirection = 0;
  let missingInitiatedBy = 0;
  let initiatedByNotInPair = 0;

  const directions = new Set<string>();
  const byPair = new Map<string, Map<string, string>>(); // pair -> "from>to" -> status
  const skipped: Record<string, number> = {};
  const skip = (reason: string): void => {
    skipped[reason] = (skipped[reason] ?? 0) + 1;
  };
  const pairBuddy = new Map<string, { accepted: number; pending: number }>();
  const blockEdges = new Set<string>(); // "blocker>blocked" from blocked roster rows

  for (const r of rows) {
    byStatus[KNOWN.includes(r.status) ? r.status : 'other'] += 1;
    if (!has(r.userId)) orphans.userId += 1;
    if (!has(r.buddyId)) orphans.buddyId += 1;
    if (r.initiatedBy == null) {
      missingInitiatedBy += 1;
    } else {
      if (!has(r.initiatedBy)) orphans.initiatedBy += 1;
      const i = r.initiatedBy.toLowerCase();
      if (i !== r.userId.toLowerCase() && i !== r.buddyId.toLowerCase()) initiatedByNotInPair += 1;
    }

    const u = r.userId.toLowerCase();
    const b = r.buddyId.toLowerCase();
    const dir = `${u}>${b}`;
    if (directions.has(dir)) duplicateSameDirection += 1;
    directions.add(dir);

    if (u === b) {
      selfRows += 1;
      skip('self');
      continue;
    }
    const pk = sortedKey(u, b);
    const dirs = byPair.get(pk) ?? new Map<string, string>();
    if (!dirs.has(dir)) dirs.set(dir, r.status);
    byPair.set(pk, dirs);

    if (!has(u) || !has(b)) {
      skip('orphan');
      continue;
    }
    if (r.status === 'accepted' || r.status === 'pending') {
      const p = pairBuddy.get(pk) ?? { accepted: 0, pending: 0 };
      p[r.status] += 1;
      pairBuddy.set(pk, p);
    } else if (r.status === 'blocked') {
      // Legacy blockBuddy keys the row on (blocker, blocked), so userId is the blocker.
      blockEdges.add(`${u}>${b}`);
    } else if (r.status === 'declined') {
      skip('declined');
    } else {
      skip('unknownStatus');
    }
  }

  const pairsBothDirections: Record<string, number> = {};
  let blockedWithReverseAccepted = 0;
  for (const dirs of byPair.values()) {
    if (dirs.size < 2) continue;
    const statuses = [...dirs.values()].sort().join('+');
    pairsBothDirections[statuses] = (pairsBothDirections[statuses] ?? 0) + 1;
  }
  for (const dirs of byPair.values()) {
    for (const [dir, status] of dirs) {
      if (status !== 'blocked') continue;
      const [from, to] = dir.split('>');
      if (dirs.get(`${to}>${from}`) === 'accepted') blockedWithReverseAccepted += 1;
    }
  }

  let buddyAccepted = 0;
  let buddyPending = 0;
  for (const p of pairBuddy.values()) {
    if (p.accepted > 0) buddyAccepted += 1;
    else buddyPending += 1;
    for (let n = 0; n < p.accepted + p.pending - 1; n += 1) skip('duplicatePair');
  }

  let usersWithEntries = 0;
  let totalEntries = 0;
  let pointingAtMissingUsers = 0;
  let coveredByBlockedRoster = 0;
  const allBlocks = new Set(blockEdges);
  for (const u of usersWithBlockedIds) {
    if (u.blockedUserIds.length === 0) continue;
    usersWithEntries += 1;
    const blocker = u.id.toLowerCase();
    for (const raw of u.blockedUserIds) {
      totalEntries += 1;
      const blocked = raw.toLowerCase();
      const edge = `${blocker}>${blocked}`;
      if (!has(blocked)) {
        pointingAtMissingUsers += 1;
        continue;
      }
      if (blockEdges.has(edge)) coveredByBlockedRoster += 1;
      if (has(blocker) && blocker !== blocked) allBlocks.add(edge);
    }
  }

  return {
    totalRows: rows.length,
    byStatus,
    created: range(rows.map((r) => r.created)),
    updated: range(rows.map((r) => r.updated)),
    pairsBothDirections,
    duplicateSameDirection,
    selfRows,
    orphans,
    missingInitiatedBy,
    initiatedByNotInPair,
    blockedWithReverseAccepted,
    blockedUserIds: {
      usersWithEntries,
      totalEntries,
      pointingAtMissingUsers,
      coveredByBlockedRoster,
    },
    expectedBackfill: { buddyAccepted, buddyPending, userBlocks: allBlocks.size, skipped },
  };
}
