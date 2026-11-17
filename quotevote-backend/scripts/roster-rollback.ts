/// <reference types="node" />
/**
 * Roster rollback: rewrites the legacy `rosters` collection so it matches
 * BuddyRelationship and UserBlock (#695), for a rollback to the legacy API.
 * STOP THE NEW BACKEND FIRST so no writes happen during the run.
 *
 * Dry run by default: prints counts only, never ids. With --apply it writes.
 * It is safe to run again: a run that stops halfway can be run again. It never
 * changes buddyrelationships, userblocks or users. Declined, self and orphan
 * roster rows are left as they are.
 *
 * Usage: pnpm roster:rollback --db <name> [--apply]
 * <name> must equal the database name in DATABASE_URL.
 */
import { PrismaClient } from '@prisma/client';
import {
  assertTargetDatabase,
  planRosterRollback,
  rollbackCounts,
} from '~/data/utils/rosterMigration';
import type { RosterRollbackPlan } from '~/types/rosterMigration';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  const v = i === -1 ? undefined : process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? undefined : v;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const name = assertTargetDatabase(process.env.DATABASE_URL, argValue('--db'));
  const prisma = new PrismaClient();
  try {
    const load = async (): Promise<RosterRollbackPlan> => {
      const buddies = await prisma.buddyRelationship.findMany({
        select: { requesterId: true, recipientId: true, status: true, createdAt: true },
      });
      const blocks = await prisma.userBlock.findMany({
        select: { blockerId: true, blockedUserId: true, createdAt: true },
      });
      const rosters = await prisma.roster.findMany({
        select: {
          userId: true,
          buddyId: true,
          initiatedBy: true,
          status: true,
          created: true,
          updated: true,
        },
      });
      const users = await prisma.user.findMany({ select: { id: true } });
      return planRosterRollback(
        buddies,
        blocks,
        rosters,
        users.map((u) => u.id)
      );
    };

    const plan = await load();
    console.log(
      JSON.stringify(
        { mode: apply ? 'apply' : 'dry-run', database: name, ...rollbackCounts(plan) },
        null,
        2
      )
    );
    if (!apply) return;

    // updateMany/deleteMany do not read the row back: legacy rows have no createdAt or
    // updatedAt, and Prisma fails when it reads such a row. (userId, buddyId) is unique.
    for (const { userId, buddyId, status, initiatedBy } of plan.update) {
      await prisma.roster.updateMany({ where: { userId, buddyId }, data: { status, initiatedBy } });
    }
    for (const { userId, buddyId, status, initiatedBy, created } of plan.create) {
      await prisma.roster.create({ data: { userId, buddyId, status, initiatedBy, created } });
    }
    for (const { userId, buddyId } of plan.remove) {
      await prisma.roster.deleteMany({ where: { userId, buddyId } });
    }

    const plan2 = await load();
    const left = plan2.create.length + plan2.update.length + plan2.remove.length;
    console.log(JSON.stringify({ recheck: rollbackCounts(plan2) }, null, 2));
    console.log(
      left === 0
        ? 'PASS: rosters match buddyrelationships and userblocks'
        : `FAIL: ${left} roster changes still planned`
    );
    if (left !== 0) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('roster rollback failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
