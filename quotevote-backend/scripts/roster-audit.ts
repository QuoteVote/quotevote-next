/// <reference types="node" />
/**
 * Roster audit: prints a counts-only JSON summary of the legacy roster data.
 * Never prints ids, names or emails.
 *
 * Usage: pnpm roster:audit
 */
import { PrismaClient } from '@prisma/client';
import { summarizeRoster } from '~/data/utils/rosterMigration';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.roster.findMany({
      select: {
        userId: true,
        buddyId: true,
        initiatedBy: true,
        status: true,
        created: true,
        updated: true,
      },
    });
    const users = await prisma.user.findMany({ select: { id: true, blockedUserIds: true } });
    const summary = summarizeRoster(
      rows,
      users.map((u) => u.id),
      users
    );
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('roster audit failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
