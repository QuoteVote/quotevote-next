import fs from 'fs';
import os from 'os';
import path from 'path';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  KNOWN_CONTRACT_GAPS,
  checkFrontendContract,
  readFrontendDocuments,
} from '~/data/utils/frontendContract';
import type { FrontendDocument } from '~/types/frontendContract';

const schema = makeExecutableSchema({
  typeDefs: `
    type Post { _id: ID, title: String }
    type Query { post(postId: String!): Post, unresolved: Post }
    type Mutation { addPost(title: String!): Post, deletePost(postId: String!): Post }
    type Subscription { postAdded: Post }
  `,
  resolvers: {
    Query: { post: () => null },
    Mutation: { addPost: () => null },
    Subscription: { postAdded: { subscribe: async function* () {} } },
  },
});

const doc = (name: string, source: string): FrontendDocument => ({
  name,
  file: 'queries.ts',
  line: 1,
  source,
});

describe('checkFrontendContract', () => {
  it('passes documents that validate and call resolved root fields', () => {
    const report = checkFrontendContract(
      schema,
      [
        doc('GET_POST', 'query post($id: String!) { post(postId: $id) { _id title } }'),
        doc('ADD_POST', 'mutation { addPost(title: "a") { _id } }'),
        doc('POST_ADDED', 'subscription { postAdded { _id } }'),
      ],
      {}
    );

    expect(report).toEqual({
      checked: 3,
      problems: [],
      resolvedGaps: [],
      openGaps: [],
      missingGaps: [],
    });
  });

  it('reports fields and arguments the schema does not have', () => {
    const report = checkFrontendContract(
      schema,
      [doc('GET_POST', 'query { post(postId: "1", groupId: "2") { _id groupId } }')],
      {}
    );

    expect(report.problems).toHaveLength(1);
    expect(report.problems[0].messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Unknown argument "groupId"'),
        expect.stringContaining('Cannot query field "groupId"'),
      ])
    );
  });

  it('reports root fields that are in the schema but have no resolver', () => {
    const report = checkFrontendContract(
      schema,
      [
        doc('DELETE_POST', 'mutation { deletePost(postId: "1") { _id } }'),
        doc('UNRESOLVED', 'query { unresolved { _id } }'),
      ],
      {}
    );

    expect(report.problems.map((p) => p.messages)).toEqual([
      ['"deletePost" has no resolver, so it returns null'],
      ['"unresolved" has no resolver, so it returns null'],
    ]);
  });

  it('reports a document that does not parse', () => {
    const report = checkFrontendContract(schema, [doc('BROKEN', 'query { post( }')], {});

    expect(report.problems[0].messages[0]).toMatch(/Syntax Error/);
  });

  it('keeps known gaps out of the problems while they still fail', () => {
    const report = checkFrontendContract(
      schema,
      [doc('DELETE_POST', 'mutation { deletePost(postId: "1") { _id } }')],
      { DELETE_POST: '#633' }
    );

    expect(report.problems).toEqual([]);
    expect(report.openGaps).toEqual(['DELETE_POST']);
  });

  it('flags a known gap that now works, so the list stays current', () => {
    const report = checkFrontendContract(
      schema,
      [doc('ADD_POST', 'mutation { addPost(title: "a") { _id } }')],
      { ADD_POST: '#633' }
    );

    expect(report.resolvedGaps).toEqual(['ADD_POST']);
    expect(report.openGaps).toEqual([]);
  });

  it('flags a known gap whose document no longer exists', () => {
    const report = checkFrontendContract(
      schema,
      [doc('ADD_POST', 'mutation { addPost(title: "a") { _id } }')],
      { BLOCK_BUDDY: '#582' }
    );

    expect(report.missingGaps).toEqual(['BLOCK_BUDDY']);
  });

  it('ties every known gap to an issue', () => {
    for (const issue of Object.values(KNOWN_CONTRACT_GAPS)) {
      expect(issue).toMatch(/^#\d+$/);
    }
  });
});

describe('readFrontendDocuments', () => {
  it('reads each exported gql document with its file and line', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-'));
    try {
      fs.writeFileSync(
        path.join(dir, 'queries.ts'),
        [
          "import { gql } from '@apollo/client'",
          '',
          'export const GET_POST = gql`',
          '  query post { post(postId: "1") { _id } }',
          '`',
          'const NOT_EXPORTED = gql`query { x }`',
        ].join('\n')
      );
      fs.writeFileSync(path.join(dir, 'notes.md'), 'export const IGNORED = gql`query { x }`');

      const documents = readFrontendDocuments(dir);

      expect(documents).toHaveLength(1);
      expect(documents[0]).toMatchObject({ name: 'GET_POST', file: 'queries.ts', line: 3 });
      expect(documents[0].source).toContain('post(postId: "1")');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
