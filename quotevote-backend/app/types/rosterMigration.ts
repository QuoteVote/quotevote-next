export interface RosterAuditRow {
  userId: string;
  buddyId: string;
  initiatedBy: string | null;
  status: string;
  created: Date;
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
