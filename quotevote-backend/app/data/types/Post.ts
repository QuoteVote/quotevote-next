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
import Comment from '../models/Comment';
import Vote from '../models/Vote';
import Quote from '../models/Quote';
import MessageRoom from '../models/MessageRoom';

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
      resolve: (p) => p.comments ?? Comment.find({ postId: p._id }).lean(),
    },
    votes: {
      type: new GraphQLList(VoteType),
      resolve: (p) => p.votes ?? Vote.find({ postId: p._id }).lean(),
    },
    quotes: {
      type: new GraphQLList(QuoteType),
      resolve: (p) => p.quotes ?? Quote.find({ postId: p._id }).lean(),
    },
    messageRoom: {
      type: MessageRoomType,
      resolve: (p) => p.messageRoom ?? MessageRoom.findOne({ postId: p._id }).lean(),
    },
  }),
});

export const Post = PostType;
