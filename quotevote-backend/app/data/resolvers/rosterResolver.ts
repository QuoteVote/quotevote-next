import Roster from '../models/Roster';
import User from '../models/User';
import Presence from '../models/Presence';
import type * as Common from '~/types/common';

// ponytail: helper to extract buddy IDs from roster entries
function extractBuddyIds(entries: Array<{ userId: { toString(): string }; buddyId: { toString(): string } }>, currentUserId: string): string[] {
  return entries.map((e) =>
    e.userId.toString() === currentUserId ? e.buddyId.toString() : e.userId.toString()
  );
}

export const rosterResolver = {
  Query: {
    getBuddyList: async (
      _parent: unknown,
      _args: unknown,
      context: { userId?: string }
    ): Promise<{ user: Common.User; presence: Common.Presence | null; roster: Common.Roster }[]> => {
      if (!context.userId) return [];
      const entries = await Roster.find({
        $or: [{ userId: context.userId }, { buddyId: context.userId }],
        status: 'accepted',
      }).lean();

      const buddyIds = extractBuddyIds(entries, context.userId);

      // ponytail: batch queries instead of N+1 findById calls
      const [users, presences] = await Promise.all([
        User.find({ _id: { $in: buddyIds } }).lean(),
        Presence.find({ userId: { $in: buddyIds } }).lean(),
      ]);

      const userMap = new Map(users.map((u) => [u._id.toString(), u]));
      const presenceMap = new Map(presences.map((p) => [p.userId.toString(), p]));

      const results = [];
      for (const entry of entries) {
        const buddyId = entry.userId.toString() === context.userId
          ? entry.buddyId.toString()
          : entry.userId.toString();

        const user = userMap.get(buddyId);
        if (!user) continue;

        const presence = presenceMap.get(buddyId) ?? null;

        results.push({
          user: { ...user, _id: user._id.toString() },
          presence: presence ? {
            ...presence,
            _id: presence._id.toString(),
            userId: presence.userId.toString(),
          } : null,
          roster: {
            ...entry,
            _id: entry._id.toString(),
            userId: entry.userId.toString(),
            buddyId: entry.buddyId.toString(),
            initiatedBy: entry.initiatedBy.toString(),
          },
        });
      }
      return results as unknown as { user: Common.User; presence: Common.Presence | null; roster: Common.Roster }[];
    },

    getRoster: async (
      _parent: unknown,
      _args: unknown,
      context: { userId?: string }
    ): Promise<(Common.Roster & { buddy: Common.User })[]> => {
      if (!context.userId) return [];
      const entries = await Roster.find({
        $or: [{ userId: context.userId }, { buddyId: context.userId }],
      }).lean();

      const buddyIds = extractBuddyIds(entries, context.userId);

      // ponytail: single batch query instead of N findById calls
      const users = await User.find({ _id: { $in: buddyIds } }).lean();
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const results = [];
      for (const entry of entries) {
        const buddyId = entry.userId.toString() === context.userId
          ? entry.buddyId.toString()
          : entry.userId.toString();

        const buddy = userMap.get(buddyId);
        if (!buddy) continue;

        results.push({
          ...entry,
          _id: entry._id.toString(),
          userId: entry.userId.toString(),
          buddyId: entry.buddyId.toString(),
          initiatedBy: entry.initiatedBy.toString(),
          buddy: { ...buddy, _id: buddy._id.toString() },
        });
      }
      return results as unknown as (Common.Roster & { buddy: Common.User })[];
    },
  },
};
