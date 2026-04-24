/// <reference types="node" />
/**
 * Prisma ↔ Mongoose Parity Check
 *
 * Verifies that Prisma and Mongoose read/write the same MongoDB collections
 * correctly, with field-name mappings (@map) surfacing as expected on both sides.
 *
 * Critical mapped fields verified:
 *   User:         admin ↔ isAdmin
 *                 _followingId ↔ followingIds
 *                 _followersId ↔ followersIds
 *                 _wallet ↔ wallet
 *   Post:         enable_voting ↔ enableVoting
 *   MessageRoom:  users ↔ userIds
 *
 * For each model, runs two round-trips:
 *   1. Mongoose writes → Prisma reads (verify mapped fields surface on Prisma side)
 *   2. Prisma writes → Mongoose reads (verify raw MongoDB field names are correct)
 *
 * Requires a live MongoDB instance with DATABASE_URL and MONGO_URI set in .env.
 * Exits 0 on success, 1 on any mismatch.
 *
 * Usage: pnpm prisma:parity
 */

import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { config } from 'dotenv';

import User from '../app/data/models/User';
import Post from '../app/data/models/Post';
import MessageRoom from '../app/data/models/MessageRoom';
import Group from '../app/data/models/Group';

config();

const prisma = new PrismaClient();

interface ParityResult {
  model: string;
  direction: 'Mongoose → Prisma' | 'Prisma → Mongoose';
  field: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
}

const results: ParityResult[] = [];

// Track created docs for cleanup (LIFO)
interface CreatedDoc {
  kind: 'mongoose' | 'prisma';
  model: string;
  id: string;
}

const created: CreatedDoc[] = [];

function record(result: ParityResult): void {
  results.push(result);
  const icon = result.passed ? '✅' : '❌';
  const summary = `${icon} [${result.model}] ${result.direction} — ${result.field}`;
  if (result.passed) {
    console.log(`  ${summary}`);
  } else {
    console.log(`  ${summary}`);
    console.log(`     expected: ${JSON.stringify(result.expected)}`);
    console.log(`     actual:   ${JSON.stringify(result.actual)}`);
  }
}

function assertEqual(
  model: string,
  direction: ParityResult['direction'],
  field: string,
  expected: unknown,
  actual: unknown,
): void {
  const passed = JSON.stringify(expected) === JSON.stringify(actual);
  record({ model, direction, field, expected, actual, passed });
}

// ---------------------------------------------------------------------------
// User parity
// ---------------------------------------------------------------------------

