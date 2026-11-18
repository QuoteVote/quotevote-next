/// <reference types="node" />
/**
 * Writes this backend's GraphQL schema to quotevote-frontend/schema.graphql, the snapshot
 * the frontend's `validate:graphql` step checks every document against.
 * Needs no database or network.
 *
 * Usage: pnpm schema:print
 */
import fs from 'fs';
import path from 'path';
import { printSchema } from 'graphql';
import { schema } from '~/data/schema';

const HEADER = [
  '# Snapshot of the quotevote-backend GraphQL schema.',
  '# Regenerate with: pnpm --dir quotevote-backend schema:print',
  '# Used by scripts/validate-graphql.mjs to catch documents that would 400 at runtime.',
  '',
].join('\n');

const target = path.resolve(__dirname, '../../quotevote-frontend/schema.graphql');
fs.writeFileSync(target, `${HEADER}\n${printSchema(schema)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), target)}`);

// Importing the schema loads modules that keep the event loop open, so exit explicitly.
process.exit(0);
