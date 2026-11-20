import mongoose from 'mongoose';
import {
  createIndexOptions,
  declaredIndexes,
  describeConflict,
  describeIndex,
  planIndexes,
  ttlCommand,
} from '~/data/utils/modelIndexes';
import { withPrismaOnlyIndexes } from '~/data/utils/prismaOnlyIndexes';
import type { ExistingIndex, IndexPlan, ModelIndexSource } from '~/types/modelIndexes';

/**
 * Runs the model index plan against a database (#716): `pnpm db:model-indexes` at the
 * switch and `setup indexes` on a new instance. The models must already be loaded
 * (`import '~/data/schema'`), and Mongoose must be connected with `autoIndex: false`.
 */

/** Every registered Mongoose model's indexes, plus the collections only Prisma uses. */
export function registeredIndexSources(): ModelIndexSource[] {
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

/** Compares the declared indexes with the database's. Changes nothing. */
export async function planDatabaseIndexes(db: mongoose.mongo.Db): Promise<IndexPlan> {
  const declared = declaredIndexes(registeredIndexSources());
  const collections = [...new Set(declared.map((d) => d.collection))].sort();
  return planIndexes(declared, await existingIndexes(db, collections));
}

/** The plan as report lines: collection and index names only, no data. */
export function describePlan(plan: IndexPlan): string[] {
  return [
    `${plan.present} declared indexes already in place.`,
    ...plan.missing.map((i) => `missing: ${describeIndex(i)}`),
    ...plan.ttl.map((i) => `needs TTL (collMod): ${describeIndex(i)}`),
    ...plan.conflicts.map((c) => `CONFLICT: ${describeConflict(c)}`),
  ];
}

/** Builds the missing indexes one at a time, then adds the missing TTLs. Never drops. */
export async function applyIndexPlan(
  db: mongoose.mongo.Db,
  plan: IndexPlan,
  log: (line: string) => void
): Promise<void> {
  if (plan.conflicts.length > 0) {
    throw new Error('Index conflicts need resolving by hand first. Nothing was changed.');
  }
  for (const index of plan.missing) {
    const started = Date.now();
    await db.collection(index.collection).createIndex(index.fields, createIndexOptions(index));
    log(`built ${describeIndex(index)} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
  for (const index of plan.ttl) {
    await db.command(ttlCommand(index));
    log(`added TTL to ${describeIndex(index)}`);
  }
}
