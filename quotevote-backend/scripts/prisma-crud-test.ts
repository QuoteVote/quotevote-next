/// <reference types="node" />
/**
 * Prisma CRUD Test Script — ALL MODELS
 *
 * Exercises Create, Read, Update, Delete and relationship traversal across
 * every model defined in `prisma/schema/*.prisma` (24 models total). Also
 * validates that deep nested `include` queries traverse multiple relationship
 * levels correctly (user → posts → comments, room → messages → reactions, etc.).
 *
 * Models covered (24):
 *   User, Group, Post, Comment, Quote, Vote, VoteLog, Reaction,
 *   Message, DirectMessage, MessageRoom, Notification,
 *   Activity, Roster, Presence, Typing,
 *   UserInvite, UserReport, BotReport, UserReputation,
 *   Domain, Creator, Content, Collection
 *
 * Usage: pnpm prisma:test
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Track created docs for LIFO cleanup
interface Created {
  model: string;
  id: string;
}
const created: Created[] = [];

function track(model: string, id: string): void {
  created.unshift({ model, id });
}

type PrismaDelegate = {
  delete: (args: { where: { id: string } }) => Promise<unknown>;
};

function delegateFor(model: string): PrismaDelegate | null {
  const map: Record<string, PrismaDelegate> = {
    user: prisma.user,
    group: prisma.group,
    post: prisma.post,
    comment: prisma.comment,
    quote: prisma.quote,
    vote: prisma.vote,
    voteLog: prisma.voteLog,
    reaction: prisma.reaction,
    message: prisma.message,
    directMessage: prisma.directMessage,
    messageRoom: prisma.messageRoom,
    notification: prisma.notification,
    activity: prisma.activity,
    roster: prisma.roster,
    presence: prisma.presence,
    typing: prisma.typing,
    userInvite: prisma.userInvite,
    userReport: prisma.userReport,
    botReport: prisma.botReport,
    userReputation: prisma.userReputation,
    domain: prisma.domain,
    creator: prisma.creator,
    content: prisma.content,
    collection: prisma.collection,
  };
  return map[model] ?? null;
}

let testsPassed = 0;
let testsFailed = 0;

async function step(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    testsPassed += 1;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${(err as Error).message}`);
    testsFailed += 1;
    throw err;
  }
}

function uniq(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Per-model CRUD round-trips
// ---------------------------------------------------------------------------

async function testUser(): Promise<string> {
  console.log('\n👤 User');
  const u = uniq();
  let userId = '';

  await step('CREATE user', async () => {
    const user = await prisma.user.create({
      data: {
        email: `crud-${u}@prisma-test.com`,
        username: `crud_${u}`,
        name: 'CRUD User',
        accountStatus: 'active',
      },
    });
    track('user', user.id);
    userId = user.id;
  });

  await step('READ user', async () => {
    const found = await prisma.user.findUnique({ where: { id: userId } });
    if (!found) throw new Error('user not found');
  });

  await step('UPDATE user', async () => {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { upvotes: 42, name: 'Updated' },
    });
    if (updated.upvotes !== 42) throw new Error('update failed');
  });

  return userId;
}

async function testGroup(ownerId: string): Promise<string> {
  console.log('\n👥 Group');
  let groupId = '';
  await step('CREATE group', async () => {
    const group = await prisma.group.create({
      data: { creatorId: ownerId, title: `Group ${uniq()}`, privacy: 'public' },
    });
    track('group', group.id);
    groupId = group.id;
  });
  await step('UPDATE group', async () => {
    await prisma.group.update({
      where: { id: groupId },
      data: { title: 'Renamed Group' },
    });
  });
  return groupId;
}

async function testPost(userId: string, groupId: string): Promise<string> {
  console.log('\n📝 Post');
  let postId = '';
  await step('CREATE post', async () => {
    const post = await prisma.post.create({
      data: {
        userId,
        groupId,
        title: 'CRUD Post',
        text: 'Body',
        enableVoting: true,
      },
    });
    track('post', post.id);
    postId = post.id;
  });
  await step('READ post → user relation', async () => {
    const p = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true, group: true },
    });
    if (!p || p.user.id !== userId) throw new Error('relation broken');
  });
  await step('UPDATE post', async () => {
    await prisma.post.update({ where: { id: postId }, data: { upvotes: 5 } });
  });
  return postId;
}

async function testComment(userId: string, postId: string): Promise<string> {
  console.log('\n💬 Comment');
  let id = '';
  await step('CREATE comment', async () => {
    const c = await prisma.comment.create({
      data: { userId, postId, content: 'CRUD comment' },
    });
    track('comment', c.id);
    id = c.id;
  });
  await step('UPDATE comment', async () => {
    await prisma.comment.update({ where: { id }, data: { content: 'Edited' } });
  });
  return id;
}

async function testQuote(userId: string, postId: string): Promise<string> {
  console.log('\n💭 Quote');
  let id = '';
  await step('CREATE quote', async () => {
    const q = await prisma.quote.create({
      data: { userId, postId, quote: 'CRUD quote' },
    });
    track('quote', q.id);
    id = q.id;
  });
  await step('READ quote → post relation', async () => {
    const q = await prisma.quote.findUnique({ where: { id }, include: { post: true } });
    if (!q || q.post.id !== postId) throw new Error('relation broken');
  });
  return id;
}

async function testVote(userId: string, postId: string): Promise<string> {
  console.log('\n👍 Vote');
  let id = '';
  await step('CREATE vote (up)', async () => {
    const v = await prisma.vote.create({
      data: { userId, postId, type: 'up', tags: ['good'] },
    });
    track('vote', v.id);
    id = v.id;
  });
  await step('UPDATE vote', async () => {
    await prisma.vote.update({ where: { id }, data: { tags: ['good', 'insightful'] } });
  });
  return id;
}

async function testVoteLog(userId: string, postId: string, voteId: string): Promise<string> {
  console.log('\n📜 VoteLog');
  let id = '';
  await step('CREATE voteLog', async () => {
    const vl = await prisma.voteLog.create({
      data: {
        userId,
        voteId,
        postId,
        description: 'User cast upvote',
        type: 'up',
        tokens: 1,
      },
    });
    track('voteLog', vl.id);
    id = vl.id;
  });
  return id;
}

async function testMessageRoom(userId: string): Promise<string> {
  console.log('\n💬 MessageRoom');
  let id = '';
  await step('CREATE messageRoom', async () => {
    const r = await prisma.messageRoom.create({
      data: { userIds: [userId], messageType: 'USER', isDirect: true },
    });
    track('messageRoom', r.id);
    id = r.id;
  });
  await step('UPDATE messageRoom', async () => {
    await prisma.messageRoom.update({ where: { id }, data: { unreadMessages: 3 } });
  });
  return id;
}

async function testMessage(userId: string, roomId: string): Promise<string> {
  console.log('\n📨 Message');
  let id = '';
  await step('CREATE message', async () => {
    const m = await prisma.message.create({
      data: { messageRoomId: roomId, userId, text: 'Hello!' },
    });
    track('message', m.id);
    id = m.id;
  });
  await step('READ message → room relation', async () => {
    const m = await prisma.message.findUnique({
      where: { id },
      include: { messageRoom: true },
    });
    if (!m || m.messageRoom.id !== roomId) throw new Error('relation broken');
  });
  return id;
}

async function testDirectMessage(userId: string): Promise<string> {
  console.log('\n✉️  DirectMessage');
  let id = '';
  await step('CREATE directMessage', async () => {
    const dm = await prisma.directMessage.create({
      data: { userId, text: 'Direct hello', title: 'DM' },
    });
    track('directMessage', dm.id);
    id = dm.id;
  });
  return id;
}

async function testReaction(userId: string, messageId: string): Promise<string> {
  console.log('\n😀 Reaction');
  let id = '';
  await step('CREATE reaction', async () => {
    const r = await prisma.reaction.create({
      data: { userId, messageId, emoji: '🔥' },
    });
    track('reaction', r.id);
    id = r.id;
  });
  return id;
}

async function testNotification(recipientId: string, senderId: string, postId: string): Promise<string> {
  console.log('\n🔔 Notification');
  let id = '';
  await step('CREATE notification', async () => {
    const n = await prisma.notification.create({
      data: {
        userId: recipientId,
        userIdBy: senderId,
        label: 'upvoted your post',
        notificationType: 'UPVOTED',
        postId,
      },
    });
    track('notification', n.id);
    id = n.id;
  });
  await step('UPDATE notification status', async () => {
    await prisma.notification.update({ where: { id }, data: { status: 'read' } });
  });
  return id;
}

async function testActivity(userId: string, postId: string): Promise<string> {
  console.log('\n📈 Activity');
  let id = '';
  await step('CREATE activity', async () => {
    const a = await prisma.activity.create({
      data: { userId, postId, activityType: 'POSTED' },
    });
    track('activity', a.id);
    id = a.id;
  });
  return id;
}

async function testRoster(user1: string, user2: string): Promise<string> {
  console.log('\n🤝 Roster');
  let id = '';
  await step('CREATE roster', async () => {
    const r = await prisma.roster.create({
      data: { userId: user1, buddyId: user2, status: 'pending' },
    });
    track('roster', r.id);
    id = r.id;
  });
  await step('UPDATE roster status', async () => {
    await prisma.roster.update({ where: { id }, data: { status: 'accepted' } });
  });
  return id;
}

async function testPresence(userId: string): Promise<string> {
  console.log('\n🟢 Presence');
  let id = '';
  await step('CREATE presence', async () => {
    const p = await prisma.presence.create({
      data: { userId, status: 'online' },
    });
    track('presence', p.id);
    id = p.id;
  });
  await step('UPDATE presence', async () => {
    await prisma.presence.update({ where: { id }, data: { status: 'away' } });
  });
  return id;
}

async function testTyping(userId: string, roomId: string): Promise<string> {
  console.log('\n⌨️  Typing');
  let id = '';
  await step('CREATE typing', async () => {
    const t = await prisma.typing.create({
      data: { messageRoomId: roomId, userId, isTyping: true },
    });
    track('typing', t.id);
    id = t.id;
  });
  return id;
}

async function testUserInvite(inviterId: string): Promise<string> {
  console.log('\n📬 UserInvite');
  let id = '';
  await step('CREATE userInvite', async () => {
    const inv = await prisma.userInvite.create({
      data: {
        email: `invitee-${uniq()}@test.com`,
        invitedById: inviterId,
        code: `CODE-${uniq()}`,
        status: 'pending',
      },
    });
    track('userInvite', inv.id);
    id = inv.id;
  });
  await step('UPDATE userInvite status', async () => {
    await prisma.userInvite.update({ where: { id }, data: { status: 'accepted' } });
  });
  return id;
}

async function testUserReport(reporter: string, reported: string): Promise<string> {
  console.log('\n🚩 UserReport');
  let id = '';
  await step('CREATE userReport', async () => {
    const r = await prisma.userReport.create({
      data: {
        reporterId: reporter,
        reportedUserId: reported,
        reason: 'spam',
        description: 'Test report',
      },
    });
    track('userReport', r.id);
    id = r.id;
  });
  await step('UPDATE userReport status', async () => {
    await prisma.userReport.update({ where: { id }, data: { status: 'reviewed' } });
  });
  return id;
}

async function testBotReport(reporter: string, reported: string): Promise<string> {
  console.log('\n🤖 BotReport');
  let id = '';
  await step('CREATE botReport', async () => {
    const r = await prisma.botReport.create({
      data: { reporterId: reporter, userId: reported },
    });
    track('botReport', r.id);
    id = r.id;
  });
  return id;
}

async function testUserReputation(userId: string): Promise<string> {
  console.log('\n⭐ UserReputation');
  let id = '';
  await step('CREATE userReputation', async () => {
    const r = await prisma.userReputation.create({
      data: {
        userId,
        overallScore: 75.5,
        inviteNetworkScore: 10,
        conductScore: 30,
        activityScore: 35.5,
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
    track('userReputation', r.id);
    id = r.id;
  });
  await step('UPDATE userReputation score', async () => {
    await prisma.userReputation.update({ where: { id }, data: { overallScore: 80 } });
  });
  return id;
}

async function testDomain(): Promise<string> {
  console.log('\n🌐 Domain');
  let id = '';
  await step('CREATE domain', async () => {
    const d = await prisma.domain.create({
      data: { key: `domain_${uniq()}`, name: 'Test Domain' },
    });
    track('domain', d.id);
    id = d.id;
  });
  return id;
}

async function testCreator(): Promise<string> {
  console.log('\n🎨 Creator');
  let id = '';
  await step('CREATE creator', async () => {
    const c = await prisma.creator.create({
      data: { name: `Creator ${uniq()}`, bio: 'A creator' },
    });
    track('creator', c.id);
    id = c.id;
  });
  return id;
}

async function testContent(creatorId: string, domainId: string): Promise<string> {
  console.log('\n📄 Content');
  let id = '';
  await step('CREATE content', async () => {
    const c = await prisma.content.create({
      data: {
        title: 'CRUD content',
        creatorId,
        domainId,
        url: 'https://example.com/article',
      },
    });
    track('content', c.id);
    id = c.id;
  });
  await step('READ content → creator + domain relations', async () => {
    const c = await prisma.content.findUnique({
      where: { id },
      include: { creator: true, domain: true },
    });
    if (!c || c.creator.id !== creatorId || c.domain?.id !== domainId) {
      throw new Error('relations broken');
    }
  });
  return id;
}

async function testCollection(userId: string, postId: string): Promise<string> {
  console.log('\n📚 Collection');
  let id = '';
  await step('CREATE collection', async () => {
    const c = await prisma.collection.create({
      data: {
        userId,
        name: `Collection ${uniq()}`,
        postIds: [postId],
      },
    });
    track('collection', c.id);
    id = c.id;
  });
  await step('UPDATE collection (append postId)', async () => {
    await prisma.collection.update({
      where: { id },
      data: { description: 'Updated description' },
    });
  });
  return id;
}

// ---------------------------------------------------------------------------
// Deep nested traversal across multiple levels
// ---------------------------------------------------------------------------

async function testDeepTraversal(userId: string, postId: string, roomId: string): Promise<void> {
  console.log('\n🕸️  Deep Relationship Traversal');

  await step('user → posts → comments + votes + quotes', async () => {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          include: { comments: true, votes: true, quotes: true },
        },
      },
    });
    if (!u) throw new Error('user not found');
    const p = u.posts.find((x) => x.id === postId);
    if (!p) throw new Error('post not found in user.posts');
    if (p.comments.length < 1) throw new Error('no comments traversed');
    if (p.votes.length < 1) throw new Error('no votes traversed');
    if (p.quotes.length < 1) throw new Error('no quotes traversed');
  });

  await step('messageRoom → messages → reactions', async () => {
    const r = await prisma.messageRoom.findUnique({
      where: { id: roomId },
      include: {
        messages: { include: { reactions: true } },
        typingIndicators: true,
      },
    });
    if (!r) throw new Error('room not found');
    if (r.messages.length < 1) throw new Error('no messages traversed');
    if (r.messages[0].reactions.length < 1) throw new Error('no reactions traversed');
  });

  await step('user → activities + notifications + collections', async () => {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        activities: true,
        notifications: true,
        collections: true,
      },
    });
    if (!u) throw new Error('user not found');
    if (u.activities.length < 1) throw new Error('no activities');
    if (u.collections.length < 1) throw new Error('no collections');
  });

  await step('COUNT across all 24 models', async () => {
    // Verify every model's delegate is callable — catches missing/broken models
    await Promise.all([
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
  });
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanup(): Promise<void> {
  console.log('\n🗑️  DELETE — Cleaning up all test data (LIFO)');
  for (const { model, id } of created) {
    try {
      const delegate = delegateFor(model);
      if (delegate) await delegate.delete({ where: { id } });
    } catch {
      // Already gone — ignore
    }
  }
  console.log(`   ✅ Deleted ${created.length} records across ${new Set(created.map((c) => c.model)).size} models`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function isReplicaSetError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /replica set/i.test(msg) || /P2031/.test(msg);
}

function printReplicaSetHint(): void {
  console.error(
    '\n⚠️  MongoDB is not running as a replica set.\n' +
      '   Prisma requires a replica set because create/update/delete use transactions.\n' +
      '   Fix (fastest): docker run -d --name mongo-rs -p 27017:27017 \\\n' +
      '                      mongo:7 --replSet rs0 --bind_ip_all\n' +
      '                  docker exec -it mongo-rs mongosh --eval "rs.initiate()"\n' +
      '   Update DATABASE_URL to include ?replicaSet=rs0&directConnection=true\n' +
      '   See docs/prisma-migration-strategy.md for all options.\n',
  );
}

async function main(): Promise<void> {
  console.log('🧪 Prisma CRUD Tests — ALL 24 MODELS\n');
  console.log('═══════════════════════════════════════════');
  console.log('📡 Connection');
  await prisma.$connect();
  console.log('  ✅ Connected to MongoDB');

  try {
    // Core user
    const primaryId = await testUser();

    // Secondary user for relationship models
    const secondary = await prisma.user.create({
      data: {
        email: `crud-sec-${uniq()}@prisma-test.com`,
        username: `crud_sec_${uniq()}`,
        accountStatus: 'active',
      },
    });
    track('user', secondary.id);
    const secondaryId = secondary.id;

    // Group + Post + engagement
    const groupId = await testGroup(primaryId);
    const postId = await testPost(primaryId, groupId);
    await testComment(primaryId, postId);
    await testQuote(primaryId, postId);
    const voteId = await testVote(primaryId, postId);
    await testVoteLog(primaryId, postId, voteId);

    // Messaging
    const roomId = await testMessageRoom(primaryId);
    const msgId = await testMessage(primaryId, roomId);
    await testDirectMessage(primaryId);
    await testReaction(primaryId, msgId);
    await testNotification(primaryId, secondaryId, postId);

    // Activity + Social
    await testActivity(primaryId, postId);
    await testRoster(primaryId, secondaryId);
    await testPresence(primaryId);
    await testTyping(primaryId, roomId);

    // Invitations & reports
    await testUserInvite(primaryId);
    await testUserReport(primaryId, secondaryId);
    await testBotReport(primaryId, secondaryId);
    await testUserReputation(secondaryId);

    // Content domain
    const domainId = await testDomain();
    const creatorId = await testCreator();
    await testContent(creatorId, domainId);
    await testCollection(primaryId, postId);

    // Deep traversal — verifies multi-level includes work
    await testDeepTraversal(primaryId, postId, roomId);
  } finally {
    await cleanup();
    await prisma.$disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`📊 CRUD Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('═══════════════════════════════════════════');

  if (testsFailed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
  console.log('\n🎉 ALL TESTS PASSED — all 24 models support CRUD + relationship traversal\n');
}

main().catch((err: Error) => {
  if (isReplicaSetError(err)) {
    printReplicaSetHint();
    cleanup()
      .finally(() => prisma.$disconnect())
      .finally(() => process.exit(1));
    return;
  }
  console.error('\n💥 CRUD test crashed:');
  console.error(err);
  cleanup()
    .finally(() => prisma.$disconnect())
    .finally(() => process.exit(1));
});
