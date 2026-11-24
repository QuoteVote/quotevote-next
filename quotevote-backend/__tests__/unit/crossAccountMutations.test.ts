process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import { graphql, type ExecutionResult } from 'graphql';
import { schema } from '~/data/schema';

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Part of #107 (slice 3): cross-account mutations. Every mutation that takes an id
// must reject a signed-in member acting on someone else's resource, unless the
// resolver lets admins through. Denied cases assert the code, the message and that
// the protected write never ran.

const ownerId = '507f1f77bcf86cd799439101';
const attackerId = '507f1f77bcf86cd799439102';
const adminId = '507f1f77bcf86cd799439103';
const postId = '507f1f77bcf86cd799439111';
const commentId = '507f1f77bcf86cd799439112';
const quoteId = '507f1f77bcf86cd799439113';
const voteId = '507f1f77bcf86cd799439114';
const notificationId = '507f1f77bcf86cd799439115';
const reactionId = '507f1f77bcf86cd799439116';
const requestId = '507f1f77bcf86cd799439117';

type Persona = { label: string; user: { _id: string; admin: boolean } };
const owner: Persona = { label: 'the owner', user: { _id: ownerId, admin: false } };
const attacker: Persona = { label: 'another member', user: { _id: attackerId, admin: false } };
const admin: Persona = { label: 'an admin', user: { _id: adminId, admin: true } };

function buildPrisma() {
  const model = () => ({
    findUnique: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  });
  return {
    post: model(),
    comment: model(),
    quote: model(),
    vote: model(),
    notification: model(),
    reaction: model(),
    buddyRelationship: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    user: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn().mockResolvedValue(undefined),
  };
}

type Prisma = ReturnType<typeof buildPrisma>;

async function run(source: string, user: Persona['user'], prisma: Prisma) {
  return graphql({
    schema,
    source,
    contextValue: { user, userId: user._id, prisma },
  });
}

const codeOf = (result: ExecutionResult) => result.errors?.[0]?.extensions?.code;
const messageOf = (result: ExecutionResult) => result.errors?.[0]?.message;

type OwnedResource = {
  name: string;
  source: string;
  seed: (p: Prisma) => void;
  write: (p: Prisma) => jest.Mock;
  denied: string;
  adminAllowed: boolean;
};

const resources: OwnedResource[] = [
  {
    name: 'deletePost',
    source: `mutation { r: deletePost(postId: "${postId}") { _id } }`,
    seed: (p) =>
      p.post.findUnique.mockResolvedValue({ id: postId, userId: ownerId, deleted: false }),
    write: (p) => p.post.update,
    denied: 'Not authorized to delete this post',
    adminAllowed: true,
  },
  {
    name: 'toggleVoting',
    source: `mutation { r: toggleVoting(postId: "${postId}") { _id } }`,
    seed: (p) =>
      p.post.findUnique.mockResolvedValue({ userId: ownerId, deleted: false, enableVoting: true }),
    write: (p) => p.post.update,
    denied: 'Not authorized to toggle voting on this post',
    adminAllowed: true,
  },
  {
    name: 'updateComment',
    source: `mutation { r: updateComment(commentId: "${commentId}", content: "edited") { _id } }`,
    seed: (p) =>
      p.comment.findUnique.mockResolvedValue({ id: commentId, userId: ownerId, deleted: false }),
    write: (p) => p.comment.update,
    denied: 'Not authorized to update this comment',
    adminAllowed: true,
  },
  {
    name: 'deleteComment',
    source: `mutation { r: deleteComment(commentId: "${commentId}") { _id } }`,
    seed: (p) =>
      p.comment.findUnique.mockResolvedValue({ id: commentId, userId: ownerId, deleted: false }),
    write: (p) => p.comment.update,
    denied: 'Not authorized to delete this comment',
    adminAllowed: true,
  },
  {
    name: 'deleteQuote',
    source: `mutation { r: deleteQuote(quoteId: "${quoteId}") { _id } }`,
    seed: (p) =>
      p.quote.findUnique.mockResolvedValue({ id: quoteId, userId: ownerId, deleted: false }),
    write: (p) => p.quote.update,
    denied: 'Not authorized to delete this quote',
    adminAllowed: true,
  },
  {
    name: 'deleteVote',
    source: `mutation { r: deleteVote(voteId: "${voteId}") { _id } }`,
    seed: (p) =>
      p.vote.findUnique.mockResolvedValue({
        id: voteId,
        userId: ownerId,
        postId,
        type: 'up',
        deleted: false,
      }),
    write: (p) => p.$transaction,
    denied: 'Not authorized to delete this vote',
    adminAllowed: true,
  },
  {
    name: 'removeNotification',
    source: `mutation { r: removeNotification(notificationId: "${notificationId}") { _id } }`,
    seed: (p) =>
      p.notification.findUnique.mockResolvedValue({
        id: notificationId,
        userId: ownerId,
        status: 'new',
      }),
    write: (p) => p.notification.update,
    denied: 'Not authorized to remove this notification',
    adminAllowed: false,
  },
  {
    name: 'markNotificationRead',
    source: `mutation { r: markNotificationRead(notificationId: "${notificationId}") { _id } }`,
    seed: (p) =>
      p.notification.findUnique.mockResolvedValue({
        id: notificationId,
        userId: ownerId,
        status: 'new',
      }),
    write: (p) => p.notification.update,
    denied: 'Not authorized to update this notification',
    adminAllowed: false,
  },
  {
    name: 'updateActionReaction',
    source: `mutation { r: updateActionReaction(_id: "${reactionId}", emoji: "🎉") { _id } }`,
    seed: (p) => p.reaction.findUnique.mockResolvedValue({ id: reactionId, userId: ownerId }),
    write: (p) => p.reaction.update,
    denied: 'Not authorized',
    adminAllowed: false,
  },
  {
    name: 'deleteActionReaction',
    source: `mutation { r: deleteActionReaction(_id: "${reactionId}") }`,
    seed: (p) => p.reaction.findUnique.mockResolvedValue({ id: reactionId, userId: ownerId }),
    write: (p) => p.reaction.delete,
    denied: 'Not authorized',
    adminAllowed: false,
  },
];

