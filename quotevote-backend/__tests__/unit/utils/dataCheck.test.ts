import { Prisma } from '@prisma/client';
import {
  buildShapeChecks,
  compareReports,
  formatSummary,
  runDataCheck,
} from '~/data/utils/dataCheck';
import type {
  DataCheckEnum,
  DataCheckField,
  DataCheckModel,
  DataCheckReport,
  ShapeCheck,
} from '~/types/dataCheck';

const field = (overrides: Partial<DataCheckField> & { name: string }): DataCheckField => ({
  kind: 'scalar',
  type: 'String',
  isList: false,
  isRequired: false,
  isId: false,
  hasDefaultValue: false,
  ...overrides,
});

const MODELS: DataCheckModel[] = [
  {
    name: 'Widget',
    dbName: 'widgets',
    fields: [
      field({ name: 'id', dbName: '_id', isId: true, isRequired: true, hasDefaultValue: true }),
      field({ name: 'title', isRequired: true }),
      field({
        name: 'status',
        kind: 'enum',
        type: 'WidgetStatus',
        isRequired: true,
        hasDefaultValue: true,
        default: 'active',
      }),
      field({ name: 'score', type: 'Int', isRequired: true, hasDefaultValue: true, default: 0 }),
      field({
        name: 'createdAt',
        type: 'DateTime',
        isRequired: true,
        hasDefaultValue: true,
        default: { name: 'now', args: [] },
      }),
      field({ name: 'updatedAt', type: 'DateTime', isRequired: true, isUpdatedAt: true }),
      field({ name: 'hidden', type: 'Boolean' }),
      field({ name: 'ownerIds', dbName: '_ownerIds', isList: true, isRequired: true }),
      field({ name: 'settings', type: 'Json' }),
      field({ name: 'owner', kind: 'object', type: 'User', isRequired: true }),
      field({ name: 'meta', kind: 'object', type: 'WidgetMeta' }),
    ],
  },
];

const ENUMS: DataCheckEnum[] = [
  { name: 'WidgetStatus', values: [{ name: 'active' }, { name: 'archived' }] },
];

const find = (checks: ShapeCheck[], fieldName: string, problem: string): ShapeCheck | undefined =>
  checks.find((c) => c.field === fieldName && c.problem === problem);

describe('buildShapeChecks', () => {
  const checks = buildShapeChecks(MODELS, ENUMS);

  it('flags a missing required field with no default', () => {
    expect(find(checks, 'title', 'missing-required')?.filter).toEqual({ title: null });
  });

  it('treats now() and @updatedAt like no default, since reads do not fill them', () => {
    expect(find(checks, 'createdAt', 'missing-required')).toBeDefined();
    expect(find(checks, 'updatedAt', 'missing-required')).toBeDefined();
  });

  it('flags a missing field with a static default as filled in, not missing', () => {
    expect(find(checks, 'status', 'default-filled')).toBeDefined();
    expect(find(checks, 'score', 'default-filled')).toBeDefined();
    expect(find(checks, 'status', 'missing-required')).toBeUndefined();
  });

  it('checks stored types against what Prisma converts', () => {
    expect(find(checks, 'score', 'wrong-type')?.filter).toEqual({
      score: { $exists: true, $ne: null, $not: { $type: ['int', 'long', 'double'] } },
    });
    expect(find(checks, 'hidden', 'wrong-type')?.filter).toEqual({
      hidden: { $exists: true, $ne: null, $not: { $type: ['bool'] } },
    });
  });

  it('checks enum values against the enum', () => {
    expect(find(checks, 'status', 'unknown-enum')?.filter).toEqual({
      status: { $exists: true, $ne: null, $nin: ['active', 'archived'] },
    });
  });

  it('checks lists by their stored name, and never asks for a missing list', () => {
    expect(find(checks, '_ownerIds', 'not-a-list')).toBeDefined();
    expect(find(checks, '_ownerIds', 'wrong-list-element')?.filter).toEqual({
      _ownerIds: { $elemMatch: { $not: { $type: ['string', 'objectId'] } } },
    });
    expect(find(checks, '_ownerIds', 'missing-required')).toBeUndefined();
    expect(find(checks, '_ownerIds', 'default-filled')).toBeUndefined();
  });

  it('skips ids, relations, composite types and Json', () => {
    const fields = new Set(checks.map((c) => c.field));
    for (const skipped of ['_id', 'id', 'owner', 'meta', 'settings']) {
      expect(fields.has(skipped)).toBe(false);
    }
  });

  it('uses the collection name, not the model name', () => {
    expect(new Set(checks.map((c) => c.collection))).toEqual(new Set(['widgets']));
  });

  describe('against the real schema', () => {
    const real = buildShapeChecks(
      Prisma.dmmf.datamodel.models as unknown as DataCheckModel[],
      Prisma.dmmf.datamodel.enums as unknown as DataCheckEnum[]
    );
    const at = (collection: string, fieldName: string, problem: string): boolean =>
      real.some(
        (c) => c.collection === collection && c.field === fieldName && c.problem === problem
      );

    it('finds the known legacy traps', () => {
      // Legacy accounts before accountStatus existed read as active but don't match filters.
      expect(at('users', 'accountStatus', 'default-filled')).toBe(true);
      // Legacy presence records have no createdAt, which breaks whole-record reads.
      expect(at('presences', 'createdAt', 'missing-required')).toBe(true);
      // Older messages have no deleted flag.
      expect(at('messages', 'deleted', 'default-filled')).toBe(true);
    });

    it('uses mapped field names', () => {
      expect(at('posts', 'groupId', 'missing-required')).toBe(true);
      expect(at('users', '_followingId', 'not-a-list')).toBe(true);
    });
  });
});

