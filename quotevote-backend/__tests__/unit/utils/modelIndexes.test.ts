import {
  createIndexOptions,
  declaredIndexes,
  describeConflict,
  describeIndex,
  planIndexes,
  ttlCommand,
} from '~/data/utils/modelIndexes';
import type { ExistingIndex } from '~/types/modelIndexes';

const declared = declaredIndexes([
  {
    collection: 'votes',
    indexes: [
      [{ postId: 1 }, { background: true }],
      [{ postId: 1, userId: 1 }, {}],
      [{ content: 'text' }, {}],
    ],
  },
  { collection: 'typings', indexes: [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]] },
  {
    collection: 'reactions',
    indexes: [
      [
        { userId: 1, actionId: 1 },
        { unique: true, sparse: true, name: 'by_user' },
      ],
    ],
  },
]);

const idx = (name: string, key: Record<string, unknown>, extra: Partial<ExistingIndex> = {}) => ({
  name,
  key,
  ...extra,
});

describe('declaredIndexes (#716)', () => {
  it('keeps the key and the options that matter, and drops the rest', () => {
    expect(declared[0]).toEqual({
      collection: 'votes',
      fields: { postId: 1 },
      unique: false,
      sparse: false,
    });
    expect(declared[3]).toMatchObject({ expireAfterSeconds: 0 });
    expect(declared[4]).toMatchObject({ unique: true, sparse: true, name: 'by_user' });
  });
});

describe('planIndexes (#716, #714)', () => {
  it('lists what is missing and counts what is there, matching on the ordered key', () => {
    const plan = planIndexes(declared, {
      votes: [
        idx('_id_', { _id: 1 }),
        // Same fields, other order: a different index.
        idx('userId_1_postId_1', { userId: 1, postId: 1 }),
        idx('content_text', { _fts: 'text', _ftsx: 1 }, { weights: { content: 1 } }),
      ],
      typings: [idx('expiresAt_1', { expiresAt: 1 }, { expireAfterSeconds: 0 })],
      reactions: [idx('by_user', { userId: 1, actionId: 1 }, { unique: true, sparse: true })],
    });
    expect(plan.missing.map(describeIndex)).toEqual(['votes.postId_1', 'votes.postId_1_userId_1']);
    expect(plan.present).toBe(3);
    expect(plan.ttl).toEqual([]);
    expect(plan.conflicts).toEqual([]);
  });

  it('treats a missing collection as having no indexes', () => {
    expect(planIndexes(declared, {}).missing).toHaveLength(5);
  });

  it('turns an existing plain index into the declared TTL with collMod (#714)', () => {
    const plan = planIndexes(declared, {
      typings: [idx('expiresAt_1', { expiresAt: 1 })],
    });
    expect(plan.ttl.map(describeIndex)).toEqual(['typings.expiresAt_1 (ttl 0s)']);
    expect(ttlCommand(plan.ttl[0])).toEqual({
      collMod: 'typings',
      index: { keyPattern: { expiresAt: 1 }, expireAfterSeconds: 0 },
    });
  });

  it('reports a different TTL, uniqueness or sparseness as a conflict and never as missing', () => {
    const plan = planIndexes(declared, {
      typings: [idx('expiresAt_1', { expiresAt: 1 }, { expireAfterSeconds: 60 })],
      reactions: [idx('by_user', { userId: 1, actionId: 1 })],
      votes: [idx('postId_1', { postId: 1 }, { sparse: true })],
    });
    expect(plan.conflicts.map(describeConflict)).toEqual([
      'votes.postId_1: sparse differs, existing postId_1',
      'typings.expiresAt_1 (ttl 0s): TTL differs, existing expiresAt_1',
      'reactions.by_user (unique, sparse): unique differs, existing by_user',
    ]);
    expect(plan.missing.map(describeIndex)).not.toContain('votes.postId_1');
  });

  it('flags an index a model declares twice with different options', () => {
    const twice = declaredIndexes([
      {
        collection: 'typings',
        indexes: [
          [{ expiresAt: 1 }, {}],
          [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
        ],
      },
    ]);
    expect(planIndexes(twice, {}).conflicts.map((c) => c.reason)).toEqual([
      'declared twice with different options',
    ]);
  });

  it('matches text indexes on their fields, whatever the order', () => {
    const text = declaredIndexes([
      { collection: 'posts', indexes: [[{ title: 'text', text: 'text' }, {}]] },
    ]);
    const plan = planIndexes(text, {
      posts: [idx('t', { _fts: 'text', _ftsx: 1 }, { weights: { text: 1, title: 1 } })],
    });
    expect(plan.present).toBe(1);
  });
});

describe('createIndexOptions', () => {
  it('passes only the options the model sets', () => {
    expect(createIndexOptions(declared[0])).toEqual({});
    expect(createIndexOptions(declared[3])).toEqual({ expireAfterSeconds: 0 });
    expect(createIndexOptions(declared[4])).toEqual({
      unique: true,
      sparse: true,
      name: 'by_user',
    });
  });
});
