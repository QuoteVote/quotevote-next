/**
 * Read-only data check for a restored database (#183).
 *
 * Records the number of documents and the index list of every collection, and counts the
 * records whose stored values the Prisma client can't convert, or reads as a default. The
 * checks come from the Prisma schema, so they follow it as models change. Two reports can be
 * compared, e.g. a backup against its restored copy, or the index lists before and after the
 * switch.
 *
 * Only read commands are sent (`listCollections`, `listIndexes`, `aggregate` with `$match`,
 * `$count`, `$facet` and `$group`), and reports hold counts, field names and index keys,
 * never document contents.
 */
import type {
  CollectionReport,
  CompareOptions,
  DataCheckEnum,
  DataCheckField,
  DataCheckModel,
  DataCheckReport,
  FieldIssue,
  IndexSummary,
  RunCommand,
  ShapeCheck,
} from '~/types/dataCheck';

/** BSON types the Prisma client converts without an error, per Prisma scalar type. */
const READABLE_BSON_TYPES: Record<string, string[]> = {
  String: ['string', 'objectId'],
  Int: ['int', 'long', 'double'],
  BigInt: ['int', 'long', 'double'],
  Float: ['double', 'int', 'long', 'decimal'],
  Decimal: ['double', 'int', 'long', 'decimal'],
  Boolean: ['bool'],
  DateTime: ['date'],
  Bytes: ['binData'],
};

/** The records #183 asks to be counted, by name, and the collection each lives in. */
export const RECORD_COLLECTIONS: Record<string, string> = {
  accounts: 'users',
  posts: 'posts',
  votes: 'votes',
  comments: 'comments',
  quotes: 'quotes',
  conversations: 'messagerooms',
  messages: 'messages',
  buddyRelationships: 'buddyrelationships',
  userBlocks: 'userblocks',
  tags: 'groups',
  notifications: 'notifications',
  invites: 'userinvites',
};

/** Follows are stored as a list on each account, so they're counted separately. */
const FOLLOWS_COLLECTION = 'users';
const FOLLOWS_FIELD = '_followingId';

/**
 * A static default (`@default(0)`, `@default(active)`) is filled in when the field is missing
 * or null. Function defaults (`now()`, `auto()`) and `@updatedAt` are not.
 */
function hasStaticDefault(field: DataCheckField): boolean {
  if (!field.hasDefaultValue || field.isUpdatedAt) return false;
  const value = field.default;
  return value === null || typeof value !== 'object' || Array.isArray(value);
}

function enumValues(enums: DataCheckEnum[], name: string): string[] {
  const found = enums.find((e) => e.name === name);
  return found ? found.values.map((v) => v.dbName ?? v.name) : [];
}

/** Builds one query per field and problem from the Prisma datamodel. */
export function buildShapeChecks(models: DataCheckModel[], enums: DataCheckEnum[]): ShapeCheck[] {
  const checks: ShapeCheck[] = [];

  for (const model of models) {
    const collection = model.dbName ?? model.name;

    for (const field of model.fields) {
      // Relations and composite types aren't stored as plain scalars; ids are always readable.
      if (field.isId || (field.kind !== 'scalar' && field.kind !== 'enum')) continue;

      const column = field.dbName ?? field.name;
      const add = (problem: ShapeCheck['problem'], filter: Record<string, unknown>): void => {
        checks.push({ collection, model: model.name, field: column, problem, filter });
      };

      const readable =
        field.kind === 'enum' ? ['string'] : (READABLE_BSON_TYPES[field.type] ?? null);

      if (field.isList) {
        // A missing or null list reads as an empty list.
        add('not-a-list', { [column]: { $exists: true, $ne: null, $not: { $type: 'array' } } });
        if (readable) {
          add('wrong-list-element', { [column]: { $elemMatch: { $not: { $type: readable } } } });
        }
        continue;
      }

      if (field.isRequired) {
        add(hasStaticDefault(field) ? 'default-filled' : 'missing-required', { [column]: null });
      }

      if (field.kind === 'enum') {
        const values = enumValues(enums, field.type);
        add('unknown-enum', { [column]: { $exists: true, $ne: null, $nin: values } });
      } else if (readable) {
        add('wrong-type', { [column]: { $exists: true, $ne: null, $not: { $type: readable } } });
      }
    }
  }

  return checks;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object') {
    const wrapped = value as Record<string, unknown>;
    for (const key of ['$numberInt', '$numberLong', '$numberDouble']) {
      if (key in wrapped) return Number(wrapped[key]);
    }
  }
  return 0;
}

