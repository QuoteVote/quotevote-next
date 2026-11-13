/**
 * Creates the unique indexes the Prisma schema declares when they are missing (#694).
 *
 * Duplicate protection (buddy requests, blocks, Terms acceptances, ...) relies on these
 * indexes, but only `prisma db push` creates them, and that can't run on the live database
 * because it also changes or drops indexes. MongoDB creates a collection on its first write
 * without them. This only ever adds an index:
 *
 * - An existing index with the same keys that is already unique counts as present, whatever
 *   its name, since legacy created several under its own names.
 * - An existing index with the same keys or name in another form is reported, never changed.
 * - Before creating an index the records are checked for shared keys. If any exist, nothing
 *   is created and a few of them are listed, so they can be resolved first. Unique indexes
 *   treat a missing field as `null`, so records without the field count as sharing it.
 */
import { logger } from '~/data/utils/logger';
import type {
  EnsureUniqueIndexesOptions,
  UniqueIndexDuplicates,
  UniqueIndexModel,
  UniqueIndexResult,
  UniqueIndexRunCommand,
  UniqueIndexSpec,
} from '~/types/uniqueIndexes';

const DUPLICATE_EXAMPLES = 5;

interface ListedIndex {
  name?: unknown;
  key?: unknown;
  unique?: unknown;
  partialFilterExpression?: unknown;
}

/** The unique indexes in the schema: `@unique` fields and `@@unique` lists, in stored names. */
export function uniqueIndexSpecs(models: readonly UniqueIndexModel[]): UniqueIndexSpec[] {
  const specs: UniqueIndexSpec[] = [];
  for (const model of models) {
    const stored = (field: string) => model.fields.find((f) => f.name === field)?.dbName ?? field;
    const collection = model.dbName ?? model.name;
    for (const field of model.fields.filter((f) => f.isUnique)) {
      specs.push({
        model: model.name,
        collection,
        name: `${model.name}_${field.name}_key`,
        fields: [stored(field.name)],
      });
    }
    for (const index of model.uniqueIndexes) {
      specs.push({
        model: model.name,
        collection,
        name: index.name ?? `${model.name}_${index.fields.join('_')}_key`,
        fields: index.fields.map(stored),
      });
    }
  }
  return specs;
}

const firstBatch = (reply: unknown): unknown[] => {
  const batch = (reply as { cursor?: { firstBatch?: unknown } } | null)?.cursor?.firstBatch;
  return Array.isArray(batch) ? batch : [];
};

/** Numbers come back plain or as extended JSON (`{ $numberInt: '1' }`). */
const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const wrapped = Object.values(value as Record<string, unknown>)[0];
    return Number(wrapped);
  }
  return Number(value);
};

/** Index key order matters, so `{ a: 1, b: 1 }` and `{ b: 1, a: 1 }` differ. */
const sameKey = (key: unknown, fields: string[]): boolean => {
  if (!key || typeof key !== 'object') return false;
  const entries = Object.entries(key as Record<string, unknown>);
  return (
    entries.length === fields.length &&
    entries.every(([field, direction], i) => field === fields[i] && toNumber(direction) === 1)
  );
};

/** Unique for every record: a partial index leaves the others unprotected. */
const isFullyUnique = (index: ListedIndex): boolean =>
  index.unique === true && index.partialFilterExpression === undefined;

const errorText = (err: unknown): string => (err instanceof Error ? err.message : String(err));

const isDuplicateKeyError = (err: unknown): boolean => /E11000|duplicate key/i.test(errorText(err));

async function collectionExists(run: UniqueIndexRunCommand, collection: string): Promise<boolean> {
  const reply = await run({
    listCollections: 1,
    filter: { name: collection },
    nameOnly: true,
  });
  return firstBatch(reply).length > 0;
}

async function listIndexes(run: UniqueIndexRunCommand, collection: string): Promise<ListedIndex[]> {
  const reply = await run({ listIndexes: collection, cursor: { batchSize: 1000 } });
  return firstBatch(reply) as ListedIndex[];
}

