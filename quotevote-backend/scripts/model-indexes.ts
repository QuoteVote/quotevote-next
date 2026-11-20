/// <reference types="node" />
/**
 * Switch step for #716 and #714: compares the indexes the Mongoose models declare (plus
 * the `@@index`es of the collections only Prisma uses) with the database's, and builds
 * the missing ones on purpose instead of at startup.
 *
 *   pnpm db:model-indexes           report only, changes nothing
 *   pnpm db:model-indexes --apply   build missing indexes one at a time, and add the
 *                                   declared TTL to existing indexes with collMod
 *
 * Safe to run twice. Any conflict (same key, different options, or declared twice)
 * is reported and stops the run before anything is changed; nothing is ever dropped.
 * Prints collection and index names only, no data.
 */
import mongoose from 'mongoose';
// Loads the models exactly as the server does (through the GraphQL types), so this
// covers the indexes Mongoose's autoIndex would have built at startup, and no others.
import '~/data/schema';
import { applyIndexPlan, describePlan, planDatabaseIndexes } from '~/data/utils/modelIndexRun';

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error('Set MONGO_URI or DATABASE_URL');

  // Never let Mongoose build anything on its own while this runs.
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No database connection');
    const plan = await planDatabaseIndexes(db);
    describePlan(plan).forEach((line) => console.log(line));

    if (plan.conflicts.length > 0) {
      console.log('Stopped: resolve the conflicts above by hand. Nothing was changed.');
      process.exitCode = 1;
      return;
    }
    if (plan.missing.length === 0 && plan.ttl.length === 0) {
      console.log('Nothing to do.');
      return;
    }
    if (!apply) {
      console.log('Report only. Run with --apply to make these changes.');
      return;
    }
    await applyIndexPlan(db, plan, (line) => console.log(line));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('model indexes failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
