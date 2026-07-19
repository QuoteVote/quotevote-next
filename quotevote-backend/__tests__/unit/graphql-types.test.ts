/**
 * Schema-construction smoke test for the GraphQL domain type system.
 *
 * Proves that:
 *   1. All 25 legacy type-definition modules construct valid
 *      `GraphQLObjectType` instances (no thunk / circular-ref errors).
 *   2. A GraphQLSchema composed from `domainTypes` resolves without errors
 *      and introspection exposes every expected type name.
 *   3. The printed SDL from `domainTypeDefs` parses back to a valid schema
 *      (ticket criterion: "GraphQL schema construction works with the new
 *      TypeScript modules").
 */

import {
  buildSchema,
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  type GraphQLOutputType,
  GraphQLSchema,
  GraphQLString,
  printSchema,
} from 'graphql';
import {
  DateScalar,
  domainTypeDefs,
  domainTypes,
  // Named imports — each *Type comes from its own file.
  ActivityType,
  ActivitiesType,
  ChatRoomType,
  CommentType,
  DeletedCommentType,
  DeletedMessageType,
  DeletedPostType,
  DeletedQuoteType,
  DeletedVoteType,
  GroupType,
  MessageType,
  ReadByDetailedEntryType,
  MessageRoomType,
  NotificationType,
  PaginationType,
  PostType,
  PostsType,
  PresenceType,
  QuoteType,
  ReactionType,
  RosterType,
  TypingIndicatorType,
  UserType,
  UserInviteType,
  UserReputationType,
  VoteType,
} from '~/data/types';

const LEGACY_TYPE_NAMES = [
  'Activity',
  'Activities',
  'ChatRoom',
  'Comment',
  'DeletedComment',
  'DeletedMessage',
  'DeletedPost',
  'DeletedQuote',
  'DeletedVote',
  'Group',
  'Message',
  'MessageRoom',
  'Notification',
  'Pagination',
  'Post',
  'Posts',
  'Presence',
  'Quote',
  'Reaction',
  'Roster',
  'TypingIndicator',
  'User',
  'UserInvite',
  'UserReputation',
  'Vote',
] as const;

describe('GraphQL domain typedefs (7.28 migration)', () => {
  describe('per-file programmatic types', () => {
    const perFileCases: ReadonlyArray<[string, GraphQLObjectType]> = [
      ['Activity', ActivityType],
      ['Activities', ActivitiesType],
      ['ChatRoom', ChatRoomType],
      ['Comment', CommentType],
      ['DeletedComment', DeletedCommentType],
      ['DeletedMessage', DeletedMessageType],
      ['DeletedPost', DeletedPostType],
      ['DeletedQuote', DeletedQuoteType],
      ['DeletedVote', DeletedVoteType],
      ['Group', GroupType],
      ['Message', MessageType],
      ['MessageRoom', MessageRoomType],
      ['Notification', NotificationType],
      ['Pagination', PaginationType],
      ['Post', PostType],
      ['Posts', PostsType],
      ['Presence', PresenceType],
      ['Quote', QuoteType],
      ['Reaction', ReactionType],
      ['Roster', RosterType],
      ['TypingIndicator', TypingIndicatorType],
      ['User', UserType],
      ['UserInvite', UserInviteType],
      ['UserReputation', UserReputationType],
      ['Vote', VoteType],
    ];

    it.each(perFileCases)(
      'exports %s as a programmatic GraphQLObjectType with resolvable fields',
      (name, type) => {
        expect(type).toBeInstanceOf(GraphQLObjectType);
        expect(type.name).toBe(name);
        // Thunk resolution — throws if a circular import left the thunk seeing undefined.
        expect(() => type.getFields()).not.toThrow();
        expect(Object.keys(type.getFields()).length).toBeGreaterThan(0);
      }
    );

    it('aligns migrated fields with the domain type contracts', () => {
      const quoteFields = QuoteType.getFields();
      expect(quoteFields.postId.type).toBe(GraphQLID);

      const userFields = UserType.getFields();
      expect(userFields._votesId.type).toBe(GraphQLString);

      const messageFields = MessageType.getFields();
      expect(messageFields.readBy.type).toBeInstanceOf(GraphQLList);
      expect((messageFields.readBy.type as GraphQLList<GraphQLOutputType>).ofType).toBe(
        GraphQLString
      );
      expect(messageFields.readByDetailed.type).toBeInstanceOf(GraphQLList);
      expect(
        (messageFields.readByDetailed.type as GraphQLList<GraphQLOutputType>).ofType
      ).toBe(ReadByDetailedEntryType);

      const readByDetailedFields = ReadByDetailedEntryType.getFields();
      expect(readByDetailedFields.userId.type).toBe(GraphQLString);
      expect(readByDetailedFields.readAt.type).toBe(DateScalar);

      const chatRoomFields = ChatRoomType.getFields();
      expect(chatRoomFields.users.type).toBeInstanceOf(GraphQLList);
      expect((chatRoomFields.users.type as GraphQLList<GraphQLOutputType>).ofType).toBe(
        GraphQLString
      );

      const messageRoomFields = MessageRoomType.getFields();
      expect(messageRoomFields.users.type).toBeInstanceOf(GraphQLList);
      expect((messageRoomFields.users.type as GraphQLList<GraphQLOutputType>).ofType).toBe(
        GraphQLString
      );
    });

    it('covers all 25 legacy typedef names', () => {
      expect(perFileCases).toHaveLength(LEGACY_TYPE_NAMES.length);
      const coveredNames = perFileCases.map(([n]) => n).sort();
      expect(coveredNames).toEqual([...LEGACY_TYPE_NAMES].sort());
    });
  });

  describe('schema composition', () => {
    it('builds a GraphQLSchema that includes every domain type', () => {
      const QueryRoot = new GraphQLObjectType({
        name: 'Query',
        fields: { _placeholder: { type: GraphQLString } },
      });

      const schema = new GraphQLSchema({
        query: QueryRoot,
        types: [...domainTypes],
      });

      const typeMap = schema.getTypeMap();
      for (const expected of LEGACY_TYPE_NAMES) {
        expect(typeMap).toHaveProperty(expected);
      }
      // Sub-types emitted alongside their parent files are also present.
      for (const extra of [
        'PostDetails',
        'ReputationMetrics',
        'ReputationHistory',
        'UserReport',
        'PresenceUpdate',
        'HeartbeatResponse',
        'BuddyWithPresence',
        'DeletedRoster',
        'ReadByDetailedEntry',
        'TypingResponse',
        'PresenceStatus',
        'RosterStatus',
        'AccountStatus',
        'VoteType',
        'MessageType',
        'NotificationType',
        'ActivityEventType',
        'GroupPrivacy',
        'InviteStatus',
        'ReportStatus',
        'ReportSeverity',
        'ReportReason',
        'JSON',
        'Date',
      ]) {
        expect(typeMap).toHaveProperty(extra);
      }
    });

    it('emits non-empty printable SDL that parses back to a valid schema', () => {
      expect(typeof domainTypeDefs).toBe('string');
      expect(domainTypeDefs.length).toBeGreaterThan(0);
      for (const name of LEGACY_TYPE_NAMES) {
        expect(domainTypeDefs).toMatch(new RegExp(`\\btype ${name}\\b|\\benum ${name}\\b`));
      }

      // Round-trip: print → re-parse with buildSchema should yield a valid schema.
      const roundTripped = buildSchema(`${domainTypeDefs}\n\ntype Query { _ping: String }`);
      expect(printSchema(roundTripped)).toContain('type User');
      expect(printSchema(roundTripped)).toContain('type Post');
    });
  });
});
