import fs from 'fs';
import path from 'path';
import {
  Kind,
  parse,
  validate,
  type GraphQLObjectType,
  type GraphQLSchema,
  type OperationDefinitionNode,
} from 'graphql';
import type { ContractProblem, ContractReport, FrontendDocument } from '~/types/frontendContract';

/**
 * Frontend documents that don't work against this backend yet, and the issue
 * that fixes each one. The check fails on any other document that doesn't
 * validate or has no resolver, on an entry here that starts passing, and on an
 * entry whose document no longer exists.
 */
export const KNOWN_CONTRACT_GAPS: Readonly<Record<string, string>> = {
  // Group names (#539)
  GROUPS_QUERY: '#539',
  GET_GROUP: '#539',
  CREATE_GROUP: '#539',
  GET_POST: '#539',
  GET_POST_GROUP_ID: '#539',
  GET_TOP_POSTS: '#539',
  GET_PAGINATED_POSTS: '#539',
  GET_FEATURED_POSTS: '#539',
  SEARCH: '#539',
  // Buddy mutations still use the Roster arguments (#582)
  ADD_BUDDY: '#582',
  ACCEPT_BUDDY: '#582',
  DECLINE_BUDDY: '#582',
  BLOCK_BUDDY: '#582',
  UNBLOCK_BUDDY: '#582',
  REMOVE_BUDDY: '#582',
  // Mutations with no resolver yet (#633)
  SUBMIT_POST: '#633',
  DELETE_POST: '#633',
  APPROVE_POST: '#633',
  REJECT_POST: '#633',
  UPDATE_POST_BOOKMARK: '#633',
  UPDATE_FEATURED_SLOT: '#633',
  TOGGLE_VOTING: '#633',
  VOTE: '#633',
  DELETE_VOTE: '#633',
  SEND_MESSAGE: '#633',
  DELETE_MESSAGE: '#633',
  CREATE_POST_MESSAGE_ROOM: '#633',
  READ_MESSAGES: '#633',
  ADD_MESSAGE_REACTION: '#633',
  UPDATE_MESSAGE_REACTION: '#633',
  FOLLOW_USER: '#633',
  REPORT_USER: '#633',
  DISABLE_USER: '#633',
  ENABLE_USER: '#633',
  SEND_USER_INVITE: '#633',
  SEND_INVESTOR_EMAIL: '#633',
};

const DOCUMENT_PATTERN = /export const (\w+) = gql`([\s\S]*?)`/g;

/** Read every `export const NAME = gql\`...\`` document from the frontend's src/graphql folder. */
export function readFrontendDocuments(graphqlDir: string): FrontendDocument[] {
  const documents: FrontendDocument[] = [];
  for (const file of fs
    .readdirSync(graphqlDir)
    .filter((f) => f.endsWith('.ts'))
    .sort()) {
    const text = fs.readFileSync(path.join(graphqlDir, file), 'utf8');
    for (const match of text.matchAll(DOCUMENT_PATTERN)) {
      documents.push({
        name: match[1],
        file,
        line: text.slice(0, match.index).split('\n').length,
        source: match[2],
      });
    }
  }
  return documents;
}

function rootType(
  schema: GraphQLSchema,
  operation: OperationDefinitionNode
): GraphQLObjectType | null | undefined {
  if (operation.operation === 'mutation') return schema.getMutationType();
  if (operation.operation === 'subscription') return schema.getSubscriptionType();
  return schema.getQueryType();
}

/**
 * Root fields the document calls that are in the schema but have no resolver,
 * so they return null. Validation alone can't see these.
 */
function unresolvedRootFields(schema: GraphQLSchema, source: string): string[] {
  const missing: string[] = [];
  for (const definition of parse(source).definitions) {
    if (definition.kind !== Kind.OPERATION_DEFINITION) continue;
    const fields = rootType(schema, definition)?.getFields() ?? {};
    for (const selection of definition.selectionSet.selections) {
      if (selection.kind !== Kind.FIELD) continue;
      const field = fields[selection.name.value];
      if (field && !field.resolve && !field.subscribe) missing.push(selection.name.value);
    }
  }
  return missing;
}

function problemsFor(schema: GraphQLSchema, document: FrontendDocument): string[] {
  let parsed;
  try {
    parsed = parse(document.source);
  } catch (error) {
    return [(error as Error).message];
  }
  const errors = validate(schema, parsed).map((e) => e.message);
  if (errors.length > 0) return errors;
  return unresolvedRootFields(schema, document.source).map(
    (field) => `"${field}" has no resolver, so it returns null`
  );
}

/** Check the frontend's documents against the backend schema. */
export function checkFrontendContract(
  schema: GraphQLSchema,
  documents: FrontendDocument[],
  knownGaps: Readonly<Record<string, string>> = KNOWN_CONTRACT_GAPS
): ContractReport {
  const problems: ContractProblem[] = [];
  const resolvedGaps: string[] = [];
  const openGaps: string[] = [];

  for (const document of documents) {
    const messages = problemsFor(schema, document);
    const known = Object.prototype.hasOwnProperty.call(knownGaps, document.name);
    if (known) {
      (messages.length > 0 ? openGaps : resolvedGaps).push(document.name);
    } else if (messages.length > 0) {
      problems.push({ name: document.name, file: document.file, line: document.line, messages });
    }
  }

  const names = new Set(documents.map((document) => document.name));
  const missingGaps = Object.keys(knownGaps).filter((name) => !names.has(name));

  return { checked: documents.length, problems, resolvedGaps, openGaps, missingGaps };
}
