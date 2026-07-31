import { GraphQLError } from 'graphql';
import Reaction from '../models/Reaction';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

export const reactionResolver = {
  Query: {
    actionReactions: async (
      _parent: unknown,
      args: { actionId: string }
    ): Promise<Common.Reaction[]> => {
      const reactions = await Reaction.find({ actionId: args.actionId }).lean();
      return reactions.map((r) => ({
        ...r,
        _id: r._id.toString(),
        userId: r.userId.toString(),
        actionId: r.actionId ? r.actionId.toString() : undefined,
      })) as unknown as Common.Reaction[];
    },
  },

  Mutation: {
    addActionReaction: async (
      _parent: unknown,
      args: { reaction: Common.ReactionInput },
      context: GraphQLContext
    ): Promise<Common.Reaction> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const rxn = await Reaction.create({
        userId: args.reaction.userId,
        actionId: args.reaction.actionId,
        emoji: args.reaction.emoji,
      });

      return {
        _id: rxn._id.toString(),
        userId: rxn.userId.toString(),
        actionId: rxn.actionId ? rxn.actionId.toString() : undefined,
        emoji: rxn.emoji,
        created: rxn.created,
      } as unknown as Common.Reaction;
    },

    updateActionReaction: async (
      _parent: unknown,
      args: { _id: string; emoji: string },
      context: GraphQLContext
    ): Promise<Common.Reaction> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const rxn = await Reaction.findByIdAndUpdate(
        args._id,
        { $set: { emoji: args.emoji } },
        { new: true }
      ).lean();

      if (!rxn) {
        throw new GraphQLError('Reaction not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return {
        ...rxn,
        _id: rxn._id.toString(),
        userId: rxn.userId.toString(),
        actionId: rxn.actionId ? rxn.actionId.toString() : undefined,
      } as unknown as Common.Reaction;
    },
  },
};
