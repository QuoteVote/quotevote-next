import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar } from './scalars';
import { UserType } from './User';
import { PostType } from './Post';
import { VoteType } from './Vote';
import { QuoteType } from './Quote';
import { CommentType } from './Comment';

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
    activityType: { type: GraphQLString },
    postId: { type: GraphQLString },
    post: { type: PostType },
    voteId: { type: GraphQLString },
    vote: { type: VoteType },
    quoteId: { type: GraphQLString },
    quote: { type: QuoteType },
    commentId: { type: GraphQLString },
    comment: { type: CommentType },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
    user: { type: UserType },
  }),
});

export const Activity = ActivityType;