/** Key values more than one record holds, counting a missing field as `null`. */
async function findDuplicates(
  run: UniqueIndexRunCommand,
  spec: UniqueIndexSpec
): Promise<UniqueIndexDuplicates> {
  const reply = await run({
    aggregate: spec.collection,
    pipeline: [
      {
        $group: {
          _id: Object.fromEntries(spec.fields.map((f) => [f, { $ifNull: [`$${f}`, null] }])),
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      {
        $facet: {
          groups: [{ $count: 'n' }],
          examples: [{ $sort: { count: -1 } }, { $limit: DUPLICATE_EXAMPLES }],
        },
      },
    ],
    cursor: {},
    allowDiskUse: true,
  });
  const [facet] = firstBatch(reply) as {
    groups?: { n?: unknown }[];
    examples?: { _id?: Record<string, unknown>; count?: unknown }[];
  }[];
  return {
    groups: facet?.groups?.[0] ? toNumber(facet.groups[0].n) : 0,
    examples: (facet?.examples ?? []).map((row) => ({
      key: row._id ?? {},
      count: toNumber(row.count),
    })),
  };
}

async function ensureOne(
  run: UniqueIndexRunCommand,
  spec: UniqueIndexSpec,
  dryRun: boolean
): Promise<UniqueIndexResult> {
  const indexes = (await collectionExists(run, spec.collection))
    ? await listIndexes(run, spec.collection)
    : [];

  const sameKeys = indexes.find((index) => sameKey(index.key, spec.fields));
  if (sameKeys) {
    const existingName = String(sameKeys.name);
    if (isFullyUnique(sameKeys)) {
      return { ...spec, status: 'present', existingName };
    }
    return {
      ...spec,
      status: 'conflict',
      existingName,
      detail: `${existingName} has the same keys but isn't unique for every record`,
    };
  }
  const sameName = indexes.find((index) => index.name === spec.name);
  if (sameName) {
    return {
      ...spec,
      status: 'conflict',
      existingName: spec.name,
      detail: `${spec.name} exists with different keys`,
    };
  }

  const duplicates = await findDuplicates(run, spec);
  if (duplicates.groups > 0) return { ...spec, status: 'duplicates', duplicates };
  if (dryRun) return { ...spec, status: 'missing' };

  try {
    await run({
      createIndexes: spec.collection,
      indexes: [
        {
          key: Object.fromEntries(spec.fields.map((f) => [f, 1])),
          name: spec.name,
          unique: true,
        },
      ],
    });
    return { ...spec, status: 'created' };
  } catch (err) {
    // Built meanwhile by someone else, e.g. Mongoose building its own indexes at startup.
    const now = (await listIndexes(run, spec.collection)).find(
      (index) => sameKey(index.key, spec.fields) && isFullyUnique(index)
    );
    if (now) return { ...spec, status: 'present', existingName: String(now.name) };
    // A record written since the check shares a key: report it the same way.
    if (isDuplicateKeyError(err)) {
      return { ...spec, status: 'duplicates', duplicates: await findDuplicates(run, spec) };
    }
    return { ...spec, status: 'failed', detail: errorText(err) };
  }
}

/** Checks every unique index in the schema, one at a time, and creates the missing ones. */
export async function ensureUniqueIndexes({
  run,
  models,
  dryRun = false,
}: EnsureUniqueIndexesOptions): Promise<UniqueIndexResult[]> {
  const results: UniqueIndexResult[] = [];
  for (const spec of uniqueIndexSpecs(models)) {
    try {
      results.push(await ensureOne(run, spec, dryRun));
    } catch (err) {
      results.push({ ...spec, status: 'failed', detail: errorText(err) });
    }
  }
  return results;
}

/** Results that need a person: shared keys, a conflicting index or a refused command. */
export const needsAttention = (results: UniqueIndexResult[]): UniqueIndexResult[] =>
  results.filter(
    (r) => r.status === 'duplicates' || r.status === 'conflict' || r.status === 'failed'
  );

/** One line per index, plus the shared keys found, for the script and the logs. */
export function formatUniqueIndexResults(results: UniqueIndexResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    const where = `${r.collection} (${r.fields.join(', ')})`;
    switch (r.status) {
      case 'present':
        lines.push(`present    ${where} as ${r.existingName}`);
        break;
      case 'missing':
        lines.push(`missing    ${where}, would create ${r.name}`);
        break;
      case 'created':
        lines.push(`created    ${where} as ${r.name}`);
        break;
      case 'duplicates':
        lines.push(
          `duplicates ${where}: ${r.duplicates?.groups ?? 0} key value(s) held by more than one record, not created`
        );
        for (const example of r.duplicates?.examples ?? []) {
          lines.push(`             ${JSON.stringify(example.key)} x${example.count}`);
        }
        break;
      default:
        lines.push(`${r.status.padEnd(10)} ${where}: ${r.detail ?? ''}`);
    }
  }
  return lines.join('\n');
}

/**
 * Runs at startup, so every database the backend serves gets the indexes it relies on,
 * including a new instance or one restored from a backup. Missing indexes are created;
 * anything that needs a person is logged and the server starts anyway, with that index
 * still missing, exactly as before.
 */
export async function createMissingUniqueIndexes(
  run: UniqueIndexRunCommand,
  models: readonly UniqueIndexModel[]
): Promise<UniqueIndexResult[]> {
  try {
    const results = await ensureUniqueIndexes({ run, models });
    const created = results.filter((r) => r.status === 'created');
    const attention = needsAttention(results);
    if (created.length > 0) {
      logger.info('Created missing unique indexes', {
        indexes: created.map((r) => `${r.collection} (${r.fields.join(', ')})`),
      });
    }
    if (attention.length > 0) {
      logger.error(
        `Unique indexes not created, run pnpm db:unique-indexes --dry-run for details:\n${formatUniqueIndexResults(attention)}`
      );
    }
    return results;
  } catch (err) {
    logger.error('Unique index check failed', { error: errorText(err) });
    return [];
  }
}
