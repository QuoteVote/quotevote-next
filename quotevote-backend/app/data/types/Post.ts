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

import User from '../models/User';
import Vote from '../models/Vote';
import MessageRoom from '../models/MessageRoom';
import {
  COMMENT_SELECT,
  QUOTE_SELECT,
  toComment,
  toQuote,
} from '~/data/resolvers/utils/commentsQuotes';

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
    tagId: { type: GraphQLString },
    title: { type: GraphQLString },
    text: { type: GraphQLString },
    citationUrl: { type: GraphQLString },
    attribution: { type: GraphQLString },
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
    creator: {
      type: UserType,
      resolve: (p) => p.creator ?? User.findById(p.userId).lean(),
    },
    comments: {
      type: new GraphQLList(CommentType),
      resolve: async (p, _args, context) => {
        if (p.comments) return p.comments;
        const comments = await context.prisma.comment.findMany({
          where: { postId: p._id, deleted: { not: true } },
          orderBy: { created: 'asc' },
          select: COMMENT_SELECT,
        });
        return comments.map(toComment);
      },
    },
    votes: {
      type: new GraphQLList(VoteType),
      resolve: (p) => p.votes ?? Vote.find({ postId: p._id }).lean(),
    },
    quotes: {
      type: new GraphQLList(QuoteType),
      resolve: async (p, _args, context) => {
        if (p.quotes) return p.quotes;
        const quotes = await context.prisma.quote.findMany({
          where: { postId: p._id, deleted: { not: true } },
          orderBy: { created: 'asc' },
          select: QUOTE_SELECT,
        });
        return quotes.map(toQuote);
      },
    },
    messageRoom: {
      type: MessageRoomType,
      resolve: (p) => p.messageRoom ?? MessageRoom.findOne({ postId: p._id }).lean(),
    },
  }),
});

export const Post = PostType;