/** A fake database that answers the commands the check sends. */
function fakeDatabase(collections: Record<string, Array<Record<string, unknown>>>) {
  const matches = (doc: Record<string, unknown>, filter: Record<string, unknown>): boolean =>
    Object.entries(filter).every(([key, condition]) => {
      const value = doc[key];
      if (condition === null) return value === null || value === undefined;
      const c = condition as Record<string, unknown>;
      if ('$nin' in c) {
        return value !== undefined && value !== null && !(c.$nin as unknown[]).includes(value);
      }
      if ('$elemMatch' in c)
        return Array.isArray(value) && value.some((v) => typeof v !== 'string');
      if ('$not' in c) {
        const types = (c.$not as { $type: string[] | string }).$type;
        if (types === 'array')
          return value !== undefined && value !== null && !Array.isArray(value);
        const bson =
          value instanceof Date
            ? 'date'
            : typeof value === 'boolean'
              ? 'bool'
              : typeof value === 'number'
                ? 'int'
                : typeof value;
        return value !== undefined && value !== null && !(types as string[]).includes(bson);
      }
      return false;
    });

  const commands: Array<Record<string, unknown>> = [];
  const run = jest.fn(async (command: Record<string, unknown>) => {
    commands.push(command);
    if (command.listCollections) {
      return { cursor: { firstBatch: Object.keys(collections).map((name) => ({ name })) } };
    }
    if (command.listIndexes) {
      return {
        cursor: {
          firstBatch: [
            { v: 2, key: { _id: 1 }, name: '_id_' },
            { v: 2, key: { title: 1 }, name: 'title_1', unique: true },
          ],
        },
      };
    }
    const docs = collections[command.aggregate as string] ?? [];
    const pipeline = command.pipeline as Array<Record<string, unknown>>;
    const stage = pipeline[0];
    if ('$count' in stage)
      return { cursor: { firstBatch: [{ n: { $numberLong: String(docs.length) } }] } };
    if ('$facet' in stage) {
      const row: Record<string, unknown> = {};
      for (const [key, branch] of Object.entries(stage.$facet as Record<string, unknown[]>)) {
        const filter = (branch[0] as { $match: Record<string, unknown> }).$match;
        const n = docs.filter((d) => matches(d, filter)).length;
        row[key] = n ? [{ n }] : [];
      }
      return { cursor: { firstBatch: [row] } };
    }
    // follows: $match + $group summing list sizes
    const n = docs.reduce(
      (sum, d) => sum + (Array.isArray(d._followingId) ? d._followingId.length : 0),
      0
    );
    return { cursor: { firstBatch: [{ _id: null, n }] } };
  });
  return { run, commands };
}

describe('runDataCheck', () => {
  const now = new Date('2026-11-10T12:00:00Z');

  it('counts documents, lists indexes and counts problem records', async () => {
    const { run } = fakeDatabase({
      widgets: [
        { title: 'ok', status: 'active', score: 1, createdAt: new Date(), updatedAt: new Date() },
        { status: 'gone', score: 2 },
        { title: 'no status', hidden: 'yes', _ownerIds: 'abc' },
      ],
      legacy_only: [{}, {}],
    });

    const report = await runDataCheck({
      run,
      database: 'qv_test',
      models: MODELS,
      enums: ENUMS,
      now,
    });

    expect(report.database).toBe('qv_test');
    expect(report.generatedAt).toBe('2026-11-10T12:00:00.000Z');
    expect(report.collections.widgets.count).toBe(3);
    expect(report.collections.legacy_only).toEqual(
      expect.objectContaining({ count: 2, issues: [] })
    );
    expect(report.collections.widgets.indexes).toEqual([
      { name: '_id_', key: { _id: 1 } },
      { name: 'title_1', key: { title: 1 }, unique: true },
    ]);

    const issues = Object.fromEntries(
      report.collections.widgets.issues.map((i) => [`${i.field} ${i.problem}`, i.count])
    );
    expect(issues).toEqual({
      'title missing-required': 1,
      'status default-filled': 1,
      'status unknown-enum': 1,
      'score default-filled': 1,
      'createdAt missing-required': 2,
      'updatedAt missing-required': 2,
      'hidden wrong-type': 1,
      '_ownerIds not-a-list': 1,
    });
  });

  it('reports the #183 records, follows, and mapped collections that are missing', async () => {
    const { run } = fakeDatabase({
      users: [{ _followingId: ['a', 'b'] }, { _followingId: ['c'] }, {}],
      posts: [{}],
    });
    const models: DataCheckModel[] = [
      { name: 'User', dbName: 'users', fields: [] },
      { name: 'Post', dbName: 'posts', fields: [] },
      { name: 'Vote', dbName: 'votes', fields: [] },
    ];

    const report = await runDataCheck({ run, database: 'qv', models, enums: [], now });

    expect(report.records).toEqual(
      expect.objectContaining({ accounts: 3, posts: 1, votes: 0, follows: 3 })
    );
    expect(report.missingCollections).toEqual(['votes']);
  });

  it('only sends read commands', async () => {
    const { run, commands } = fakeDatabase({ widgets: [{}], users: [{}] });
    await runDataCheck({ run, database: 'qv', models: MODELS, enums: ENUMS, now });

    const allowedCommands = new Set(['listCollections', 'listIndexes', 'aggregate']);
    const allowedStages = new Set(['$match', '$count', '$facet', '$group']);
    for (const command of commands) {
      const name = Object.keys(command)[0];
      expect(allowedCommands.has(name)).toBe(true);
      for (const stage of (command.pipeline as Array<Record<string, unknown>>) ?? []) {
        expect(allowedStages.has(Object.keys(stage)[0])).toBe(true);
      }
    }
  });
});

