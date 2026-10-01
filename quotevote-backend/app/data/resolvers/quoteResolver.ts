import { GraphQLError } from 'graphql';
import { ActivityEventTypeValues } from '~/data/utils/constants';
import { logActivity } from '~/data/resolvers/utils/activities';
import { updateTrending } from '~/data/resolvers/utils/posts';
import { QUOTE_SELECT, toQuote } from '~/data/resolvers/utils/commentsQuotes';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;
const MAX_LATEST_QUOTES = 100;

function isObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

function requireUserId(context: GraphQLContext): string {
  if (!context.user?._id) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user._id.toString();
}

export const quoteResolver = {
  Query: {
    latestQuotes: async (
      _parent: unknown,
      args: { limit: number },
      context: GraphQLContext
    ): Promise<Common.Quote[]> => {
      const quotes = await context.prisma.quote.findMany({
        // `{ not: true }` keeps legacy rows that never received a deleted field.
        where: { deleted: { not: true } },
        orderBy: { created: 'desc' },
        take: args.limit > 0 ? Math.min(args.limit, MAX_LATEST_QUOTES) : MAX_LATEST_QUOTES,
        select: QUOTE_SELECT,
      });
      return quotes.map(toQuote);
    },
  },

  Mutation: {
    addQuote: async (
      _parent: unknown,
      args: { quote: Common.QuoteInput },
      context: GraphQLContext
    ): Promise<Common.Quote> => {
      const userId = requireUserId(context);
      const { postId, quote, startWordIndex, endWordIndex } = args.quote;

      if (!isObjectId(postId)) {
        throw new GraphQLError('Invalid postId', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!quote?.trim()) {
        throw new GraphQLError('Quote text is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const post = await context.prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, title: true, userId: true, deleted: true },
      });
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const created = await context.prisma.quote.create({
        data: {
          userId,
          quoted: post.userId,
          postId,
          quote: quote.trim(),
          startWordIndex: startWordIndex ?? undefined,
          endWordIndex: endWordIndex ?? undefined,
          created: new Date(),
        },
        select: QUOTE_SELECT,
      });

      await updateTrending(context.prisma, postId);
      await logActivity(
        context.prisma,
        ActivityEventTypeValues.QUOTED,
        { userId, postId, quoteId: created.id },
        `Quoted on '${post.title}' post.`
      );

      return toQuote(created);
    },

    deleteQuote: async (
      _parent: unknown,
      args: { quoteId: string },
      context: GraphQLContext
    ): Promise<{ _id: string }> => {
      const userId = requireUserId(context);
      const isAdmin = context.user?.admin === true;

      if (!isObjectId(args.quoteId)) {
        return { _id: args.quoteId };
      }

      const existing = await context.prisma.quote.findUnique({
        where: { id: args.quoteId },
        select: { id: true, userId: true, deleted: true },
      });
      if (!existing) {
        return { _id: args.quoteId };
      }

      if (existing.userId !== userId && !isAdmin) {
        throw new GraphQLError('Not authorized to delete this quote', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!existing.deleted) {
        await context.prisma.quote.update({
          where: { id: args.quoteId },
          data: { deleted: true },
          select: { id: true },
        });
      }

      return { _id: args.quoteId };
    },
  },
};
