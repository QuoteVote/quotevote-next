/**
 * Missing unique indexes are created safely on a real database (#694).
 *
 * Checks an empty database and one shaped like the current API's: indexes under legacy names,
 * records that share a key, and an index with the same keys that isn't unique.
 *
 * Requires MongoDB in DATABASE_URL, on a database whose name contains "test": the test drops
 * that database before and after it runs.
 *
 * Run: npm run test:prisma
 */

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { Prisma, PrismaClient } from '@prisma/client';
import { ensureUniqueIndexes } from '~/data/utils/uniqueIndexes';
import type { UniqueIndexModel, UniqueIndexResult } from '~/types/uniqueIndexes';

const prisma = new PrismaClient();
const models = Prisma.dmmf.datamodel.models as unknown as UniqueIndexModel[];
const run = (command: Record<string, unknown>) =>
  prisma.$runCommandRaw(command as Prisma.InputJsonObject);

const databaseName = (): string => {
  const url = process.env.DATABASE_URL ?? '';
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
};

const oid = (n: number) => ({ $oid: n.toString(16).padStart(24, '0') });

const dropDatabase = () => run({ dropDatabase: 1 });

const insert = (collection: string, documents: Record<string, unknown>[]) =>
  run({ insert: collection, documents });

const indexNames = async (collection: string): Promise<string[]> => {
  const reply = (await run({ listIndexes: collection, cursor: {} })) as {
    cursor: { firstBatch: { name: string }[] };
  };
  return reply.cursor.firstBatch.map((i) => i.name).sort();
};

const statusOf = (results: UniqueIndexResult[], collection: string, fields: string[]) =>
  results.find((r) => r.collection === collection && r.fields.join() === fields.join())?.status;

describe('missing unique indexes are created safely (#694)', () => {
  beforeAll(async () => {
    if (!databaseName().includes('test')) {
      throw new Error('DATABASE_URL must name a throwaway database containing "test"');
    }
    await dropDatabase();
  });

  afterAll(async () => {
    await dropDatabase();
    await prisma.$disconnect();
  });

  describe('an empty database', () => {
    it('creates every unique index in the schema, and finds them all on the next run', async () => {
      const first = await ensureUniqueIndexes({ run, models });
      expect(first.every((r) => r.status === 'created')).toBe(true);

      const second = await ensureUniqueIndexes({ run, models });
      expect(second.every((r) => r.status === 'present')).toBe(true);
    });

    it('refuses a second buddy request for the same pair once the index is there', async () => {
      await insert('buddyrelationships', [{ pairKey: 'a:b', status: 'pending' }]);

      const reply = (await insert('buddyrelationships', [
        { pairKey: 'a:b', status: 'pending' },
      ])) as { n?: number; writeErrors?: { code?: number }[] };

      expect(reply.n).toBe(0);
      expect(reply.writeErrors?.[0]?.code).toBe(11000);
    });
  });

  describe('a database written by the current API', () => {
    let before: Record<string, string[]>;
    let results: UniqueIndexResult[];

    beforeAll(async () => {
      await dropDatabase();
      // Created by legacy under its own name.
      await insert('botreports', [{ _reporterId: oid(1), _reportedUserId: oid(2) }]);
      await run({
        createIndexes: 'botreports',
        indexes: [
          {
            key: { _reporterId: 1, _reportedUserId: 1 },
            name: '_reporterId_1__reportedUserId_1',
            unique: true,
          },
        ],
      });
      // Two accepted rows for one pair, as found on staging.
      await insert('buddyrelationships', [
        { pairKey: 'a:b', status: 'accepted' },
        { pairKey: 'a:b', status: 'accepted' },
        { pairKey: 'a:c', status: 'pending' },
      ]);
      // Same keys as the schema's index, but not unique.
      await insert('userblocks', [{ blockerId: oid(1), blockedUserId: oid(2) }]);
      await run({
        createIndexes: 'userblocks',
        indexes: [{ key: { blockerId: 1, blockedUserId: 1 }, name: 'blockerId_1_blockedUserId_1' }],
      });
      // Two acceptances without `termsVersion` share the key `null`.
      await insert('terms_acceptances', [{ userId: oid(1) }, { userId: oid(1) }]);

      before = {
        botreports: await indexNames('botreports'),
        buddyrelationships: await indexNames('buddyrelationships'),
        userblocks: await indexNames('userblocks'),
        terms_acceptances: await indexNames('terms_acceptances'),
      };
      results = await ensureUniqueIndexes({ run, models });
    });

    it('keeps an index legacy created under its own name', () => {
      expect(statusOf(results, 'botreports', ['_reporterId', '_reportedUserId'])).toBe('present');
    });

    it('lists records that share a key instead of creating the index', () => {
      const buddies = results.find((r) => r.collection === 'buddyrelationships');
      expect(buddies).toMatchObject({
        status: 'duplicates',
        duplicates: { groups: 1, examples: [{ key: { pairKey: 'a:b' }, count: 2 }] },
      });
      expect(statusOf(results, 'terms_acceptances', ['userId', 'termsVersion'])).toBe('duplicates');
    });

    it('leaves an index with the same keys that is not unique alone', () => {
      expect(statusOf(results, 'userblocks', ['blockerId', 'blockedUserId'])).toBe('conflict');
    });

    it('creates the indexes that are safe to create', () => {
      expect(statusOf(results, 'presences', ['userId'])).toBe('created');
    });

    it('never drops or changes an index that was there', async () => {
      for (const [collection, names] of Object.entries(before)) {
        expect(await indexNames(collection)).toEqual(names);
      }
    });
  });
});
