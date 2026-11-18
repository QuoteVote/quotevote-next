jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { Prisma } from '@prisma/client';
import {
  createMissingUniqueIndexes,
  ensureUniqueIndexes,
  formatUniqueIndexResults,
  needsAttention,
  uniqueIndexSpecs,
} from '~/data/utils/uniqueIndexes';
import { logger } from '~/data/utils/logger';
import type { UniqueIndexModel } from '~/types/uniqueIndexes';

interface FakeIndex {
  name: string;
  key: Record<string, unknown>;
  unique?: boolean;
  partialFilterExpression?: Record<string, unknown>;
}

interface FakeCollection {
  indexes: FakeIndex[];
  /** Rows the duplicate check returns: key values held by more than one record. */
  duplicates?: { _id: Record<string, unknown>; count: number }[];
}

/** A database that answers the commands the check sends. */
function fakeDatabase(collections: Record<string, FakeCollection>) {
  const run = jest.fn(async (command: Record<string, unknown>): Promise<unknown> => {
    if (command.listCollections) {
      const name = (command.filter as { name: string }).name;
      return { cursor: { firstBatch: collections[name] ? [{ name }] : [] } };
    }
    if (typeof command.listIndexes === 'string') {
      return { cursor: { firstBatch: collections[command.listIndexes]?.indexes ?? [] } };
    }
    if (typeof command.aggregate === 'string') {
      const duplicates = collections[command.aggregate]?.duplicates ?? [];
      return {
        cursor: {
          firstBatch: [
            {
              groups: duplicates.length ? [{ n: duplicates.length }] : [],
              examples: duplicates,
            },
          ],
        },
      };
    }
    if (typeof command.createIndexes === 'string') {
      const collection = (collections[command.createIndexes] ??= { indexes: [] });
      collection.indexes.push(...(command.indexes as FakeIndex[]));
      return { ok: 1 };
    }
    throw new Error(`unexpected command ${JSON.stringify(command)}`);
  });
  const sent = (name: string) => run.mock.calls.filter(([c]) => name in c).map(([c]) => c);
  return { run, sent };
}

const model = (overrides: Partial<UniqueIndexModel>): UniqueIndexModel => ({
  name: 'Model',
  dbName: null,
  fields: [],
  uniqueIndexes: [],
  ...overrides,
});

const buddies = model({
  name: 'BuddyRelationship',
  dbName: 'buddyrelationships',
  fields: [{ name: 'pairKey', isUnique: true }],
});

const blocks = model({
  name: 'UserBlock',
  dbName: 'userblocks',
  fields: [
    { name: 'blockerId', isUnique: false },
    { name: 'blockedUserId', isUnique: false },
  ],
  uniqueIndexes: [{ name: null, fields: ['blockerId', 'blockedUserId'] }],
});

const botReports = model({
  name: 'BotReport',
  dbName: 'botreports',
  fields: [
    { name: 'reporterId', dbName: '_reporterId', isUnique: false },
    { name: 'userId', dbName: '_reportedUserId', isUnique: false },
  ],
  uniqueIndexes: [{ name: null, fields: ['reporterId', 'userId'] }],
});

