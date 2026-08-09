/**
 * Refreshes schema.graphql by introspecting the deployed API.
 *
 * Run after a backend deploy changes the schema:
 *   pnpm schema:update
 *   GRAPHQL_ENDPOINT=http://localhost:4000/graphql pnpm schema:update
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildClientSchema,
  getIntrospectionQuery,
  lexicographicSortSchema,
  printSchema,
} from "graphql";

const endpoint = process.env.GRAPHQL_ENDPOINT ?? "https://api.quote.vote/graphql";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The server only skips its auth gate when operationName is exactly this.
const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    operationName: "IntrospectionQuery",
    query: getIntrospectionQuery(),
  }),
});

if (!response.ok) {
  console.error(`Introspection failed: HTTP ${response.status} from ${endpoint}`);
  process.exit(1);
}

const { data, errors } = await response.json();
if (errors?.length) {
  console.error(`Introspection returned errors: ${errors.map((e) => e.message).join(", ")}`);
  process.exit(1);
}

const header =
  `# Snapshot of the deployed API schema (${endpoint}).\n` +
  `# Regenerate with: pnpm schema:update\n` +
  `# Used by scripts/validate-graphql.mjs to catch documents that would 400 at runtime.\n\n`;

fs.writeFileSync(
  path.join(root, "schema.graphql"),
  header + printSchema(lexicographicSortSchema(buildClientSchema(data)))
);

console.log(`Updated schema.graphql from ${endpoint}`);
