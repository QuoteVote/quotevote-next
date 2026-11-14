import type {
  BuddyBackfillRow,
  BuddyRollbackSource,
  DateRange,
  RosterAuditRow,
  RosterBackfillPlan,
  RosterRollbackCounts,
  RosterRollbackPlan,
  RosterRollbackRow,
  RosterSummary,
  UserBlockBackfillRow,
  UserBlockRollbackSource,
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

const range = (all: (Date | null)[]): DateRange => {
  const dates = all.filter((d): d is Date => d != null);
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

  let buddyAccepted = 0;
  let buddyPending = 0;
  for (const [pk, p] of pairBuddy) {
    const [x, y] = pk.split(':');
    const blocked = allBlocks.has(`${x}>${y}`) || allBlocks.has(`${y}>${x}`);
    if (p.accepted > 0) buddyAccepted += 1;
    else if (blocked) skip('pendingBlocked');
    else buddyPending += 1;
    // accepted pairs are normally two reciprocal rows (acceptBuddy writes both)
    const expectedRows = p.accepted === 2 && p.pending === 0 ? 2 : 1;
    for (let n = 0; n < p.accepted + p.pending - expectedRows; n += 1) skip('duplicatePair');
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

/**
 * The Buddy and UserBlock rows the legacy roster data turns into, with ids
 * lowercased, plus a count of each row left out and why. Pure: no DB access.
 * Kept separate from summarizeRoster on purpose: its counts must match the
 * audit's expectedBackfill, and the tests compare the two.
 */
export function planRosterBackfill(
  rows: RosterAuditRow[],
  existingUserIds: Iterable<string>,
  usersWithBlockedIds: UserBlockedIds[]
): RosterBackfillPlan {
  const exists = new Set<string>();
  for (const id of existingUserIds) exists.add(id.toLowerCase());
  const has = (id: string): boolean => exists.has(id.toLowerCase());

  const skipped: Record<string, number> = {};
  const skip = (reason: string): void => {
    skipped[reason] = (skipped[reason] ?? 0) + 1;
  };
  const byPair = new Map<string, RosterAuditRow[]>(); // accepted and pending rows
  const blocks = new Map<string, UserBlockBackfillRow>(); // "blocker>blocked" -> row
  const addBlock = (blockerId: string, blockedUserId: string): void => {
    blocks.set(`${blockerId}>${blockedUserId}`, { blockerId, blockedUserId });
  };

  for (const r of rows) {
    const u = r.userId.toLowerCase();
    const b = r.buddyId.toLowerCase();
    if (u === b) {
      skip('self');
      continue;
    }
    if (!has(u) || !has(b)) {
      skip('orphan');
      continue;
    }
    if (r.status === 'accepted' || r.status === 'pending') {
      const pk = sortedKey(u, b);
      const initiatedBy = r.initiatedBy?.toLowerCase() ?? null;
      byPair.set(pk, [...(byPair.get(pk) ?? []), { ...r, userId: u, buddyId: b, initiatedBy }]);
    } else if (r.status === 'blocked') {
      // Legacy blockBuddy keys the row on (blocker, blocked), so userId is the blocker.
      addBlock(u, b);
    } else if (r.status === 'declined') {
      skip('declined');
    } else {
      skip('unknownStatus');
    }
  }

  for (const u of usersWithBlockedIds) {
    const blocker = u.id.toLowerCase();
    for (const raw of u.blockedUserIds) {
      const blocked = raw.toLowerCase();
      if (has(blocker) && has(blocked) && blocker !== blocked) addBlock(blocker, blocked);
    }
  }

  const when = (r: RosterAuditRow): Date => r.created ?? r.updated;
  const buddies: BuddyBackfillRow[] = [];
  for (const [pairKey, pairRows] of byPair) {
    const sorted = [...pairRows].sort((x, y) => when(x).getTime() - when(y).getTime());
    const accepted = sorted.filter((r) => r.status === 'accepted');
    // accepted pairs are normally two reciprocal rows (acceptBuddy writes both)
    const expectedRows = accepted.length === 2 && sorted.length === 2 ? 2 : 1;
    for (let n = 0; n < sorted.length - expectedRows; n += 1) skip('duplicatePair');

    const [x, y] = pairKey.split(':');
    if (accepted.length === 0 && (blocks.has(`${x}>${y}`) || blocks.has(`${y}>${x}`))) {
      skip('pendingBlocked');
      continue;
    }
    const first = sorted[0];
    const requesterId =
      accepted.length > 0
        ? (sorted.map((r) => r.initiatedBy).find((i) => i === x || i === y) ?? first.userId)
        : first.userId;
    buddies.push({
      pairKey,
      requesterId,
      recipientId: requesterId === x ? y : x,
      status: accepted.length > 0 ? 'accepted' : 'pending',
      createdAt: when(first),
      acceptedAt:
        accepted.length > 0
          ? new Date(Math.min(...accepted.map((r) => r.updated.getTime())))
          : null,
    });
  }

  return { buddies, blocks: [...blocks.values()], skipped };
}

/**
 * The legacy roster changes that make `rosters` match BuddyRelationship and
 * UserBlock, for a rollback to the legacy API. Pure: no DB access.
 *
 * Rows follow what the legacy mutations write: a pending request is one row
 * requester -> recipient; an accepted pair is two rows, both initiated by the
 * requester; a block is a blocker -> blocked row that replaces that direction,
 * and the reverse accepted row stays.
 *
 * Current rows on a wanted direction are updated, never created again, so the
 * (userId, buddyId) unique index cannot fail. Only rows the new tables cover
 * (pending, accepted, blocked between two existing users) can be removed.
 */
export function planRosterRollback(
  buddies: BuddyRollbackSource[],
  blocks: UserBlockRollbackSource[],
  rosters: RosterAuditRow[],
  existingUserIds: Iterable<string>
): RosterRollbackPlan {
  const exists = new Set<string>();
  for (const id of existingUserIds) exists.add(id.toLowerCase());

  const skipped: Record<string, number> = {};
  const leftAlone: Record<string, number> = {};
  const count = (into: Record<string, number>, reason: string): void => {
    into[reason] = (into[reason] ?? 0) + 1;
  };
  /** Lowercased pair, or null after it counts why the pair is not usable. */
  const pair = (a: string, b: string, into: Record<string, number>): [string, string] | null => {
    const [x, y] = [a.toLowerCase(), b.toLowerCase()];
    if (x === y) count(into, 'self');
    else if (!exists.has(x) || !exists.has(y)) count(into, 'orphan');
    else return [x, y];
    return null;
  };

  const wanted = new Map<string, RosterRollbackRow>(); // "userId>buddyId" -> row
  const want = (r: RosterRollbackRow): void => {
    wanted.set(`${r.userId}>${r.buddyId}`, r);
  };

  for (const b of blocks) {
    const p = pair(b.blockerId, b.blockedUserId, skipped);
    if (p)
      want({
        userId: p[0],
        buddyId: p[1],
        status: 'blocked',
        initiatedBy: p[0],
        created: b.createdAt,
      });
  }

  const byPair = new Map<
    string,
    { requester: string; recipient: string; src: BuddyRollbackSource }[]
  >();
  for (const b of buddies) {
    const p = pair(b.requesterId, b.recipientId, skipped);
    if (!p) continue;
    if (b.status !== 'accepted' && b.status !== 'pending') {
      count(skipped, 'unknownStatus');
      continue;
    }
    const pk = sortedKey(p[0], p[1]);
    byPair.set(pk, [...(byPair.get(pk) ?? []), { requester: p[0], recipient: p[1], src: b }]);
  }

  for (const rows of byPair.values()) {
    // #694: there is no unique index on pairKey yet, so a pair can have more than one row.
    for (let n = 1; n < rows.length; n += 1) count(skipped, 'duplicatePair');
    const sorted = [...rows].sort((x, y) => x.src.createdAt.getTime() - y.src.createdAt.getTime());
    const { requester, recipient, src } =
      sorted.find((r) => r.src.status === 'accepted') ?? sorted[0];
    const base = { initiatedBy: requester, created: src.createdAt };
    if (src.status === 'accepted') {
      for (const [u, b] of [
        [requester, recipient],
        [recipient, requester],
      ]) {
        if (!wanted.has(`${u}>${b}`)) want({ userId: u, buddyId: b, status: 'accepted', ...base });
      }
    } else if (wanted.has(`${requester}>${recipient}`) || wanted.has(`${recipient}>${requester}`)) {
      count(skipped, 'pendingBlocked');
    } else {
      want({ userId: requester, buddyId: recipient, status: 'pending', ...base });
    }
  }

  const update: RosterRollbackRow[] = [];
  const remove: { userId: string; buddyId: string }[] = [];
  const seen = new Set<string>();
  for (const r of rosters) {
    const u = r.userId.toLowerCase();
    const b = r.buddyId.toLowerCase();
    const key = `${u}>${b}`;
    const w = wanted.get(key);
    if (w) {
      seen.add(key);
      if (r.status !== w.status || r.initiatedBy?.toLowerCase() !== w.initiatedBy) update.push(w);
      continue;
    }
    if (!pair(u, b, leftAlone)) continue;
    if (r.status === 'declined') count(leftAlone, 'declined');
    else if (KNOWN.includes(r.status)) remove.push({ userId: u, buddyId: b });
    else count(leftAlone, 'unknownStatus');
  }

  const create = [...wanted.entries()].filter(([k]) => !seen.has(k)).map(([, r]) => r);
  return { create, update, remove, skipped, leftAlone };
}

/** Counts-only view of a rollback plan, safe to print. */
export function rollbackCounts(plan: RosterRollbackPlan): RosterRollbackCounts {
  const byStatus = (rows: RosterRollbackRow[]): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
    return out;
  };
  return {
    create: byStatus(plan.create),
    update: byStatus(plan.update),
    remove: plan.remove.length,
    skipped: plan.skipped,
    leftAlone: plan.leftAlone,
  };
}

/** The database name in a MongoDB connection string, or null when it has none. */
export function databaseNameFromUrl(url: string): string | null {
  const m = /^mongodb(?:\+srv)?:\/\/[^/?#]*\/([^?#]*)/.exec(url);
  if (!m || m[1] === '') return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

/**
 * Makes the operator type the target database name again: returns it when
 * `dbArg` equals the database in `url`, else throws. Errors never hold the URL.
 */
export function assertTargetDatabase(url: string | undefined, dbArg: string | undefined): string {
  const name = url ? databaseNameFromUrl(url) : null;
  if (!name) throw new Error('DATABASE_URL must be set and must name a database');
  if (!dbArg) throw new Error('pass --db <name> with the database name from DATABASE_URL');
  if (dbArg !== name) {
    throw new Error(`--db ${dbArg} does not match the database in DATABASE_URL (${name})`);
  }
  return name;
}