function firstBatch(result: unknown): Array<Record<string, unknown>> {
  const cursor = (result as { cursor?: { firstBatch?: unknown } } | null)?.cursor;
  return Array.isArray(cursor?.firstBatch)
    ? (cursor.firstBatch as Array<Record<string, unknown>>)
    : [];
}

async function listCollections(run: RunCommand): Promise<string[]> {
  const result = await run({
    listCollections: 1,
    nameOnly: true,
    filter: { type: 'collection' },
    // Large enough that the names arrive in one batch.
    cursor: { batchSize: 10000 },
  });
  return firstBatch(result)
    .map((c) => String(c.name))
    .filter((name) => !name.startsWith('system.'))
    .sort();
}

async function listIndexes(run: RunCommand, collection: string): Promise<IndexSummary[]> {
  const result = await run({ listIndexes: collection, cursor: { batchSize: 1000 } });
  return firstBatch(result)
    .map((raw) => {
      const index: IndexSummary = {
        name: String(raw.name),
        key: raw.key as Record<string, unknown>,
      };
      if (raw.unique !== undefined) index.unique = Boolean(raw.unique);
      if (raw.sparse !== undefined) index.sparse = Boolean(raw.sparse);
      if (raw.expireAfterSeconds !== undefined) {
        index.expireAfterSeconds = toNumber(raw.expireAfterSeconds);
      }
      if (raw.partialFilterExpression !== undefined) {
        index.partialFilterExpression = raw.partialFilterExpression as Record<string, unknown>;
      }
      return index;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function countAll(run: RunCommand, collection: string): Promise<number> {
  // `$count` scans, unlike the `count` command without a filter, which reads collection
  // metadata that can be off after an unclean shutdown.
  const result = await run({
    aggregate: collection,
    pipeline: [{ $count: 'n' }],
    cursor: {},
  });
  return toNumber(firstBatch(result)[0]?.n);
}

async function countIssues(
  run: RunCommand,
  collection: string,
  checks: ShapeCheck[]
): Promise<FieldIssue[]> {
  if (checks.length === 0) return [];

  // One pass over the collection: each check is a branch of the same `$facet`.
  const facet: Record<string, unknown[]> = {};
  checks.forEach((check, i) => {
    facet[`c${i}`] = [{ $match: check.filter }, { $count: 'n' }];
  });
  const result = await run({ aggregate: collection, pipeline: [{ $facet: facet }], cursor: {} });
  const row = firstBatch(result)[0] ?? {};

  return checks
    .map((check, i) => {
      const branch = row[`c${i}`];
      const count = Array.isArray(branch) ? toNumber((branch[0] as { n?: unknown })?.n) : 0;
      return { model: check.model, field: check.field, problem: check.problem, count };
    })
    .filter((issue) => issue.count > 0);
}

async function countFollows(run: RunCommand): Promise<number> {
  const result = await run({
    aggregate: FOLLOWS_COLLECTION,
    pipeline: [
      { $match: { [FOLLOWS_FIELD]: { $type: 'array' } } },
      { $group: { _id: null, n: { $sum: { $size: `$${FOLLOWS_FIELD}` } } } },
    ],
    cursor: {},
  });
  return toNumber(firstBatch(result)[0]?.n);
}

export async function runDataCheck(options: {
  run: RunCommand;
  database: string;
  models: DataCheckModel[];
  enums: DataCheckEnum[];
  now?: Date;
}): Promise<DataCheckReport> {
  const { run, database, models, enums } = options;
  const existing = await listCollections(run);
  const checks = buildShapeChecks(models, enums);

  const collections: Record<string, CollectionReport> = {};
  for (const name of existing) {
    collections[name] = {
      count: await countAll(run, name),
      indexes: await listIndexes(run, name),
      issues: await countIssues(
        run,
        name,
        checks.filter((c) => c.collection === name)
      ),
    };
  }

  const records: Record<string, number> = {};
  for (const [label, collection] of Object.entries(RECORD_COLLECTIONS)) {
    records[label] = collections[collection]?.count ?? 0;
  }
  records.follows = existing.includes(FOLLOWS_COLLECTION) ? await countFollows(run) : 0;

  const mapped = [...new Set(models.map((m) => m.dbName ?? m.name))];
  return {
    tool: 'data-check',
    version: 1,
    database,
    generatedAt: (options.now ?? new Date()).toISOString(),
    records,
    collections,
    missingCollections: mapped.filter((name) => !existing.includes(name)).sort(),
  };
}

/** Stable JSON, so the same index compares equal whatever order the server lists its keys. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Index key order matters, so the key is compared as stored; everything else canonically. */
function indexSignature(index: IndexSummary): string {
  const { key, ...rest } = index;
  return `${JSON.stringify(Object.entries(key))}|${canonical(rest)}`;
}

function issueKey(issue: FieldIssue): string {
  return `${issue.field} ${issue.problem}`;
}

/** Lists every difference between two reports. An empty list means they match. */
export function compareReports(
  before: DataCheckReport,
  after: DataCheckReport,
  options: CompareOptions = {}
): string[] {
  const differences: string[] = [];
  const names = [
    ...new Set([...Object.keys(before.collections), ...Object.keys(after.collections)]),
  ].sort();

  for (const name of names) {
    const a = before.collections[name];
    const b = after.collections[name];
    if (!a) {
      differences.push(`${name}: collection only in the second report`);
      continue;
    }
    if (!b) {
      differences.push(`${name}: collection only in the first report`);
      continue;
    }

    if (!options.indexesOnly && a.count !== b.count) {
      differences.push(`${name}: ${a.count} documents, then ${b.count}`);
    }

    const aIndexes = new Map(a.indexes.map((i) => [i.name, i]));
    const bIndexes = new Map(b.indexes.map((i) => [i.name, i]));
    for (const [indexName, index] of aIndexes) {
      const other = bIndexes.get(indexName);
      if (!other) differences.push(`${name}: index ${indexName} removed`);
      else if (indexSignature(index) !== indexSignature(other)) {
        differences.push(`${name}: index ${indexName} changed`);
      }
    }
    for (const indexName of bIndexes.keys()) {
      if (!aIndexes.has(indexName)) differences.push(`${name}: index ${indexName} added`);
    }

    if (!options.indexesOnly) {
      const aIssues = new Map(a.issues.map((i) => [issueKey(i), i.count]));
      const bIssues = new Map(b.issues.map((i) => [issueKey(i), i.count]));
      for (const key of [...new Set([...aIssues.keys(), ...bIssues.keys()])].sort()) {
        const from = aIssues.get(key) ?? 0;
        const to = bIssues.get(key) ?? 0;
        if (from !== to) differences.push(`${name}: ${key} ${from}, then ${to}`);
      }
    }
  }

  if (!options.indexesOnly && before.records.follows !== after.records.follows) {
    differences.push(`follows: ${before.records.follows}, then ${after.records.follows}`);
  }

  return differences;
}

/** A short plain-text summary of a report for the terminal. */
export function formatSummary(report: DataCheckReport): string {
  const lines = [`Data check of ${report.database} at ${report.generatedAt}`, '', 'Records:'];
  for (const [label, count] of Object.entries(report.records)) {
    lines.push(`  ${label}: ${count}`);
  }

  const issues = Object.entries(report.collections).flatMap(([name, c]) =>
    c.issues.map((issue) => ({ name, ...issue }))
  );
  const failing = issues.filter((i) => i.problem !== 'default-filled');
  const filled = issues.filter((i) => i.problem === 'default-filled');

  lines.push(
    '',
    `Values Prisma can't read (a read that includes the field fails):${failing.length ? '' : ' none'}`
  );
  for (const i of failing) lines.push(`  ${i.name}.${i.field}: ${i.count} (${i.problem})`);
  lines.push(
    '',
    `Missing values read as the default (filters on the field skip them):${filled.length ? '' : ' none'}`
  );
  for (const i of filled) lines.push(`  ${i.name}.${i.field}: ${i.count}`);

  if (report.missingCollections.length) {
    lines.push('', `Collections not in the database yet: ${report.missingCollections.join(', ')}`);
  }
  return lines.join('\n');
}