describe('unique indexes (#694)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uniqueIndexSpecs', () => {
    it('reads @unique fields and @@unique lists in stored names', () => {
      expect(uniqueIndexSpecs([buddies, blocks, botReports])).toEqual([
        {
          model: 'BuddyRelationship',
          collection: 'buddyrelationships',
          name: 'BuddyRelationship_pairKey_key',
          fields: ['pairKey'],
        },
        {
          model: 'UserBlock',
          collection: 'userblocks',
          name: 'UserBlock_blockerId_blockedUserId_key',
          fields: ['blockerId', 'blockedUserId'],
        },
        {
          model: 'BotReport',
          collection: 'botreports',
          name: 'BotReport_reporterId_userId_key',
          fields: ['_reporterId', '_reportedUserId'],
        },
      ]);
    });

    it('covers the indexes duplicate protection relies on in the real schema', () => {
      const specs = uniqueIndexSpecs(
        Prisma.dmmf.datamodel.models as unknown as UniqueIndexModel[]
      ).map((s) => `${s.collection}:${s.fields.join('+')}`);

      expect(specs).toEqual(
        expect.arrayContaining([
          'buddyrelationships:pairKey',
          'userblocks:blockerId+blockedUserId',
          'terms_acceptances:userId+termsVersion',
        ])
      );
    });
  });

  describe('ensureUniqueIndexes', () => {
    it('counts an existing unique index with the same keys as present, whatever its name', async () => {
      const db = fakeDatabase({
        botreports: {
          indexes: [
            { name: '_id_', key: { _id: 1 } },
            {
              name: '_reporterId_1__reportedUserId_1',
              key: { _reporterId: { $numberInt: '1' }, _reportedUserId: 1 },
              unique: true,
            },
          ],
        },
      });

      const [result] = await ensureUniqueIndexes({ run: db.run, models: [botReports] });

      expect(result).toMatchObject({
        status: 'present',
        existingName: '_reporterId_1__reportedUserId_1',
      });
      expect(db.sent('aggregate')).toHaveLength(0);
      expect(db.sent('createIndexes')).toHaveLength(0);
    });

    it('creates a missing index when no records share a key', async () => {
      const db = fakeDatabase({
        buddyrelationships: { indexes: [{ name: '_id_', key: { _id: 1 } }] },
      });

      const [result] = await ensureUniqueIndexes({ run: db.run, models: [buddies] });

      expect(result.status).toBe('created');
      expect(db.sent('createIndexes')).toEqual([
        {
          createIndexes: 'buddyrelationships',
          indexes: [{ key: { pairKey: 1 }, name: 'BuddyRelationship_pairKey_key', unique: true }],
        },
      ]);
    });

    it('checks for shared keys counting a missing field as null', async () => {
      const db = fakeDatabase({ userblocks: { indexes: [] } });

      await ensureUniqueIndexes({ run: db.run, models: [blocks] });

      const [aggregate] = db.sent('aggregate') as { pipeline: Record<string, unknown>[] }[];
      expect(aggregate.pipeline[0]).toEqual({
        $group: {
          _id: {
            blockerId: { $ifNull: ['$blockerId', null] },
            blockedUserId: { $ifNull: ['$blockedUserId', null] },
          },
          count: { $sum: 1 },
        },
      });
    });

    it('creates the index on a collection that has no records yet', async () => {
      const db = fakeDatabase({});

      const [result] = await ensureUniqueIndexes({ run: db.run, models: [buddies] });

      expect(result.status).toBe('created');
      expect(db.sent('listIndexes')).toHaveLength(0);
    });

    it('stops before creating an index when records share a key, and lists them', async () => {
      const shared = { _id: { pairKey: 'a:b' }, count: 2 };
      const db = fakeDatabase({ buddyrelationships: { indexes: [], duplicates: [shared] } });

      const results = await ensureUniqueIndexes({ run: db.run, models: [buddies] });

      expect(results[0]).toMatchObject({
        status: 'duplicates',
        duplicates: { groups: 1, examples: [{ key: { pairKey: 'a:b' }, count: 2 }] },
      });
      expect(db.sent('createIndexes')).toHaveLength(0);
      expect(needsAttention(results)).toHaveLength(1);
      expect(formatUniqueIndexResults(results)).toContain('{"pairKey":"a:b"} x2');
    });

    it('creates nothing on a dry run', async () => {
      const db = fakeDatabase({ buddyrelationships: { indexes: [] } });

      const results = await ensureUniqueIndexes({ run: db.run, models: [buddies], dryRun: true });

      expect(results[0].status).toBe('missing');
      expect(db.sent('createIndexes')).toHaveLength(0);
      expect(needsAttention(results)).toHaveLength(0);
    });

    it.each([
      ['not unique', { name: 'pairKey_1', key: { pairKey: 1 } }],
      [
        'unique for some records only',
        {
          name: 'pairKey_1',
          key: { pairKey: 1 },
          unique: true,
          partialFilterExpression: { status: 'accepted' },
        },
      ],
      ['named the same with other keys', { name: 'BuddyRelationship_pairKey_key', key: { a: 1 } }],
    ])('leaves an existing index that is %s alone and reports it', async (_label, index) => {
      const db = fakeDatabase({ buddyrelationships: { indexes: [index] } });

      const results = await ensureUniqueIndexes({ run: db.run, models: [buddies] });

      expect(results[0].status).toBe('conflict');
      expect(db.sent('createIndexes')).toHaveLength(0);
      expect(needsAttention(results)).toHaveLength(1);
    });

    it('treats the same fields in another order as a different index', async () => {
      const db = fakeDatabase({
        userblocks: {
          indexes: [{ name: 'reversed', key: { blockedUserId: 1, blockerId: 1 }, unique: true }],
        },
      });

      const [result] = await ensureUniqueIndexes({ run: db.run, models: [blocks] });

      expect(result.status).toBe('created');
    });

    it('reports a record written between the check and the create as a shared key', async () => {
      const db = fakeDatabase({ buddyrelationships: { indexes: [] } });
      const answer = db.run.getMockImplementation()!;
      db.run.mockImplementation(async (command) => {
        if (command.createIndexes) {
          throw new Error('E11000 duplicate key error collection: buddyrelationships');
        }
        return answer(command);
      });

      const [result] = await ensureUniqueIndexes({ run: db.run, models: [buddies] });

      expect(result.status).toBe('duplicates');
    });

    it('counts an index built meanwhile by someone else as present', async () => {
      const collections: Record<string, FakeCollection> = { buddyrelationships: { indexes: [] } };
      const db = fakeDatabase(collections);
      const answer = db.run.getMockImplementation()!;
      db.run.mockImplementation(async (command) => {
        if (command.createIndexes) {
          collections.buddyrelationships.indexes.push({
            name: 'pairKey_1',
            key: { pairKey: 1 },
            unique: true,
          });
          throw new Error('Index already exists with a different name: pairKey_1');
        }
        return answer(command);
      });

      const [result] = await ensureUniqueIndexes({ run: db.run, models: [buddies] });

      expect(result).toMatchObject({ status: 'present', existingName: 'pairKey_1' });
    });

    it('reports a refused command and carries on with the next index', async () => {
      const db = fakeDatabase({ buddyrelationships: { indexes: [] }, userblocks: { indexes: [] } });
      const answer = db.run.getMockImplementation()!;
      db.run.mockImplementation(async (command) => {
        if (command.createIndexes === 'buddyrelationships') throw new Error('not authorized');
        return answer(command);
      });

      const results = await ensureUniqueIndexes({ run: db.run, models: [buddies, blocks] });

      expect(results.map((r) => r.status)).toEqual(['failed', 'created']);
      expect(results[0].detail).toBe('not authorized');
    });
  });

  describe('createMissingUniqueIndexes (startup)', () => {
    it('creates the missing indexes and logs them', async () => {
      const db = fakeDatabase({});

      await createMissingUniqueIndexes(db.run, [buddies]);

      expect(db.sent('createIndexes')).toHaveLength(1);
      expect(logger.info).toHaveBeenCalledWith('Created missing unique indexes', {
        indexes: ['buddyrelationships (pairKey)'],
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('logs what needs attention without stopping the server', async () => {
      const db = fakeDatabase({
        buddyrelationships: { indexes: [], duplicates: [{ _id: { pairKey: 'a:b' }, count: 2 }] },
      });

      await expect(createMissingUniqueIndexes(db.run, [buddies])).resolves.toHaveLength(1);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('buddyrelationships'));
    });

    it("doesn't throw when the database can't be reached", async () => {
      const run = jest.fn().mockRejectedValue(new Error('connection refused'));

      await expect(createMissingUniqueIndexes(run, [buddies])).resolves.toEqual([
        expect.objectContaining({ status: 'failed', detail: 'connection refused' }),
      ]);
    });
  });
});
