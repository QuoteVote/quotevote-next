/// <reference types="node" />
/**
 * Switch step for #716 and #714: compares the indexes the Mongoose models declare with
 * the database's, and builds the missing ones on purpose instead of at startup.
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
import {
  createIndexOptions,
  declaredIndexes,
  describeConflict,
  describeIndex,
  planIndexes,
  ttlCommand,
} from '~/data/utils/modelIndexes';
import { withPrismaOnlyIndexes } from '~/data/utils/prismaOnlyIndexes';
import type { ExistingIndex, ModelIndexSource } from '~/types/modelIndexes';

/**
 * Every model the backend registers, with its declared indexes, plus the `@@index`es of
 * the collections only Prisma uses (buddies, blocks, direct messages, Terms acceptances).
 */
function modelSources(): ModelIndexSource[] {
  return withPrismaOnlyIndexes(
    mongoose.modelNames().map((name) => {
      const model = mongoose.model(name);
      return {
        collection: model.collection.collectionName,
        indexes: model.schema.indexes() as ModelIndexSource['indexes'],
      };
    })
  );
}

async function existingIndexes(
  db: mongoose.mongo.Db,
  collections: string[]
): Promise<Record<string, ExistingIndex[]>> {
  const names = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
  );
  const out: Record<string, ExistingIndex[]> = {};
  for (const name of collections) {
    out[name] = names.has(name)
      ? ((await db.collection(name).indexes()) as unknown as ExistingIndex[])
      : [];
  }
  return out;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error('Set MONGO_URI or DATABASE_URL');

  // Never let Mongoose build anything on its own while this runs.
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No database connection');
    const declared = declaredIndexes(modelSources());
    const collections = [...new Set(declared.map((d) => d.collection))].sort();
    const plan = planIndexes(declared, await existingIndexes(db, collections));

    console.log(`${plan.present} declared indexes already in place.`);
    plan.missing.forEach((i) => console.log(`missing: ${describeIndex(i)}`));
    plan.ttl.forEach((i) => console.log(`needs TTL (collMod): ${describeIndex(i)}`));
    plan.conflicts.forEach((c) => console.log(`CONFLICT: ${describeConflict(c)}`));

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

    for (const index of plan.missing) {
      const started = Date.now();
      process.stdout.write(`building ${describeIndex(index)} ... `);
      await db.collection(index.collection).createIndex(index.fields, createIndexOptions(index));
      console.log(`done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    }
    for (const index of plan.ttl) {
      process.stdout.write(`adding TTL to ${describeIndex(index)} ... `);
      await db.command(ttlCommand(index));
      console.log('done');
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('model indexes failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
