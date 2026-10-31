/// <reference types="node" />
/**
 * Roster backfill: copies legacy roster rows and User.blockedUserIds into
 * BuddyRelationship and UserBlock. Dry run by default: prints the same counts
 * as the `expectedBackfill` part of `pnpm roster:audit`. Never prints ids.
 *
 * With --apply it writes the planned rows. Writes are keyed on pairKey and on
 * (blockerId, blockedUserId) and never update an existing row, so it is safe to
 * run again. It does not change rosters or users.blockedUserIds.
 *
 * Usage: pnpm roster:backfill [--apply]
 */
import { PrismaClient } from '@prisma/client';
import { planRosterBackfill } from '~/data/utils/rosterMigration';

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
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
    const plan = planRosterBackfill(
      rows,
      users.map((u) => u.id),
      users
    );

    const counts = {
      buddyAccepted: plan.buddies.filter((b) => b.status === 'accepted').length,
      buddyPending: plan.buddies.filter((b) => b.status === 'pending').length,
      userBlocks: plan.blocks.length,
      skipped: plan.skipped,
    };
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...counts }, null, 2));
    if (!apply) return;

    const pairKeys = plan.buddies.map((b) => b.pairKey);
    const countPresent = async (): Promise<{ buddies: number; userBlocks: number }> => ({
      buddies: await prisma.buddyRelationship.count({ where: { pairKey: { in: pairKeys } } }),
      userBlocks:
        plan.blocks.length === 0 ? 0 : await prisma.userBlock.count({ where: { OR: plan.blocks } }),
    });

    const before = await countPresent();
    for (const b of plan.buddies) {
      await prisma.buddyRelationship.upsert({
        where: { pairKey: b.pairKey },
        create: b,
        update: {},
      });
    }
    for (const blockerId_blockedUserId of plan.blocks) {
      await prisma.userBlock.upsert({
        where: { blockerId_blockedUserId },
        create: blockerId_blockedUserId,
        update: {},
      });
    }
    const after = await countPresent();

    const planned = { buddies: plan.buddies.length, userBlocks: plan.blocks.length };
    const ok = after.buddies === planned.buddies && after.userBlocks === planned.userBlocks;
    console.table({ planned, presentBefore: before, presentAfter: after });
    console.log(ok ? 'PASS: every planned row is present' : 'FAIL: planned rows are missing');
    if (!ok) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('roster backfill failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