describe("cross-account mutations on someone else's resource", () => {
  describe.each(resources)('$name', (op) => {
    it('rejects another member and never writes', async () => {
      const prisma = buildPrisma();
      op.seed(prisma);

      const result = await run(op.source, attacker.user, prisma);

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe(op.denied);
      expect(op.write(prisma)).not.toHaveBeenCalled();
    });

    it('lets the owner reach the write', async () => {
      const prisma = buildPrisma();
      op.seed(prisma);

      await run(op.source, owner.user, prisma);

      expect(op.write(prisma)).toHaveBeenCalled();
    });

    it(`${op.adminAllowed ? 'lets' : 'does not let'} an admin reach the write`, async () => {
      const prisma = buildPrisma();
      op.seed(prisma);

      const result = await run(op.source, admin.user, prisma);

      if (op.adminAllowed) {
        expect(op.write(prisma)).toHaveBeenCalled();
      } else {
        expect(codeOf(result)).toBe('FORBIDDEN');
        expect(op.write(prisma)).not.toHaveBeenCalled();
      }
    });
  });

  describe.each([attacker, admin])('acting on behalf of another user, as $label', ({ user }) => {
    // These mutations take the actor's id as an argument. It must match the session,
    // and being an admin does not change that.
    const onBehalf: {
      name: string;
      source: string;
      denied: string;
      touched: (p: Prisma) => jest.Mock;
    }[] = [
      {
        name: 'approvePost',
        source: `mutation { r: approvePost(postId: "${postId}", userId: "${ownerId}") { _id } }`,
        denied: 'Not authorized to approve on behalf of another user',
        touched: (p) => p.post.findUnique,
      },
      {
        name: 'rejectPost',
        source: `mutation { r: rejectPost(postId: "${postId}", userId: "${ownerId}") { _id } }`,
        denied: 'Not authorized to reject on behalf of another user',
        touched: (p) => p.post.findUnique,
      },
      {
        name: 'updatePostBookmark',
        source: `mutation { r: updatePostBookmark(postId: "${postId}", userId: "${ownerId}") { _id } }`,
        denied: 'Not authorized to bookmark on behalf of another user',
        touched: (p) => p.post.findUnique,
      },
      {
        name: 'reportPost',
        source: `mutation { r: reportPost(postId: "${postId}", userId: "${ownerId}") { _id } }`,
        denied: 'Not authorized to report on behalf of another user',
        touched: (p) => p.post.findUnique,
      },
      {
        name: 'reportBot',
        source: `mutation { r: reportBot(userId: "${postId}", reporterId: "${ownerId}") }`,
        denied: 'Not authorized to report on behalf of another user',
        touched: (p) => p.user.findUnique,
      },
      {
        name: 'updateUserAvatar',
        source: `mutation { r: updateUserAvatar(user_id: "${ownerId}", avatarQualities: {}) { _id } }`,
        denied: 'Not authorized to update this avatar',
        touched: (p) => p.user.findUnique,
      },
    ];

    it.each(onBehalf)('$name is rejected before any read', async (op) => {
      const prisma = buildPrisma();

      const result = await run(op.source, user, prisma);

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe(op.denied);
      expect(op.touched(prisma)).not.toHaveBeenCalled();
    });
  });

  describe('buddy requests', () => {
    // These resolvers scope the write by the caller instead of throwing FORBIDDEN:
    // a request addressed to someone else simply is not found.
    it.each([
      [
        'acceptBuddy',
        `mutation { r: acceptBuddy(requestId: "${requestId}") { _id } }`,
        'updateMany',
      ],
      [
        'declineBuddy',
        `mutation { r: declineBuddy(requestId: "${requestId}") { _id } }`,
        'deleteMany',
      ],
    ] as const)(
      '%s only matches requests addressed to the caller',
      async (_name, source, method) => {
        const prisma = buildPrisma();

        const result = await run(source, attacker.user, prisma);

        expect(codeOf(result)).toBe('NOT_FOUND');
        expect(prisma.buddyRelationship[method]).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ id: requestId, recipientId: attackerId }),
          })
        );
      }
    );
  });
});
