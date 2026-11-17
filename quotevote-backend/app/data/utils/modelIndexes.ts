import type {
  DeclaredIndex,
  ExistingIndex,
  IndexConflict,
  IndexPlan,
  ModelIndexSource,
} from '~/types/modelIndexes';

/**
 * Model indexes for the switch (#716). With `autoIndex` off in production, starting the
 * backend never changes indexes; these helpers compare what the models declare with
 * what the database has, so the missing ones can be built on purpose, one at a time.
 */

const isText = (fields: DeclaredIndex['fields']): boolean =>
  Object.values(fields).some((dir) => dir === 'text');

/** Every index the models declare, normalized. `_id` is always there and left out. */
export function declaredIndexes(models: ModelIndexSource[]): DeclaredIndex[] {
  return models.flatMap(({ collection, indexes }) =>
    indexes.map(([fields, options]) => ({
      collection,
      fields: fields as DeclaredIndex['fields'],
      unique: options.unique === true,
      sparse: options.sparse === true,
      ...(typeof options.expireAfterSeconds === 'number'
        ? { expireAfterSeconds: options.expireAfterSeconds }
        : {}),
      ...(options.partialFilterExpression
        ? { partialFilterExpression: options.partialFilterExpression as Record<string, unknown> }
        : {}),
      ...(typeof options.name === 'string' ? { name: options.name } : {}),
    }))
  );
}

/** A comparable identity for a key: ordered fields, or the field set of a text index. */
function keyId(fields: Record<string, unknown>, weights?: Record<string, number>): string {
  if (fields._fts === 'text')
    return `text:${Object.keys(weights ?? {})
      .sort()
      .join(',')}`;
  if (Object.values(fields).includes('text')) {
    const textFields = Object.entries(fields).filter(([, dir]) => dir === 'text');
    return `text:${textFields
      .map(([field]) => field)
      .sort()
      .join(',')}`;
  }
  return Object.entries(fields)
    .map(([field, dir]) => `${field}:${String(dir)}`)
    .join(',');
}

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** How the existing index differs from the declared one, ignoring the TTL. */
function optionDiff(declared: DeclaredIndex, existing: ExistingIndex): string | null {
  if (declared.unique !== (existing.unique === true)) return 'unique differs';
  if (declared.sparse !== (existing.sparse === true)) return 'sparse differs';
  if (!same(declared.partialFilterExpression, existing.partialFilterExpression)) {
    return 'partial filter differs';
  }
  return null;
}

/** Compare declared indexes with each collection's existing ones. Changes nothing. */
export function planIndexes(
  declared: DeclaredIndex[],
  existing: Record<string, ExistingIndex[]>
): IndexPlan {
  const plan: IndexPlan = { missing: [], ttl: [], conflicts: [], present: 0 };
  const seen = new Map<string, DeclaredIndex>();

  for (const index of declared) {
    const id = `${index.collection}|${keyId(index.fields)}`;
    const earlier = seen.get(id);
    if (earlier) {
      if (!same(earlier, index)) {
        plan.conflicts.push({ declared: index, reason: 'declared twice with different options' });
      }
      continue;
    }
    seen.set(id, index);

    const match = (existing[index.collection] ?? []).find(
      (e) => keyId(e.key, e.weights) === keyId(index.fields)
    );
    if (!match) {
      plan.missing.push(index);
      continue;
    }
    const conflict = isText(index.fields) ? null : optionDiff(index, match);
    if (conflict) {
      plan.conflicts.push({ declared: index, existing: match, reason: conflict });
    } else if (index.expireAfterSeconds === match.expireAfterSeconds) {
      plan.present += 1;
    } else if (match.expireAfterSeconds === undefined) {
      plan.ttl.push(index);
    } else {
      plan.conflicts.push({ declared: index, existing: match, reason: 'TTL differs' });
    }
  }
  return plan;
}

/** `collection.field_1_other_-1`, for logs. */
export function describeIndex(index: DeclaredIndex): string {
  const key = Object.entries(index.fields)
    .map(([field, dir]) => `${field}_${dir}`)
    .join('_');
  const flags = [
    index.unique ? 'unique' : '',
    index.sparse ? 'sparse' : '',
    index.expireAfterSeconds !== undefined ? `ttl ${index.expireAfterSeconds}s` : '',
  ].filter(Boolean);
  return `${index.collection}.${index.name ?? key}${flags.length ? ` (${flags.join(', ')})` : ''}`;
}

export function describeConflict(conflict: IndexConflict): string {
  const existing = conflict.existing ? `, existing ${conflict.existing.name}` : '';
  return `${describeIndex(conflict.declared)}: ${conflict.reason}${existing}`;
}

/** Options for `createIndex`, only the ones the model sets. */
export function createIndexOptions(index: DeclaredIndex): Record<string, unknown> {
  return {
    ...(index.unique ? { unique: true } : {}),
    ...(index.sparse ? { sparse: true } : {}),
    ...(index.expireAfterSeconds !== undefined
      ? { expireAfterSeconds: index.expireAfterSeconds }
      : {}),
    ...(index.partialFilterExpression
      ? { partialFilterExpression: index.partialFilterExpression }
      : {}),
    ...(index.name ? { name: index.name } : {}),
  };
}

/** The collMod that adds the declared TTL to the existing index on the same key (#714). */
export function ttlCommand(index: DeclaredIndex): Record<string, unknown> {
  return {
    collMod: index.collection,
    index: { keyPattern: index.fields, expireAfterSeconds: index.expireAfterSeconds },
  };
}
