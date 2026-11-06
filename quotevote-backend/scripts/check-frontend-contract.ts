/// <reference types="node" />
/**
 * Frontend contract check: every GraphQL document in quotevote-frontend/src/graphql
 * must validate against this backend's schema and call root fields that have a
 * resolver. Known gaps are listed, with their issue, in KNOWN_CONTRACT_GAPS.
 * Needs no database or network.
 *
 * Usage: pnpm check:contract
 */
import path from 'path';
import { schema } from '~/data/schema';
import {
  KNOWN_CONTRACT_GAPS,
  checkFrontendContract,
  readFrontendDocuments,
} from '~/data/utils/frontendContract';

const graphqlDir = path.resolve(__dirname, '../../quotevote-frontend/src/graphql');
const report = checkFrontendContract(schema, readFrontendDocuments(graphqlDir));

for (const { name, file, line, messages } of report.problems) {
  console.error(`${name}  (quotevote-frontend/src/graphql/${file}:${line})`);
  for (const message of messages) console.error(`  - ${message}`);
}
for (const name of report.resolvedGaps) {
  console.error(
    `${name} now works against the backend. Remove it from KNOWN_CONTRACT_GAPS ` +
      `(${KNOWN_CONTRACT_GAPS[name]}).`
  );
}

for (const name of report.missingGaps) {
  console.error(
    `${name} is no longer a frontend document. Remove it from KNOWN_CONTRACT_GAPS ` +
      `(${KNOWN_CONTRACT_GAPS[name]}).`
  );
}

const failed =
  report.problems.length > 0 || report.resolvedGaps.length > 0 || report.missingGaps.length > 0;
const issues = [...new Set(report.openGaps.map((name) => KNOWN_CONTRACT_GAPS[name]))]
  .sort()
  .join(', ');
console.log(
  `${report.checked} frontend documents checked: ${report.problems.length} new problem(s), ` +
    `${report.openGaps.length} known gap(s) tracked in ${issues || 'no open issues'}.`
);

// Importing the schema loads modules that keep the event loop open, so exit explicitly.
process.exit(failed ? 1 : 0);
