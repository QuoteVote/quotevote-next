/// <reference types="node" />
/**
 * Inserts fixture roster rows for local testing of `pnpm roster:audit`.
 * Fixtures are tagged with created = 2001-01-01 and only those rows are
 * deleted before re-inserting, so the script is idempotent.
 * Does not modify users.
 *
 * Usage: pnpm roster:seed-fixtures
 */
import { PrismaClient } from '@prisma/client';

const FIXTURE_DATE = new Date('2001-01-01T00:00:00.000Z');

async function main(): Promise<void> {
  const MONGO_URI =
    process.env.DATABASE_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/quotevote';

  // safety guard: only run against a local database
  const parsed = new URL(MONGO_URI);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error(
      `SEED ABORTED: Refusing to run against non-local database "${parsed.hostname}".`
    );
  }

  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
      take: 2,
    });
    if (users.length < 2) throw new Error('Need at least 2 existing users to seed fixtures.');
    const [a, b] = [users[0].id, users[1].id];
    const orphan = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const del = await prisma.roster.deleteMany({ where: { created: FIXTURE_DATE } });

    const orphan2 = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    // Unique index (userId, buddyId) allows one row per direction, and 2 users form a single
    // pair, so only one real-pair scenario fits (accepted in both directions). Scenarios that
    // need the same pair again (accepted one way, pending, declined, blocked + reverse
    // accepted) are skipped. Self, orphan and missing-initiatedBy rows use other slots.
    const base = { created: FIXTURE_DATE, updated: FIXTURE_DATE };
    const data = [
      { userId: a, buddyId: b, status: 'accepted' as const, initiatedBy: a, ...base },
      { userId: b, buddyId: a, status: 'accepted' as const, initiatedBy: a, ...base },
      { userId: a, buddyId: a, status: 'accepted' as const, initiatedBy: a, ...base },
      { userId: a, buddyId: orphan, status: 'pending' as const, initiatedBy: a, ...base },
      { userId: orphan, buddyId: b, status: 'declined' as const, initiatedBy: orphan, ...base },
      { userId: b, buddyId: orphan2, status: 'pending' as const, initiatedBy: null, ...base },
    ];
    // unique-index-safe: insert rows individually; report conflicts rather than abort
    let inserted = 0;
    for (const row of data) {
      try {
        await prisma.roster.create({ data: row });
        inserted += 1;
      } catch {
        console.log('skipped one fixture row (unique index conflict)');
      }
    }
    console.log(`Removed ${del.count} old fixture rows, inserted ${inserted}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : 'seed failed');
  process.exit(1);
});