async function checkUser(suffix: string): Promise<void> {
  console.log('\n👤 User model parity');

  const followeeId1 = new mongoose.Types.ObjectId();
  const followeeId2 = new mongoose.Types.ObjectId();

  // --- Mongoose → Prisma
  const mongooseUser = await User.create({
    email: `mongoose-${suffix}@parity.test`,
    username: `mongoose_${suffix}`,
    password: 'not-a-real-password',
    admin: true,
    _followingId: [followeeId1, followeeId2],
    _followersId: [followeeId1],
    _wallet: 'wallet-abc-123',
    upvotes: 7,
  });
  created.push({ kind: 'mongoose', model: 'User', id: String(mongooseUser._id) });

  const prismaView = await prisma.user.findUnique({
    where: { id: String(mongooseUser._id) },
  });

  if (!prismaView) {
    throw new Error(`Prisma could not find user ${mongooseUser._id} created via Mongoose`);
  }

  assertEqual('User', 'Mongoose → Prisma', 'admin → isAdmin', true, prismaView.isAdmin);
  assertEqual(
    'User',
    'Mongoose → Prisma',
    '_followingId → followingIds',
    [String(followeeId1), String(followeeId2)],
    prismaView.followingIds,
  );
  assertEqual(
    'User',
    'Mongoose → Prisma',
    '_followersId → followerIds',
    [String(followeeId1)],
    prismaView.followerIds,
  );
  assertEqual('User', 'Mongoose → Prisma', '_wallet → wallet', 'wallet-abc-123', prismaView.wallet);
  assertEqual('User', 'Mongoose → Prisma', 'upvotes', 7, prismaView.upvotes);

  // --- Prisma → Mongoose
  const prismaUser = await prisma.user.create({
    data: {
      email: `prisma-${suffix}@parity.test`,
      username: `prisma_${suffix}`,
      password: 'not-a-real-password',
      isAdmin: true,
      followingIds: [String(followeeId1)],
      followerIds: [String(followeeId2)],
      wallet: 'wallet-xyz-789',
      downvotes: 3,
    },
  });
  created.push({ kind: 'prisma', model: 'user', id: prismaUser.id });

  const mongooseView = await User.findById(prismaUser.id).lean();
  if (!mongooseView) {
    throw new Error(`Mongoose could not find user ${prismaUser.id} created via Prisma`);
  }

  // Mongoose .lean() returns plain object; its shape matches the raw MongoDB doc
  const raw = mongooseView as unknown as {
    admin?: boolean;
    _followingId?: mongoose.Types.ObjectId[];
    _followersId?: mongoose.Types.ObjectId[];
    _wallet?: string;
    downvotes?: number;
  };

  assertEqual('User', 'Prisma → Mongoose', 'isAdmin → admin', true, raw.admin);
  assertEqual(
    'User',
    'Prisma → Mongoose',
    'followingIds → _followingId',
    [String(followeeId1)],
    (raw._followingId ?? []).map(String),
  );
  assertEqual(
    'User',
    'Prisma → Mongoose',
    'followerIds → _followersId',
    [String(followeeId2)],
    (raw._followersId ?? []).map(String),
  );
  assertEqual('User', 'Prisma → Mongoose', 'wallet → _wallet', 'wallet-xyz-789', raw._wallet);
  assertEqual('User', 'Prisma → Mongoose', 'downvotes', 3, raw.downvotes);
}

// ---------------------------------------------------------------------------
// Post parity (requires a User and Group)
// ---------------------------------------------------------------------------

async function checkPost(suffix: string): Promise<void> {
  console.log('\n📝 Post model parity');

  // Create prerequisite user and group via Mongoose
  const user = await User.create({
    email: `post-owner-${suffix}@parity.test`,
    username: `post_owner_${suffix}`,
    password: 'not-a-real-password',
  });
  created.push({ kind: 'mongoose', model: 'User', id: String(user._id) });

  const group = await Group.create({
    creatorId: user._id,
    title: `Parity group ${suffix}`,
    privacy: 'public',
  });
  created.push({ kind: 'mongoose', model: 'Group', id: String(group._id) });

  // --- Mongoose → Prisma
  const mongoosePost = await Post.create({
    userId: user._id,
    groupId: group._id,
    title: 'Mongoose post',
    text: 'Body',
    enable_voting: true,
  });
  created.push({ kind: 'mongoose', model: 'Post', id: String(mongoosePost._id) });

  const prismaPostView = await prisma.post.findUnique({
    where: { id: String(mongoosePost._id) },
  });
  if (!prismaPostView) {
    throw new Error(`Prisma could not find post ${mongoosePost._id} created via Mongoose`);
  }

  assertEqual(
    'Post',
    'Mongoose → Prisma',
    'enable_voting → enableVoting',
    true,
    prismaPostView.enableVoting,
  );

  // --- Prisma → Mongoose
  const prismaPost = await prisma.post.create({
    data: {
      userId: String(user._id),
      groupId: String(group._id),
      title: 'Prisma post',
      text: 'Body',
      enableVoting: true,
    },
  });
  created.push({ kind: 'prisma', model: 'post', id: prismaPost.id });

  const rawMongoosePost = (await Post.findById(prismaPost.id).lean()) as unknown as {
    enable_voting?: boolean;
  } | null;
  if (!rawMongoosePost) {
    throw new Error(`Mongoose could not find post ${prismaPost.id} created via Prisma`);
  }

  assertEqual(
    'Post',
    'Prisma → Mongoose',
    'enableVoting → enable_voting',
    true,
    rawMongoosePost.enable_voting,
  );
}

// ---------------------------------------------------------------------------
// MessageRoom parity
// ---------------------------------------------------------------------------

