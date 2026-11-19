import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
// Registers every Mongoose model, so the test knows which collections they cover.
import '~/data/models';
import { createIndexOptions, declaredIndexes, planIndexes } from '~/data/utils/modelIndexes';
import { PRISMA_ONLY_INDEXES, withPrismaOnlyIndexes } from '~/data/utils/prismaOnlyIndexes';
import type { ModelIndexSource } from '~/types/modelIndexes';

const SCHEMA_DIR = path.resolve(__dirname, '../../../prisma/schema');

interface SchemaIndex {
  model: string;
  collection: string;
  fields: string[];
  /** Prisma's name: `map:` when given, otherwise `Model_field_idx`. */
  name: string;
  /** Anything besides `map:` (sort order, type, ...), which the list can't express yet. */
  otherOptions: string;
}

/** Every `@@index` in prisma/schema, with stored field and collection names. */
function schemaIndexes(): SchemaIndex[] {
  const out: SchemaIndex[] = [];
  for (const file of fs.readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.prisma'))) {
    const text = fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf8');
    for (const [, model, body] of text.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
      const collection = /@@map\("([^"]+)"\)/.exec(body)?.[1] ?? model;
      const stored = new Map<string, string>();
      for (const [, field, mapped] of body.matchAll(/^\s*(\w+)\s+[^\n]*@map\("([^"]+)"\)/gm)) {
        stored.set(field, mapped);
      }
      for (const [, list, rest] of body.matchAll(/@@index\(\[([^\]]+)\]([^)]*)\)/g)) {
        const fields = list.split(',').map((f) => f.trim());
        const mapName = /map:\s*"([^"]+)"/.exec(rest)?.[1];
        out.push({
          model,
          collection,
          fields: fields.map((f) => stored.get(f) ?? f),
          name: mapName ?? `${model}_${fields.join('_')}_idx`,
          otherOptions: rest.replace(/map:\s*"[^"]*"/, '').replace(/[,\s]/g, ''),
        });
      }
    }
  }
  return out;
}

const mongooseCollections = (): Set<string> =>
  new Set(mongoose.modelNames().map((name) => mongoose.model(name).collection.collectionName));

const listed = (): { collection: string; name: unknown; fields: string[] }[] =>
  PRISMA_ONLY_INDEXES.flatMap(({ collection, indexes }) =>
    indexes.map(([key, options]) => ({ collection, name: options.name, fields: Object.keys(key) }))
  );

const byId = (a: { collection: string; fields: string[] }, b: typeof a): number =>
  `${a.collection}|${a.fields}`.localeCompare(`${b.collection}|${b.fields}`);

describe('Prisma-only indexes', () => {
  it('lists exactly the @@index entries of collections no Mongoose model covers', () => {
    const covered = mongooseCollections();
    const prismaOnly = schemaIndexes().filter((i) => !covered.has(i.collection));
    // Sort order or other index options would need support in the list first.
    expect(prismaOnly.filter((i) => i.otherOptions !== '')).toEqual([]);
    const expected = prismaOnly.map((i) => ({
      collection: i.collection,
      name: i.name,
      fields: i.fields,
    }));

    expect(expected.length).toBeGreaterThan(0);
    expect(listed().sort(byId)).toEqual(expected.sort(byId));
  });

  it('lists ascending, non-unique indexes only (unique ones are db:unique-indexes)', () => {
    for (const { indexes } of PRISMA_ONLY_INDEXES) {
      for (const [key, options] of indexes) {
        expect(Object.values(key).every((dir) => dir === 1)).toBe(true);
        expect(Object.keys(options)).toEqual(['name']);
      }
    }
  });

  it('adds them only for collections no Mongoose model covers', () => {
    const models: ModelIndexSource[] = [
      { collection: 'votes', indexes: [[{ postId: 1 }, {}]] },
      { collection: 'userblocks', indexes: [[{ blockerId: 1 }, {}]] },
    ];
    const merged = withPrismaOnlyIndexes(models);

    expect(merged.slice(0, 2)).toEqual(models);
    const collections = merged.map((m) => m.collection);
    expect(collections.filter((c) => c === 'userblocks')).toHaveLength(1);
    expect(collections).toEqual(
      expect.arrayContaining(['buddyrelationships', 'directmessages', 'terms_acceptances'])
    );
  });

  it('plans the missing ones under Prisma names and counts existing ones as present', () => {
    const declared = declaredIndexes(withPrismaOnlyIndexes([]));
    const plan = planIndexes(declared, {
      // Built earlier by `prisma db push` on a dev database: same key, same name.
      userblocks: [
        { name: '_id_', key: { _id: 1 } },
        { name: 'UserBlock_blockedUserId_idx', key: { blockedUserId: 1 } },
        {
          name: 'UserBlock_blockerId_blockedUserId_key',
          key: { blockerId: 1, blockedUserId: 1 },
          unique: true,
        },
      ],
    });

    expect(plan.conflicts).toEqual([]);
    expect(plan.present).toBe(1);
    expect(plan.missing).toHaveLength(declared.length - 1);
    const buddy = plan.missing.find((i) => i.collection === 'buddyrelationships')!;
    expect(createIndexOptions(buddy)).toEqual({ name: buddy.name });
    expect(buddy.unique).toBe(false);
  });
});
