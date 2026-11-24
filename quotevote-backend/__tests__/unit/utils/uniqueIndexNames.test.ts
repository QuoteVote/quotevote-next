import fs from 'fs';
import path from 'path';
import { UNIQUE_INDEX_MAP_NAMES } from '~/data/utils/uniqueIndexNames';

const SCHEMA_DIR = path.resolve(__dirname, '../../../prisma/schema');

/** Every unique index in prisma/schema that sets its name with `map:`. */
function schemaMapNames(): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const add = (model: string, fields: string[], name: string) => {
    (out[model] ??= {})[fields.join(',')] = name;
  };
  for (const file of fs.readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.prisma'))) {
    const text = fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf8');
    for (const [, model, body] of text.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
      for (const [, list, rest] of body.matchAll(/@@unique\(\[([^\]]+)\]([^)]*)\)/g)) {
        const name = /map:\s*"([^"]+)"/.exec(rest)?.[1];
        if (name)
          add(
            model,
            list.split(',').map((f) => f.trim()),
            name
          );
      }
      for (const [, field, name] of body.matchAll(
        /^\s*(\w+)\s+[^\n]*@unique\(\s*map:\s*"([^"]+)"\s*\)/gm
      )) {
        add(model, [field], name);
      }
    }
  }
  return out;
}

describe('unique index names set with map: (#747)', () => {
  it('lists exactly the map: names of the unique indexes in prisma/schema', () => {
    expect(UNIQUE_INDEX_MAP_NAMES).toEqual(schemaMapNames());
  });
});