async function checkMessageRoom(): Promise<void> {
  console.log('\n💬 MessageRoom model parity');

  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  // --- Mongoose → Prisma
  const mongooseRoom = await MessageRoom.create({
    users: [userA, userB],
    messageType: 'USER',
    isDirect: true,
  });
  created.push({ kind: 'mongoose', model: 'MessageRoom', id: String(mongooseRoom._id) });

  const prismaRoomView = await prisma.messageRoom.findUnique({
    where: { id: String(mongooseRoom._id) },
  });
  if (!prismaRoomView) {
    throw new Error(`Prisma could not find MessageRoom ${mongooseRoom._id} created via Mongoose`);
  }

  assertEqual(
    'MessageRoom',
    'Mongoose → Prisma',
    'users → userIds',
    [String(userA), String(userB)],
    prismaRoomView.userIds,
  );

  // --- Prisma → Mongoose
  const prismaRoom = await prisma.messageRoom.create({
    data: {
      userIds: [String(userA)],
      messageType: 'USER',
      isDirect: true,
    },
  });
  created.push({ kind: 'prisma', model: 'messageRoom', id: prismaRoom.id });

  const rawMongooseRoom = (await MessageRoom.findById(prismaRoom.id).lean()) as unknown as {
    users?: mongoose.Types.ObjectId[];
  } | null;
  if (!rawMongooseRoom) {
    throw new Error(`Mongoose could not find MessageRoom ${prismaRoom.id} created via Prisma`);
  }

  assertEqual(
    'MessageRoom',
    'Prisma → Mongoose',
    'userIds → users',
    [String(userA)],
    (rawMongooseRoom.users ?? []).map(String),
  );
}

// ---------------------------------------------------------------------------
// Functional parity — compare Mongoose populate() vs Prisma include()
// Ensures the same logical query returns equivalent data shapes.
// ---------------------------------------------------------------------------

async function checkFunctionalParity(suffix: string): Promise<void> {
  console.log('\n🔗 Functional parity — Mongoose populate vs Prisma include');

  // 1. Seed via Mongoose: user + group + post + 2 comments
  const author = await User.create({
    email: `func-author-${suffix}@parity.test`,
    username: `func_author_${suffix}`,
    password: 'not-a-real-password',
  });
  created.push({ kind: 'mongoose', model: 'User', id: String(author._id) });

  const group = await Group.create({
    creatorId: author._id,
    title: `Func group ${suffix}`,
    privacy: 'public',
  });
  created.push({ kind: 'mongoose', model: 'Group', id: String(group._id) });

  const post = await Post.create({
    userId: author._id,
    groupId: group._id,
    title: 'Functional parity post',
    text: 'Body',
  });
  created.push({ kind: 'mongoose', model: 'Post', id: String(post._id) });

  // 2. Read the same document via both ORMs — verify the fields visible
  //    through Mongoose's populate() match the fields returned by Prisma's
  //    include(). We cast minimally to avoid depending on internal
  //    Mongoose populate typings.
  interface PopulatedPost {
    _id: mongoose.Types.ObjectId;
    title: string;
    userId: { _id: mongoose.Types.ObjectId; username?: string } | null;
  }

  const mongoosePostDoc = (await Post.findById(post._id)
    .populate('userId', 'username')
    .lean()) as unknown as PopulatedPost | null;

  const prismaPost = await prisma.post.findUnique({
    where: { id: String(post._id) },
    include: { user: { select: { id: true, username: true } } },
  });

  if (!mongoosePostDoc || !prismaPost) {
    throw new Error('Functional parity: post not found in one of the ORMs');
  }

  assertEqual(
    'FunctionalParity',
    'Mongoose → Prisma',
    'post.title matches',
    mongoosePostDoc.title,
    prismaPost.title,
  );

  assertEqual(
    'FunctionalParity',
    'Mongoose → Prisma',
    'populate(userId).username === include(user).username',
    mongoosePostDoc.userId?.username,
    prismaPost.user.username,
  );

  assertEqual(
    'FunctionalParity',
    'Mongoose → Prisma',
    'populated author id matches included user id',
    String(mongoosePostDoc.userId?._id),
    prismaPost.user.id,
  );

  // 3. Verify count parity for the posts collection
  const mongooseCount = await Post.countDocuments({ userId: author._id });
  const prismaCount = await prisma.post.count({ where: { userId: String(author._id) } });

  assertEqual(
    'FunctionalParity',
    'Mongoose → Prisma',
    'countDocuments === prisma.count',
    mongooseCount,
    prismaCount,
  );
}

