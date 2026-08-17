/**
 * Validates every GraphQL document in src/graphql/ against the committed
 * schema snapshot (schema.graphql).
 *
 * `tsc` cannot catch a document that selects a field the API does not expose;
 * the server rejects it at runtime with HTTP 400 / GRAPHQL_VALIDATION_FAILED.
 * This script catches that at CI time instead. It needs no network access.
 *
 * Refresh the snapshot after a backend deploy with: pnpm schema:update
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSchema, parse, validate } from "graphql";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(root, "schema.graphql");
const graphqlDir = path.join(root, "src", "graphql");

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema snapshot not found at ${schemaPath}. Run: pnpm schema:update`);
  process.exit(1);
}

const schema = buildSchema(fs.readFileSync(schemaPath, "utf8"));

// Documents that probe local-only fields (e.g. User.bio). Callers use
// errorPolicy: 'all' so hosted schemas reject them without taking down the page.
const OPTIONAL_DOCUMENTS = new Set(["GET_USER_BIO"]);

let checked = 0;
const failures = [];

for (const file of fs.readdirSync(graphqlDir).filter((f) => f.endsWith(".ts"))) {
  const source = fs.readFileSync(path.join(graphqlDir, file), "utf8");
  const pattern = /export const (\w+) = gql`([\s\S]*?)`/g;

  for (let match; (match = pattern.exec(source)); ) {
    const [, name, body] = match;
    const line = source.slice(0, match.index).split("\n").length;

    if (OPTIONAL_DOCUMENTS.has(name)) {
      continue;
    }

    checked += 1;

    let document;
    try {
      document = parse(body);
    } catch (error) {
      failures.push({ name, file, line, errors: [error.message] });
      continue;
    }

    const errors = validate(schema, document);
    if (errors.length > 0) {
      failures.push({ name, file, line, errors: errors.map((e) => e.message) });
    }
  }
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length} of ${checked} GraphQL documents do not match the deployed schema:\n`
  );
  for (const { name, file, line, errors } of failures) {
    console.error(`  ${name}  (src/graphql/${file}:${line})`);
    for (const message of errors) console.error(`    - ${message}`);
    console.error("");
  }
  console.error(
    "These would fail at runtime with HTTP 400 / GRAPHQL_VALIDATION_FAILED.\n" +
      "Fix the documents, or refresh the snapshot with `pnpm schema:update` if the API has changed.\n"
  );
  process.exit(1);
}

console.log(`All ${checked} GraphQL documents validate against schema.graphql`);