const report = (overrides: Partial<DataCheckReport> = {}): DataCheckReport => ({
  tool: 'data-check',
  version: 1,
  database: 'qv',
  generatedAt: '2026-11-10T12:00:00.000Z',
  records: { accounts: 2, follows: 1 },
  collections: {
    users: {
      count: 2,
      indexes: [
        { name: '_id_', key: { _id: 1 } },
        { name: 'username_1', key: { username: 1 }, unique: true },
      ],
      issues: [{ model: 'User', field: 'accountStatus', problem: 'default-filled', count: 1 }],
    },
  },
  missingCollections: [],
  ...overrides,
});

describe('compareReports', () => {
  it('finds no differences between identical reports', () => {
    expect(compareReports(report(), report())).toEqual([]);
  });

  it('ignores the order of index options but not of index keys', () => {
    const reordered = report();
    reordered.collections.users.indexes[1] = {
      unique: true,
      key: { username: 1 },
      name: 'username_1',
    } as never;
    expect(compareReports(report(), reordered)).toEqual([]);

    const keys = report();
    keys.collections.users.indexes.push({ name: 'a_b', key: { a: 1, b: 1 } });
    const swapped = report();
    swapped.collections.users.indexes.push({ name: 'a_b', key: { b: 1, a: 1 } });
    expect(compareReports(keys, swapped)).toEqual(['users: index a_b changed']);
  });

  it('lists count, index, problem and follow differences', () => {
    const after = report({ records: { accounts: 3, follows: 4 } });
    after.collections.users = {
      count: 3,
      indexes: [
        { name: '_id_', key: { _id: 1 } },
        { name: 'username_1', key: { username: 1 } },
        { name: 'email_1', key: { email: 1 } },
      ],
      issues: [],
    };
    after.collections.posts = { count: 0, indexes: [], issues: [] };

    expect(compareReports(report(), after)).toEqual([
      'posts: collection only in the second report',
      'users: 2 documents, then 3',
      'users: index username_1 changed',
      'users: index email_1 added',
      'users: accountStatus default-filled 1, then 0',
      'follows: 1, then 4',
    ]);
  });

  it('compares only indexes when asked', () => {
    const after = report({ records: { accounts: 9, follows: 9 } });
    after.collections.users = { ...after.collections.users, count: 9, issues: [] };
    expect(compareReports(report(), after, { indexesOnly: true })).toEqual([]);

    after.collections.users.indexes = [{ name: '_id_', key: { _id: 1 } }];
    expect(compareReports(report(), after, { indexesOnly: true })).toEqual([
      'users: index username_1 removed',
    ]);
  });
});

describe('formatSummary', () => {
  it("separates values Prisma can't read from values read as the default", () => {
    const r = report();
    r.collections.users.issues.push({
      model: 'User',
      field: 'email',
      problem: 'missing-required',
      count: 2,
    });
    r.missingCollections = ['votes'];

    const text = formatSummary(r);
    expect(text).toContain('accounts: 2');
    expect(text).toContain(
      "Values Prisma can't read (a read that includes the field fails):\n  users.email: 2 (missing-required)"
    );
    expect(text).toContain(
      'Missing values read as the default (filters on the field skip them):\n  users.accountStatus: 1'
    );
    expect(text).toContain('Collections not in the database yet: votes');
  });

  it('says none when there is nothing to fix', () => {
    const r = report();
    r.collections.users.issues = [];
    expect(formatSummary(r)).toContain(
      "Values Prisma can't read (a read that includes the field fails): none"
    );
  });
});
