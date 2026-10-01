import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar } from './scalars';
import { UserType } from './User';
import { PostType } from './Post';
import { VoteType } from './Vote';
import { QuoteType } from './Quote';
import { CommentType } from './Comment';
import { ActivityEventTypeEnum } from './enums';

import User from '../models/User';
import Post from '../models/Post';
import Vote from '../models/Vote';
import {
  COMMENT_SELECT,
  QUOTE_SELECT,
  toComment,
  toQuote,
} from '~/data/resolvers/utils/commentsQuotes';

interface ActivityShape extends Common.Activity {
  post?: Common.Post;
  vote?: Common.Vote;
  quote?: Common.Quote;
  comment?: Common.Comment;
  user?: Common.User;
}

export const ActivityType: GraphQLObjectType<ActivityShape, GraphQLContext> = new GraphQLObjectType<
  ActivityShape,
  GraphQLContext
>({
  name: 'Activity',
  description: 'Activity feed entry — a user action on a post/vote/quote/comment.',
  fields: (): GraphQLFieldConfigMap<ActivityShape, GraphQLContext> => ({
    _id: { type: GraphQLString },
    created: { type: DateScalar },
    activityType: { type: ActivityEventTypeEnum },
    postId: { type: GraphQLString },
    post: {
      type: PostType,
      resolve: (act) => act.post ?? (act.postId ? Post.findById(act.postId).lean() : null),
    },
    voteId: { type: GraphQLString },
    vote: {
      type: VoteType,
      resolve: (act) => act.vote ?? (act.voteId ? Vote.findById(act.voteId).lean() : null),
    },
    quoteId: { type: GraphQLString },
    quote: {
      type: QuoteType,
      resolve: async (act, _args, context) => {
        if (act.quote) return act.quote;
        if (!act.quoteId) return null;
        const quote = await context.prisma.quote.findUnique({
          where: { id: act.quoteId },
          select: QUOTE_SELECT,
        });
        return quote ? toQuote(quote) : null;
      },
    },
    commentId: { type: GraphQLString },
    comment: {
      type: CommentType,
      resolve: async (act, _args, context) => {
        if (act.comment) return act.comment;
        if (!act.commentId) return null;
        const comment = await context.prisma.comment.findUnique({
          where: { id: act.commentId },
          select: COMMENT_SELECT,
        });
        return comment ? toComment(comment) : null;
      },
    },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
    user: {
      type: UserType,
      resolve: (act) => act.user ?? User.findById(act.userId).lean(),
    },
  }),
});

export const Activity = ActivityType;
