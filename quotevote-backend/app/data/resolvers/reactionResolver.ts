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
      // ponytail: use static method defined on Reaction model
      const reactions = await Reaction.findByActionId(args.actionId).lean();
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

      // ponytail: security guard - enforce context.user._id & upsert to prevent duplicates
      const rxn = await Reaction.findOneAndUpdate(
        { userId: context.user._id, actionId: args.reaction.actionId },
        { $set: { emoji: args.reaction.emoji } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return {
        ...rxn,
        _id: rxn._id.toString(),
        userId: rxn.userId.toString(),
        actionId: rxn.actionId ? rxn.actionId.toString() : undefined,
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

      // ponytail: ownership check before updating
      const existing = await Reaction.findById(args._id).lean();
      if (!existing) {
        throw new GraphQLError('Reaction not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existing.userId.toString() !== context.user._id.toString()) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const rxn = await Reaction.findByIdAndUpdate(
        args._id,
        { $set: { emoji: args.emoji } },
        { new: true }
      ).lean();

      return {
        ...rxn!,
        _id: rxn!._id.toString(),
        userId: rxn!.userId.toString(),
        actionId: rxn!.actionId ? rxn!.actionId.toString() : undefined,
      } as unknown as Common.Reaction;
    },

    deleteActionReaction: async (
      _parent: unknown,
      args: { _id: string },
      context: GraphQLContext
    ): Promise<boolean> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // ponytail: ownership check before deleting
      const existing = await Reaction.findById(args._id).lean();
      if (!existing) {
        throw new GraphQLError('Reaction not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existing.userId.toString() !== context.user._id.toString()) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await Reaction.findByIdAndDelete(args._id);
      return true;
    },
  },
};
