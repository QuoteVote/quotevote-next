export interface RosterAuditRow {
  userId: string;
  buddyId: string;
  initiatedBy: string | null;
  status: string;
  created: Date | null;
  updated: Date;
}

export interface UserBlockedIds {
  id: string;
  blockedUserIds: string[];
}

export interface DateRange {
  oldest: string | null;
  newest: string | null;
}

export interface RosterSummary {
  totalRows: number;
  byStatus: Record<string, number>;
  created: DateRange;
  updated: DateRange;
  pairsBothDirections: Record<string, number>;
  duplicateSameDirection: number;
  selfRows: number;
  orphans: { userId: number; buddyId: number; initiatedBy: number };
  missingInitiatedBy: number;
  initiatedByNotInPair: number;
  blockedWithReverseAccepted: number;
  blockedUserIds: {
    usersWithEntries: number;
    totalEntries: number;
    pointingAtMissingUsers: number;
    coveredByBlockedRoster: number;
  };
  expectedBackfill: {
    buddyAccepted: number;
    buddyPending: number;
    userBlocks: number;
    skipped: Record<string, number>;
  };
}

export interface BuddyBackfillRow {
  pairKey: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted';
  createdAt: Date;
  acceptedAt: Date | null;
}

export interface UserBlockBackfillRow {
  blockerId: string;
  blockedUserId: string;
}

export interface RosterBackfillPlan {
  buddies: BuddyBackfillRow[];
  blocks: UserBlockBackfillRow[];
  skipped: Record<string, number>;
}

export interface BuddyRollbackSource {
  requesterId: string;
  recipientId: string;
  status: string;
  createdAt: Date;
}

export interface UserBlockRollbackSource {
  blockerId: string;
  blockedUserId: string;
  createdAt: Date;
}

/** One legacy roster row the rollback wants to exist. Ids are lowercased. */
export interface RosterRollbackRow {
  userId: string;
  buddyId: string;
  status: 'pending' | 'accepted' | 'blocked';
  initiatedBy: string;
  created: Date;
}

export interface RosterRollbackPlan {
  create: RosterRollbackRow[];
  /** Existing rows (same userId, buddyId) whose status or initiatedBy must change. */
  update: RosterRollbackRow[];
  remove: { userId: string; buddyId: string }[];
  /** Source rows (buddy or block) that produce no roster row, by reason. */
  skipped: Record<string, number>;
  /** Current roster rows the rollback does not touch, by reason. */
  leftAlone: Record<string, number>;
}

export interface RosterRollbackCounts {
  create: Record<string, number>;
  update: Record<string, number>;
  remove: number;
  skipped: Record<string, number>;
  leftAlone: Record<string, number>;
}
