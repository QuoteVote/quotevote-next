import mongoose from 'mongoose';
import {
  applyIndexPlan,
  describePlan,
  planDatabaseIndexes,
  registeredIndexSources,
} from '~/data/utils/modelIndexRun';
import { PRISMA_ONLY_INDEXES } from '~/data/utils/prismaOnlyIndexes';
import type { IndexPlan } from '~/types/modelIndexes';

const MODEL = 'ModelIndexRunTestThing';

beforeAll(() => {
  const schema = new mongoose.Schema({ name: String, at: Date });
  schema.index({ name: 1 });
  schema.index({ at: 1 }, { expireAfterSeconds: 60 });
  mongoose.model(MODEL, schema, 'run_test_things');
});

afterAll(() => {
  mongoose.deleteModel(MODEL);
});

/** A database with the given collections and their existing indexes. */
function mockDb(existing: Record<string, { name: string; key: Record<string, unknown> }[]>) {
  const createIndex = jest.fn().mockResolvedValue('ok');
  const db = {
    listCollections: () => ({
      toArray: async () => Object.keys(existing).map((name) => ({ name })),
    }),
    collection: (name: string) => ({
      indexes: async () => existing[name] ?? [],
      createIndex: (...args: unknown[]) => createIndex(name, ...args),
    }),
    command: jest.fn().mockResolvedValue({ ok: 1 }),
  };
  return { db: db as unknown as mongoose.mongo.Db, createIndex, command: db.command };
}

describe('model index run (#716)', () => {
  it('reads the registered models and adds the Prisma-only collections', () => {
    const sources = registeredIndexSources();
    const mine = sources.find((s) => s.collection === 'run_test_things');
    expect(mine?.indexes.map(([key]) => key)).toEqual([{ name: 1 }, { at: 1 }]);
    for (const p of PRISMA_ONLY_INDEXES) {
      expect(sources.map((s) => s.collection)).toContain(p.collection);
    }
  });

  it('plans against the existing indexes, treating missing collections as empty', async () => {
    const { db } = mockDb({ run_test_things: [{ name: 'at_1', key: { at: 1 } }] });
    const plan = await planDatabaseIndexes(db);

    const missing = plan.missing.filter((i) => i.collection === 'run_test_things');
    expect(missing.map((i) => i.fields)).toEqual([{ name: 1 }]);
    expect(plan.ttl.map((i) => i.collection)).toContain('run_test_things');
    expect(plan.missing.some((i) => i.collection === 'userblocks')).toBe(true);
  });

  const plan: IndexPlan = {
    present: 3,
    missing: [{ collection: 'things', fields: { name: 1 }, unique: false, sparse: false }],
    ttl: [
      {
        collection: 'things',
        fields: { at: 1 },
        unique: false,
        sparse: false,
        expireAfterSeconds: 60,
      },
    ],
    conflicts: [],
  };

  it('describes the plan with names only', () => {
    expect(describePlan(plan)).toEqual([
      '3 declared indexes already in place.',
      'missing: things.name_1',
      'needs TTL (collMod): things.at_1 (ttl 60s)',
    ]);
  });

  it('builds the missing indexes, then adds the TTLs', async () => {
    const { db, createIndex, command } = mockDb({});
    const log = jest.fn();
    await applyIndexPlan(db, plan, log);

    expect(createIndex).toHaveBeenCalledWith('things', { name: 1 }, {});
    expect(command).toHaveBeenCalledWith({
      collMod: 'things',
      index: { keyPattern: { at: 1 }, expireAfterSeconds: 60 },
    });
    expect(log.mock.calls.map(([line]) => line)).toEqual([
      expect.stringMatching(/^built things\.name_1 in \d+\.\ds$/),
      'added TTL to things.at_1 (ttl 60s)',
    ]);
  });

  it('changes nothing when the plan has conflicts', async () => {
    const { db, createIndex, command } = mockDb({});
    const withConflict: IndexPlan = {
      ...plan,
      conflicts: [{ declared: plan.missing[0], reason: 'unique differs' }],
    };
    await expect(applyIndexPlan(db, withConflict, jest.fn())).rejects.toThrow(
      /Nothing was changed/
    );
    expect(createIndex).not.toHaveBeenCalled();
    expect(command).not.toHaveBeenCalled();
  });
});