// ---------------------------------------------------------------------------
// Cleanup (LIFO)
// ---------------------------------------------------------------------------

type PrismaDelegate = {
  delete: (args: { where: { id: string } }) => Promise<unknown>;
};

type PrismaModelKey = 'user' | 'post' | 'messageRoom';

function getPrismaDelegate(key: string): PrismaDelegate | null {
  const map: Record<PrismaModelKey, PrismaDelegate> = {
    user: prisma.user,
    post: prisma.post,
    messageRoom: prisma.messageRoom,
  };
  return map[key as PrismaModelKey] ?? null;
}

type MongooseModelKey = 'User' | 'Post' | 'MessageRoom' | 'Group';

type MongooseModel = { deleteOne: (filter: { _id: string }) => { exec: () => Promise<unknown> } };

function getMongooseModel(name: string): MongooseModel | null {
  const map: Record<MongooseModelKey, MongooseModel> = {
    User,
    Post,
    MessageRoom,
    Group,
  };
  return map[name as MongooseModelKey] ?? null;
}

async function cleanup(): Promise<void> {
  console.log('\n🧹 Cleaning up test documents...');
  for (let i = created.length - 1; i >= 0; i -= 1) {
    const { kind, model, id } = created[i];
    try {
      if (kind === 'prisma') {
        const delegate = getPrismaDelegate(model);
        if (delegate) await delegate.delete({ where: { id } });
      } else {
        const mongooseModel = getMongooseModel(model);
        if (mongooseModel) await mongooseModel.deleteOne({ _id: id }).exec();
      }
    } catch (err) {
      console.log(`  ⚠️  Cleanup failed for ${kind}/${model}/${id}: ${(err as Error).message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const mongoUri = process.env.MONGO_URI ?? process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error('❌ MONGO_URI or DATABASE_URL must be set in .env');
    process.exit(1);
  }

  console.log('🔍 Prisma ↔ Mongoose Parity Check\n');
  console.log('📡 Connecting...');

  await mongoose.connect(mongoUri);
  await prisma.$connect();
  console.log('✅ Connected to MongoDB (both Mongoose and Prisma)');

  const suffix = `${Date.now()}`;

  try {
    await checkUser(suffix);
    await checkPost(suffix);
    await checkMessageRoom();
    await checkFunctionalParity(suffix);
  } finally {
    await cleanup();
    await prisma.$disconnect();
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }

  // Report
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n═══════════════════════════════════════════');
  console.log(`📊 Parity Check Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════');

  if (failed > 0) {
    console.log('\n❌ FAILED — Prisma and Mongoose are not in sync');
    process.exit(1);
  }

  console.log('\n🎉 PASSED — Prisma and Mongoose are fully aligned');
}

function isReplicaSetError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /replica set/i.test(msg) || /P2031/.test(msg);
}

main().catch((err: Error) => {
  if (isReplicaSetError(err)) {
    console.error(
      '\n⚠️  MongoDB is not running as a replica set.\n' +
        '   Prisma requires a replica set because create/update/delete use transactions.\n' +
        '   Fix (fastest): docker run -d --name mongo-rs -p 27017:27017 \\\n' +
        '                      mongo:7 --replSet rs0 --bind_ip_all\n' +
        '                  docker exec -it mongo-rs mongosh --eval "rs.initiate()"\n' +
        '   Update DATABASE_URL to include ?replicaSet=rs0&directConnection=true\n' +
        '   See docs/prisma-migration-strategy.md for all options.\n',
    );
    process.exit(1);
  }
  console.error('\n💥 Parity check crashed:');
  console.error(err);
  process.exit(1);
});
