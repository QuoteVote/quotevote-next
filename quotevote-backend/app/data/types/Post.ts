import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar } from './scalars';
import { UserType } from './User';
import { CommentType } from './Comment';
import { VoteType } from './Vote';
import { QuoteType } from './Quote';
import { MessageRoomType } from './MessageRoom';

interface PostShape extends Common.Post {
  creator?: Common.User;
  comments?: Common.Comment[];
  votes?: Common.Vote[];
  quotes?: Common.Quote[];
  messageRoom?: Common.MessageRoom;
  dayPoints?: number;
  pointTimestamp?: string;
}

export const PostType: GraphQLObjectType<PostShape, GraphQLContext> = new GraphQLObjectType<
  PostShape,
  GraphQLContext
>({
  name: 'Post',
  description: 'A user post, aligned with Prisma Post / Mongoose Post model.',
  fields: (): GraphQLFieldConfigMap<PostShape, GraphQLContext> => ({
    _id: { type: GraphQLString },
    userId: { type: GraphQLString },
    created: { type: DateScalar },
    groupId: { type: GraphQLString },
    title: { type: GraphQLString },
    text: { type: GraphQLString },
    citationUrl: { type: GraphQLString },
    url: { type: GraphQLString },
    deleted: { type: GraphQLBoolean },
    upvotes: { type: GraphQLInt },
    downvotes: { type: GraphQLInt },
    reportedBy: {
      type: new GraphQLList(GraphQLString),
      resolve: (p) => p.reportedBy ?? [],
    },
    approvedBy: {
      type: new GraphQLList(GraphQLString),
      resolve: (p) => p.approvedBy ?? [],
    },
    rejectedBy: {
      type: new GraphQLList(GraphQLString),
      resolve: (p) => p.rejectedBy ?? [],
    },
    votedBy: {
      type: new GraphQLList(GraphQLString),
      resolve: (p) => p.votedBy ?? [],
    },
    bookmarkedBy: {
      type: new GraphQLList(GraphQLString),
      resolve: (p) => p.bookmarkedBy ?? [],
    },
    dayPoints: { type: GraphQLInt },
    pointTimestamp: { type: GraphQLString },
    featuredSlot: { type: GraphQLInt },
    enable_voting: { type: GraphQLBoolean },
    creator: { type: UserType },
    comments: {
      type: new GraphQLList(CommentType),
      resolve: (p) => p.comments ?? [],
    },
    votes: {
      type: new GraphQLList(VoteType),
      resolve: (p) => p.votes ?? [],
    },
    quotes: {
      type: new GraphQLList(QuoteType),
      resolve: (p) => p.quotes ?? [],
    },
    messageRoom: { type: MessageRoomType },
  }),
});

export const Post = PostType;
