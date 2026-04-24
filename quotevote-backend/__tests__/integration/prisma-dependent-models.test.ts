/**
 * Prisma Dependent Models — Relationship CRUD Tests
 *
 * Tests Create, Read, Update, Delete operations and relationship traversal
 * for all dependent domain models defined in prisma/schema/*.prisma.
 *
 * Requires a running MongoDB instance with DATABASE_URL in .env
 *
 * Run: npx jest __tests__/integration/prisma-dependent-models.test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Typed delete functions for cleanup — no `any` needed
const deleteFns: Record<string, (id: string) => Promise<unknown>> = {
  user: (id) => prisma.user.delete({ where: { id } }),
  group: (id) => prisma.group.delete({ where: { id } }),
  post: (id) => prisma.post.delete({ where: { id } }),
  comment: (id) => prisma.comment.delete({ where: { id } }),
  quote: (id) => prisma.quote.delete({ where: { id } }),
  vote: (id) => prisma.vote.delete({ where: { id } }),
  voteLog: (id) => prisma.voteLog.delete({ where: { id } }),
  reaction: (id) => prisma.reaction.delete({ where: { id } }),
  message: (id) => prisma.message.delete({ where: { id } }),
  directMessage: (id) => prisma.directMessage.delete({ where: { id } }),
  messageRoom: (id) => prisma.messageRoom.delete({ where: { id } }),
  notification: (id) => prisma.notification.delete({ where: { id } }),
  presence: (id) => prisma.presence.delete({ where: { id } }),
  roster: (id) => prisma.roster.delete({ where: { id } }),
  typing: (id) => prisma.typing.delete({ where: { id } }),
  userInvite: (id) => prisma.userInvite.delete({ where: { id } }),
  userReport: (id) => prisma.userReport.delete({ where: { id } }),
  botReport: (id) => prisma.botReport.delete({ where: { id } }),
  userReputation: (id) => prisma.userReputation.delete({ where: { id } }),
  activity: (id) => prisma.activity.delete({ where: { id } }),
  domain: (id) => prisma.domain.delete({ where: { id } }),
  creator: (id) => prisma.creator.delete({ where: { id } }),
  content: (id) => prisma.content.delete({ where: { id } }),
  collection: (id) => prisma.collection.delete({ where: { id } }),
};

// Track created IDs for cleanup
const cleanup: { model: string; id: string }[] = [];

// Helper to register entities for cleanup (LIFO order)
function track(model: string, id: string) {
  cleanup.unshift({ model, id });
}

// Helper to create a unique test user
async function createTestUser(suffix: string) {
  const user = await prisma.user.create({
    data: {
      email: `test-${suffix}-${Date.now()}@prisma-test.com`,
      username: `testuser_${suffix}_${Date.now()}`,
      name: `Test ${suffix}`,
      accountStatus: 'active',
    },
  });
  track('user', user.id);
  return user;
}

// Helper to create a test group
async function createTestGroup(creatorId: string) {
  const group = await prisma.group.create({
    data: {
      creatorId,
      title: `Test Group ${Date.now()}`,
      privacy: 'public',
    },
  });
  track('group', group.id);
  return group;
}

// Helper to create a test post
async function createTestPost(userId: string, groupId: string) {
  const post = await prisma.post.create({
    data: {
      userId,
      groupId,
      title: `Test Post ${Date.now()}`,
      text: 'Test post content for relationship testing.',
    },
  });
  track('post', post.id);
  return post;
}

// Replica-set guard — Prisma requires MongoDB replica sets for create/update/delete
// (transactions). Detect a non-replica-set mongod up front and fail fast with a
// readable error instead of a cryptic mid-suite P2031.
beforeAll(async () => {
  await prisma.$connect();

  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const probe = await prisma.user.create({
      data: {
        email: `replica-probe-${stamp}@internal.test`,
        username: `replica_probe_${stamp}`,
        accountStatus: 'active',
      },
    });
    track('user', probe.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/replica set/i.test(msg) || /P2031/.test(msg)) {
      throw new Error(
        '\n\n⚠️  MongoDB is not running as a replica set.\n' +
          '   Prisma requires a replica set for create/update/delete (transactions).\n' +
          '   Fix (fastest): docker run -d --name mongo-rs -p 27017:27017 \\\n' +
          '                      mongo:7 --replSet rs0 --bind_ip_all\n' +
          '                  docker exec -it mongo-rs mongosh --eval "rs.initiate()"\n' +
          '   Then update DATABASE_URL to include ?replicaSet=rs0&directConnection=true\n' +
          '   See docs/prisma-migration-strategy.md for all options.\n',
      );
    }
    throw err;
  }
});

afterAll(async () => {
  // Cleanup in reverse creation order
  for (const { model, id } of cleanup) {
    try {
      const deleteFn = deleteFns[model];
      if (deleteFn) await deleteFn(id);
    } catch {
      // Already deleted or doesn't exist — ignore
    }
  }
  await prisma.$disconnect();
});

// ============================================================================
// 1. User Model
// ============================================================================
describe('User Model', () => {
  it('should create a user with defaults', async () => {
    const user = await createTestUser('user');
    expect(user.id).toBeDefined();
    expect(user.accountStatus).toBe('active');
    expect(user.tokens).toBe(0);
    expect(user.upvotes).toBe(0);
    expect(user.downvotes).toBe(0);
    expect(user.contributorBadge).toBe(false);
    expect(user.isAdmin).toBe(false);
    expect(user.joined).toBeInstanceOf(Date);
  });

  it('should update a user', async () => {
    const user = await createTestUser('userupd');
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated Name', upvotes: 5 },
    });
    expect(updated.name).toBe('Updated Name');
    expect(updated.upvotes).toBe(5);
  });

  it('should find user by username', async () => {
    const user = await createTestUser('userfind');
    const found = await prisma.user.findUnique({ where: { username: user.username } });
    expect(found).not.toBeNull();
    expect(found!.id).toBe(user.id);
  });
});

// ============================================================================
// 2. Post → User, Group relationships
// ============================================================================
describe('Post Model & Relations', () => {
  it('should create a post linked to user and group', async () => {
    const user = await createTestUser('postuser');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    expect(post.userId).toBe(user.id);
    expect(post.groupId).toBe(group.id);
    expect(post.deleted).toBe(false);
    expect(post.upvotes).toBe(0);
  });

  it('should query user → posts relation', async () => {
    const user = await createTestUser('postrel');
    const group = await createTestGroup(user.id);
    await createTestPost(user.id, group.id);
    await createTestPost(user.id, group.id);

    const userWithPosts = await prisma.user.findUnique({
      where: { id: user.id },
      include: { posts: true },
    });
    expect(userWithPosts!.posts.length).toBe(2);
  });

  it('should query post → user relation', async () => {
    const user = await createTestUser('postback');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const postWithUser = await prisma.post.findUnique({
      where: { id: post.id },
      include: { user: true },
    });
    expect(postWithUser!.user.id).toBe(user.id);
  });
});

// ============================================================================
// 3. Comment → Post, User
// ============================================================================
describe('Comment Model & Relations', () => {
  it('should create a comment on a post', async () => {
    const user = await createTestUser('commentuser');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        postId: post.id,
        content: 'Test comment',
        startWordIndex: 0,
        endWordIndex: 3,
      },
    });
    track('comment', comment.id);

    expect(comment.content).toBe('Test comment');
    expect(comment.deleted).toBe(false);
  });

  it('should query post → comments relation', async () => {
    const user = await createTestUser('commentrel');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const c1 = await prisma.comment.create({
      data: { userId: user.id, postId: post.id, content: 'Comment 1' },
    });
    const c2 = await prisma.comment.create({
      data: { userId: user.id, postId: post.id, content: 'Comment 2' },
    });
    track('comment', c1.id);
    track('comment', c2.id);

    const postWithComments = await prisma.post.findUnique({
      where: { id: post.id },
      include: { comments: true },
    });
    expect(postWithComments!.comments.length).toBe(2);
  });
});

// ============================================================================
// 4. Quote → Post, User
// ============================================================================
describe('Quote Model & Relations', () => {
  it('should create a quote linked to post and user', async () => {
    const user = await createTestUser('quoteuser');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const quote = await prisma.quote.create({
      data: {
        userId: user.id,
        postId: post.id,
        quote: 'This is a test quote',
        startWordIndex: 0,
        endWordIndex: 5,
      },
    });
    track('quote', quote.id);

    expect(quote.quote).toBe('This is a test quote');
  });

  it('should query post → quotes relation', async () => {
    const user = await createTestUser('quoterel');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const q = await prisma.quote.create({
      data: { userId: user.id, postId: post.id, quote: 'Quote 1' },
    });
    track('quote', q.id);

    const postWithQuotes = await prisma.post.findUnique({
      where: { id: post.id },
      include: { quotes: true },
    });
    expect(postWithQuotes!.quotes.length).toBe(1);
    expect(postWithQuotes!.quotes[0].quote).toBe('Quote 1');
  });
});

// ============================================================================
// 5. Vote → Post, User
// ============================================================================
describe('Vote Model & Relations', () => {
  it('should create an upvote and a downvote', async () => {
    const user = await createTestUser('voteuser');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const upvote = await prisma.vote.create({
      data: { userId: user.id, postId: post.id, type: 'up' },
    });
    const downvote = await prisma.vote.create({
      data: { userId: user.id, postId: post.id, type: 'down' },
    });
    track('vote', upvote.id);
    track('vote', downvote.id);

    expect(upvote.type).toBe('up');
    expect(downvote.type).toBe('down');
    expect(upvote.deleted).toBe(false);
  });

  it('should query post → votes relation', async () => {
    const user = await createTestUser('voterel');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const v = await prisma.vote.create({
      data: { userId: user.id, postId: post.id, type: 'up', tags: ['insightful'] },
    });
    track('vote', v.id);

    const postWithVotes = await prisma.post.findUnique({
      where: { id: post.id },
      include: { votes: true },
    });
    expect(postWithVotes!.votes.length).toBe(1);
    expect(postWithVotes!.votes[0].tags).toContain('insightful');
  });
});

// ============================================================================
// 6. MessageRoom + Message → User relationships
// ============================================================================
describe('MessageRoom & Message Relations', () => {
  it('should create a message room and messages', async () => {
    const user = await createTestUser('msguser');

    const room = await prisma.messageRoom.create({
      data: {
        userIds: [user.id],
        messageType: 'USER',
        isDirect: true,
      },
    });
    track('messageRoom', room.id);

    const msg = await prisma.message.create({
      data: {
        messageRoomId: room.id,
        userId: user.id,
        text: 'Hello world',
      },
    });
    track('message', msg.id);

    expect(msg.text).toBe('Hello world');
    expect(msg.deleted).toBe(false);
  });

  it('should query room → messages relation', async () => {
    const user = await createTestUser('msgrel');

    const room = await prisma.messageRoom.create({
      data: { userIds: [user.id], messageType: 'USER' },
    });
    track('messageRoom', room.id);

    const m1 = await prisma.message.create({
      data: { messageRoomId: room.id, userId: user.id, text: 'Msg 1' },
    });
    const m2 = await prisma.message.create({
      data: { messageRoomId: room.id, userId: user.id, text: 'Msg 2' },
    });
    track('message', m1.id);
    track('message', m2.id);

    const roomWithMessages = await prisma.messageRoom.findUnique({
      where: { id: room.id },
      include: { messages: true },
    });
    expect(roomWithMessages!.messages.length).toBe(2);
  });
});

// ============================================================================
// 7. Reaction → Message, User
// ============================================================================
describe('Reaction Model & Relations', () => {
  it('should create a reaction on a message', async () => {
    const user = await createTestUser('reactuser');
    const room = await prisma.messageRoom.create({
      data: { userIds: [user.id], messageType: 'USER' },
    });
    track('messageRoom', room.id);

    const msg = await prisma.message.create({
      data: { messageRoomId: room.id, userId: user.id, text: 'React to this' },
    });
    track('message', msg.id);

    const reaction = await prisma.reaction.create({
      data: { userId: user.id, messageId: msg.id, emoji: '👍' },
    });
    track('reaction', reaction.id);

    expect(reaction.emoji).toBe('👍');
  });

  it('should query message → reactions relation', async () => {
    const user = await createTestUser('reactrel');
    const room = await prisma.messageRoom.create({
      data: { userIds: [user.id], messageType: 'USER' },
    });
    track('messageRoom', room.id);

    const msg = await prisma.message.create({
      data: { messageRoomId: room.id, userId: user.id, text: 'Reactions test' },
    });
    track('message', msg.id);

    const r = await prisma.reaction.create({
      data: { userId: user.id, messageId: msg.id, emoji: '❤️' },
    });
    track('reaction', r.id);

    const msgWithReactions = await prisma.message.findUnique({
      where: { id: msg.id },
      include: { reactions: true },
    });
    expect(msgWithReactions!.reactions.length).toBe(1);
  });
});

// ============================================================================
// 8. Presence → User
// ============================================================================
describe('Presence Model & Relations', () => {
  it('should create presence for a user', async () => {
    const user = await createTestUser('presuser');

    const presence = await prisma.presence.create({
      data: { userId: user.id, status: 'online' },
    });
    track('presence', presence.id);

    expect(presence.status).toBe('online');
    expect(presence.userId).toBe(user.id);
  });

  it('should query user → presence relation', async () => {
    const user = await createTestUser('presrel');

    const p = await prisma.presence.create({
      data: { userId: user.id, status: 'away', statusMessage: 'BRB' },
    });
    track('presence', p.id);

    const userWithPresence = await prisma.user.findUnique({
      where: { id: user.id },
      include: { presence: true },
    });
    expect(userWithPresence!.presence).not.toBeNull();
    expect(userWithPresence!.presence!.status).toBe('away');
    expect(userWithPresence!.presence!.statusMessage).toBe('BRB');
  });
});

// ============================================================================
// 9. Roster → User (bidirectional buddy)
// ============================================================================
describe('Roster Model & Relations', () => {
  it('should create a roster entry between two users', async () => {
    const user1 = await createTestUser('roster1');
    const user2 = await createTestUser('roster2');

    const roster = await prisma.roster.create({
      data: {
        userId: user1.id,
        buddyId: user2.id,
        status: 'pending',
        initiatedBy: user1.id,
      },
    });
    track('roster', roster.id);

    expect(roster.status).toBe('pending');
  });

  it('should enforce unique userId+buddyId constraint', async () => {
    const user1 = await createTestUser('rosteruniq1');
    const user2 = await createTestUser('rosteruniq2');

    const r = await prisma.roster.create({
      data: { userId: user1.id, buddyId: user2.id, status: 'accepted' },
    });
    track('roster', r.id);

    await expect(
      prisma.roster.create({
        data: { userId: user1.id, buddyId: user2.id, status: 'pending' },
      })
    ).rejects.toThrow();
  });

  it('should query user → rosters relation', async () => {
    const user1 = await createTestUser('rosterrel1');
    const user2 = await createTestUser('rosterrel2');

    const r = await prisma.roster.create({
      data: { userId: user1.id, buddyId: user2.id, status: 'accepted' },
    });
    track('roster', r.id);

    const userWithRosters = await prisma.user.findUnique({
      where: { id: user1.id },
      include: { rosters: true, buddyRosters: true },
    });
    expect(userWithRosters!.rosters.length).toBe(1);
  });
});

// ============================================================================
// 10. Typing → MessageRoom, User
// ============================================================================
describe('Typing Model & Relations', () => {
  it('should create a typing indicator', async () => {
    const user = await createTestUser('typeuser');
    const room = await prisma.messageRoom.create({
      data: { userIds: [user.id], messageType: 'USER' },
    });
    track('messageRoom', room.id);

    const typing = await prisma.typing.create({
      data: { messageRoomId: room.id, userId: user.id, isTyping: true },
    });
    track('typing', typing.id);

    expect(typing.isTyping).toBe(true);
  });

  it('should enforce unique messageRoomId+userId constraint', async () => {
    const user = await createTestUser('typeuniq');
    const room = await prisma.messageRoom.create({
      data: { userIds: [user.id], messageType: 'USER' },
    });
    track('messageRoom', room.id);

    const t = await prisma.typing.create({
      data: { messageRoomId: room.id, userId: user.id },
    });
    track('typing', t.id);

    await expect(
      prisma.typing.create({
        data: { messageRoomId: room.id, userId: user.id },
      })
    ).rejects.toThrow();
  });

  it('should query room → typingIndicators relation', async () => {
    const user = await createTestUser('typerel');
    const room = await prisma.messageRoom.create({
      data: { userIds: [user.id], messageType: 'USER' },
    });
    track('messageRoom', room.id);

    const t = await prisma.typing.create({
      data: { messageRoomId: room.id, userId: user.id },
    });
    track('typing', t.id);

    const roomWithTyping = await prisma.messageRoom.findUnique({
      where: { id: room.id },
      include: { typingIndicators: true },
    });
    expect(roomWithTyping!.typingIndicators.length).toBe(1);
  });
});

// ============================================================================
// 11. UserReport → User (reporter + reported)
// ============================================================================
describe('UserReport Model & Relations', () => {
  it('should create a user report', async () => {
    const reporter = await createTestUser('reporter');
    const reported = await createTestUser('reported');

    const report = await prisma.userReport.create({
      data: {
        reporterId: reporter.id,
        reportedUserId: reported.id,
        reason: 'spam',
        description: 'Test report',
      },
    });
    track('userReport', report.id);

    expect(report.reason).toBe('spam');
    expect(report.status).toBe('pending');
    expect(report.severity).toBe('medium');
  });

  it('should query user → reports relations', async () => {
    const reporter = await createTestUser('reprel1');
    const reported = await createTestUser('reprel2');

    const r = await prisma.userReport.create({
      data: { reporterId: reporter.id, reportedUserId: reported.id, reason: 'harassment' },
    });
    track('userReport', r.id);

    const reporterWithReports = await prisma.user.findUnique({
      where: { id: reporter.id },
      include: { userReportsMade: true },
    });
    expect(reporterWithReports!.userReportsMade.length).toBe(1);

    const reportedWithReports = await prisma.user.findUnique({
      where: { id: reported.id },
      include: { userReportsReceived: true },
    });
    expect(reportedWithReports!.userReportsReceived.length).toBe(1);
  });
});

// ============================================================================
// 12. Deep Nested Relations: User → Post → Comments + Votes + Quotes
// ============================================================================
describe('Deep Nested Relationship Traversal', () => {
  it('should traverse user → posts → comments + votes + quotes', async () => {
    const user = await createTestUser('deeprel');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const comment = await prisma.comment.create({
      data: { userId: user.id, postId: post.id, content: 'Deep comment' },
    });
    const vote = await prisma.vote.create({
      data: { userId: user.id, postId: post.id, type: 'up' },
    });
    const quote = await prisma.quote.create({
      data: { userId: user.id, postId: post.id, quote: 'Deep quote' },
    });
    track('comment', comment.id);
    track('vote', vote.id);
    track('quote', quote.id);

    const userDeep = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        posts: {
          include: {
            comments: true,
            votes: true,
            quotes: true,
          },
        },
      },
    });

    expect(userDeep!.posts.length).toBe(1);
    expect(userDeep!.posts[0].comments.length).toBe(1);
    expect(userDeep!.posts[0].votes.length).toBe(1);
    expect(userDeep!.posts[0].quotes.length).toBe(1);
    expect(userDeep!.posts[0].comments[0].content).toBe('Deep comment');
    expect(userDeep!.posts[0].votes[0].type).toBe('up');
    expect(userDeep!.posts[0].quotes[0].quote).toBe('Deep quote');
  });

  it('should traverse room → messages → reactions', async () => {
    const user = await createTestUser('deepmsg');
    const room = await prisma.messageRoom.create({
      data: { userIds: [user.id], messageType: 'USER' },
    });
    track('messageRoom', room.id);

    const msg = await prisma.message.create({
      data: { messageRoomId: room.id, userId: user.id, text: 'Deep message' },
    });
    track('message', msg.id);

    const reaction = await prisma.reaction.create({
      data: { userId: user.id, messageId: msg.id, emoji: '🔥' },
    });
    track('reaction', reaction.id);

    const roomDeep = await prisma.messageRoom.findUnique({
      where: { id: room.id },
      include: {
        messages: {
          include: { reactions: true },
        },
      },
    });

    expect(roomDeep!.messages.length).toBe(1);
    expect(roomDeep!.messages[0].reactions.length).toBe(1);
    expect(roomDeep!.messages[0].reactions[0].emoji).toBe('🔥');
  });
});

// ============================================================================
// 13. Activity → User, Post, Vote, Comment, Quote
// ============================================================================
describe('Activity Model & Relations', () => {
  it('should create an activity linked to user and post', async () => {
    const user = await createTestUser('actuser');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const activity = await prisma.activity.create({
      data: {
        userId: user.id,
        postId: post.id,
        activityType: 'POSTED',
        content: 'Created a post',
      },
    });
    track('activity', activity.id);

    expect(activity.activityType).toBe('POSTED');
  });

  it('should query user → activities relation', async () => {
    const user = await createTestUser('actrel');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const a = await prisma.activity.create({
      data: { userId: user.id, postId: post.id, activityType: 'VOTED' },
    });
    track('activity', a.id);

    const userWithActivities = await prisma.user.findUnique({
      where: { id: user.id },
      include: { activities: true },
    });
    expect(userWithActivities!.activities.length).toBe(1);
  });
});

// ============================================================================
// 14. VoteLog → User, Post, Vote
// ============================================================================
describe('VoteLog Model & Relations', () => {
  it('should create a vote log entry', async () => {
    const user = await createTestUser('vloguser');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);
    const vote = await prisma.vote.create({
      data: { userId: user.id, postId: post.id, type: 'up' },
    });
    track('vote', vote.id);

    const log = await prisma.voteLog.create({
      data: {
        userId: user.id,
        voteId: vote.id,
        postId: post.id,
        description: 'User cast an upvote',
        type: 'up',
        tokens: 1,
      },
    });
    track('voteLog', log.id);

    expect(log.voteId).toBe(vote.id);
    expect(log.tokens).toBe(1);
  });

  it('should query user → voteLog relation', async () => {
    const user = await createTestUser('vlogrel');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);
    const vote = await prisma.vote.create({
      data: { userId: user.id, postId: post.id, type: 'down' },
    });
    track('vote', vote.id);
    const log = await prisma.voteLog.create({
      data: {
        userId: user.id,
        voteId: vote.id,
        postId: post.id,
        description: 'downvote',
        type: 'down',
        tokens: 1,
      },
    });
    track('voteLog', log.id);

    const userWithLogs = await prisma.user.findUnique({
      where: { id: user.id },
      include: { voteLog: true },
    });
    expect(userWithLogs!.voteLog.length).toBe(1);
  });
});

// ============================================================================
// 15. DirectMessage → User
// ============================================================================
describe('DirectMessage Model & Relations', () => {
  it('should create a direct message for a user', async () => {
    const user = await createTestUser('dmuser');
    const dm = await prisma.directMessage.create({
      data: { userId: user.id, text: 'Direct hello', title: 'DM' },
    });
    track('directMessage', dm.id);

    expect(dm.text).toBe('Direct hello');
  });

  it('should query user → directMessages relation', async () => {
    const user = await createTestUser('dmrel');
    const dm = await prisma.directMessage.create({
      data: { userId: user.id, text: 'DM 1' },
    });
    track('directMessage', dm.id);

    const userWithDms = await prisma.user.findUnique({
      where: { id: user.id },
      include: { directMessages: true },
    });
    expect(userWithDms!.directMessages.length).toBe(1);
  });
});

// ============================================================================
// 16. Notification → User (recipient + sender), Post
// ============================================================================
describe('Notification Model & Relations', () => {
  it('should create a notification', async () => {
    const recipient = await createTestUser('notifrec');
    const sender = await createTestUser('notifsend');
    const group = await createTestGroup(sender.id);
    const post = await createTestPost(sender.id, group.id);

    const notif = await prisma.notification.create({
      data: {
        userId: recipient.id,
        userIdBy: sender.id,
        label: 'upvoted your post',
        notificationType: 'UPVOTED',
        postId: post.id,
      },
    });
    track('notification', notif.id);

    expect(notif.status).toBe('new');
  });

  it('should query sender and recipient relations', async () => {
    const recipient = await createTestUser('notifrel1');
    const sender = await createTestUser('notifrel2');

    const n = await prisma.notification.create({
      data: {
        userId: recipient.id,
        userIdBy: sender.id,
        label: 'followed you',
        notificationType: 'FOLLOW',
      },
    });
    track('notification', n.id);

    const full = await prisma.notification.findUnique({
      where: { id: n.id },
      include: { user: true, sender: true },
    });
    expect(full!.user.id).toBe(recipient.id);
    expect(full!.sender.id).toBe(sender.id);
  });
});

// ============================================================================
// 17. UserInvite → User (optional sender)
// ============================================================================
describe('UserInvite Model & Relations', () => {
  it('should create an invite with status defaults', async () => {
    const inviter = await createTestUser('inviter');
    const invite = await prisma.userInvite.create({
      data: {
        email: `invitee-${Date.now()}@test.com`,
        invitedById: inviter.id,
        code: `CODE-${Date.now()}`,
      },
    });
    track('userInvite', invite.id);

    expect(invite.status).toBe('pending');
  });

  it('should query inviter → inviteSent relation', async () => {
    const inviter = await createTestUser('inviterrel');
    const inv = await prisma.userInvite.create({
      data: {
        email: `invitee2-${Date.now()}@test.com`,
        invitedById: inviter.id,
      },
    });
    track('userInvite', inv.id);

    const withInvites = await prisma.user.findUnique({
      where: { id: inviter.id },
      include: { inviteSent: true },
    });
    expect(withInvites!.inviteSent.length).toBe(1);
  });
});

// ============================================================================
// 18. BotReport → User (reporter + reported)
// ============================================================================
describe('BotReport Model & Relations', () => {
  it('should create a bot report', async () => {
    const reporter = await createTestUser('botreprt');
    const reported = await createTestUser('botrepd');

    const r = await prisma.botReport.create({
      data: { reporterId: reporter.id, userId: reported.id },
    });
    track('botReport', r.id);

    expect(r.reporterId).toBe(reporter.id);
    expect(r.userId).toBe(reported.id);
  });

  it('should enforce unique (reporterId, userId) constraint', async () => {
    const reporter = await createTestUser('botuniq1');
    const reported = await createTestUser('botuniq2');

    const r = await prisma.botReport.create({
      data: { reporterId: reporter.id, userId: reported.id },
    });
    track('botReport', r.id);

    await expect(
      prisma.botReport.create({
        data: { reporterId: reporter.id, userId: reported.id },
      })
    ).rejects.toThrow();
  });

  it('should query user → botReportsMade/botReportsReceived', async () => {
    const reporter = await createTestUser('botrel1');
    const reported = await createTestUser('botrel2');
    const r = await prisma.botReport.create({
      data: { reporterId: reporter.id, userId: reported.id },
    });
    track('botReport', r.id);

    const made = await prisma.user.findUnique({
      where: { id: reporter.id },
      include: { botReportsMade: true },
    });
    const received = await prisma.user.findUnique({
      where: { id: reported.id },
      include: { botReportsReceived: true },
    });
    expect(made!.botReportsMade.length).toBe(1);
    expect(received!.botReportsReceived.length).toBe(1);
  });
});

// ============================================================================
// 19. UserReputation → User (1-to-1)
// ============================================================================
describe('UserReputation Model & Relations', () => {
  it('should create a reputation record with embedded metrics', async () => {
    const user = await createTestUser('repuser');
    const rep = await prisma.userReputation.create({
      data: {
        userId: user.id,
        overallScore: 75,
        inviteNetworkScore: 10,
        conductScore: 30,
        activityScore: 35,
        metrics: {
          totalInvitesSent: 5,
          totalInvitesAccepted: 3,
          totalInvitesDeclined: 1,
          averageInviteeReputation: 50,
          totalReportsReceived: 0,
          totalReportsResolved: 0,
          totalUpvotes: 20,
          totalDownvotes: 2,
          totalPosts: 4,
          totalComments: 15,
        },
      },
    });
    track('userReputation', rep.id);

    expect(rep.overallScore).toBe(75);
    expect(rep.metrics.totalInvitesSent).toBe(5);
  });

  it('should enforce unique userId constraint', async () => {
    const user = await createTestUser('repuniq');
    const rep = await prisma.userReputation.create({
      data: {
        userId: user.id,
        overallScore: 10,
        inviteNetworkScore: 0,
        conductScore: 0,
        activityScore: 0,
        metrics: {
          totalInvitesSent: 0,
          totalInvitesAccepted: 0,
          totalInvitesDeclined: 0,
          averageInviteeReputation: 0,
          totalReportsReceived: 0,
          totalReportsResolved: 0,
          totalUpvotes: 0,
          totalDownvotes: 0,
          totalPosts: 0,
          totalComments: 0,
        },
      },
    });
    track('userReputation', rep.id);

    await expect(
      prisma.userReputation.create({
        data: {
          userId: user.id,
          overallScore: 20,
          inviteNetworkScore: 0,
          conductScore: 0,
          activityScore: 0,
          metrics: {
            totalInvitesSent: 0,
            totalInvitesAccepted: 0,
            totalInvitesDeclined: 0,
            averageInviteeReputation: 0,
            totalReportsReceived: 0,
            totalReportsResolved: 0,
            totalUpvotes: 0,
            totalDownvotes: 0,
            totalPosts: 0,
            totalComments: 0,
          },
        },
      })
    ).rejects.toThrow();
  });
});

// ============================================================================
// 20. Domain → Content
// ============================================================================
describe('Domain / Creator / Content / Collection Models', () => {
  it('should create a Domain and Content linked via relation', async () => {
    const domain = await prisma.domain.create({
      data: { key: `domain_${Date.now()}`, name: 'Example' },
    });
    track('domain', domain.id);

    const creator = await prisma.creator.create({
      data: { name: `Creator ${Date.now()}`, bio: 'Bio' },
    });
    track('creator', creator.id);

    const content = await prisma.content.create({
      data: {
        title: 'Linked content',
        creatorId: creator.id,
        domainId: domain.id,
        url: 'https://example.com',
      },
    });
    track('content', content.id);

    const full = await prisma.content.findUnique({
      where: { id: content.id },
      include: { creator: true, domain: true },
    });
    expect(full!.creator.id).toBe(creator.id);
    expect(full!.domain!.id).toBe(domain.id);

    // Domain → contents reverse relation
    const domainFull = await prisma.domain.findUnique({
      where: { id: domain.id },
      include: { contents: true },
    });
    expect(domainFull!.contents.length).toBe(1);
  });

  it('should create a Collection linked to a user', async () => {
    const user = await createTestUser('colluser');
    const group = await createTestGroup(user.id);
    const post = await createTestPost(user.id, group.id);

    const coll = await prisma.collection.create({
      data: {
        userId: user.id,
        name: `Collection ${Date.now()}`,
        description: 'Test collection',
        postIds: [post.id],
      },
    });
    track('collection', coll.id);

    const withColl = await prisma.user.findUnique({
      where: { id: user.id },
      include: { collections: true },
    });
    expect(withColl!.collections.length).toBe(1);
    expect(withColl!.collections[0].postIds).toContain(post.id);
  });
});

// ============================================================================
// 21. Deeper traversal — 3-level includes
// ============================================================================
describe('3-Level Deep Relationship Traversal', () => {
  it('should traverse user → posts → comments → commenter (back to user)', async () => {
    const author = await createTestUser('deep3a');
    const commenter = await createTestUser('deep3b');
    const group = await createTestGroup(author.id);
    const post = await createTestPost(author.id, group.id);

    const comment = await prisma.comment.create({
      data: { userId: commenter.id, postId: post.id, content: 'Deep comment' },
    });
    track('comment', comment.id);

    const authorDeep = await prisma.user.findUnique({
      where: { id: author.id },
      include: {
        posts: {
          include: {
            comments: {
              include: { user: true },
            },
          },
        },
      },
    });

    expect(authorDeep!.posts[0].comments.length).toBe(1);
    expect(authorDeep!.posts[0].comments[0].user.id).toBe(commenter.id);
    expect(authorDeep!.posts[0].comments[0].user.username).toBe(commenter.username);
  });

  it('should traverse user → rooms → messages → reactions → reactor', async () => {
    const user = await createTestUser('deep3msg');
    const reactor = await createTestUser('deep3react');
    const room = await prisma.messageRoom.create({
      data: { userIds: [user.id, reactor.id], messageType: 'USER' },
    });
    track('messageRoom', room.id);

    const msg = await prisma.message.create({
      data: { messageRoomId: room.id, userId: user.id, text: 'hi' },
    });
    track('message', msg.id);

    const reaction = await prisma.reaction.create({
      data: { userId: reactor.id, messageId: msg.id, emoji: '✨' },
    });
    track('reaction', reaction.id);

    const roomDeep = await prisma.messageRoom.findUnique({
      where: { id: room.id },
      include: {
        messages: {
          include: {
            reactions: {
              include: { user: true },
            },
          },
        },
      },
    });

    expect(roomDeep!.messages[0].reactions[0].user.id).toBe(reactor.id);
    expect(roomDeep!.messages[0].reactions[0].user.username).toBe(reactor.username);
  });
});

// ============================================================================
// 22. Smoke — all 24 model delegates exist and are countable
// ============================================================================
describe('All 24 models — delegate smoke test', () => {
  it('should have working count() on every model', async () => {
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.group.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.quote.count(),
      prisma.vote.count(),
      prisma.voteLog.count(),
      prisma.reaction.count(),
      prisma.message.count(),
      prisma.directMessage.count(),
      prisma.messageRoom.count(),
      prisma.notification.count(),
      prisma.activity.count(),
      prisma.roster.count(),
      prisma.presence.count(),
      prisma.typing.count(),
      prisma.userInvite.count(),
      prisma.userReport.count(),
      prisma.botReport.count(),
      prisma.userReputation.count(),
      prisma.domain.count(),
      prisma.creator.count(),
      prisma.content.count(),
      prisma.collection.count(),
    ]);
    expect(counts).toHaveLength(24);
    counts.forEach((c) => expect(typeof c).toBe('number'));
  });
});
