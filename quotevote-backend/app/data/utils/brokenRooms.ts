import type { PrismaClient } from '@prisma/client';

type BrokenRoomsPrisma = Pick<PrismaClient, 'messageRoom' | 'message'>;

/** Counts of rooms saved with an empty member (#713). No ids, names or emails. */
export interface BrokenRoomsSummary {
  rooms: number;
  byType: Record<string, number>;
  /** How many of those rooms hold at least one message. */
  withMessages: number;
  messages: number;
}

/**
 * Rooms whose `users` holds a null. The current API saved first direct messages from a
 * profile as `[sender, null]` before #713. Prisma can't read them, so the new backend
 * skips them when listing rooms; this lists them for the switch checks.
 */
export const BROKEN_ROOM_FILTER = {
  $and: [{ users: { $exists: true } }, { users: null }],
} as const;

export async function summarizeBrokenRooms(prisma: BrokenRoomsPrisma): Promise<BrokenRoomsSummary> {
  const rows = (await prisma.messageRoom.findRaw({
    filter: BROKEN_ROOM_FILTER,
    options: { projection: { _id: 1, messageType: 1 } },
  })) as unknown as { _id?: { $oid?: unknown }; messageType?: unknown }[];

  const byType: Record<string, number> = {};
  const ids: string[] = [];
  for (const row of rows) {
    const type = typeof row.messageType === 'string' ? row.messageType : 'unknown';
    byType[type] = (byType[type] ?? 0) + 1;
    if (typeof row._id?.$oid === 'string') ids.push(row._id.$oid);
  }

  const perRoom =
    ids.length === 0
      ? []
      : await prisma.message.groupBy({
          by: ['messageRoomId'],
          where: { messageRoomId: { in: ids } },
          _count: { _all: true },
        });

  return {
    rooms: rows.length,
    byType,
    withMessages: perRoom.length,
    messages: perRoom.reduce((sum, row) => sum + row._count._all, 0),
  };
}
