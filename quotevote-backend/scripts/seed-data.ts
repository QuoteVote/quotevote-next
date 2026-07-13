import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../app/data/models/User';
import Post from '../app/data/models/Post';

dotenv.config();

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quotevote';

  // ponytail: safety guard — refuse to wipe non-local databases
  const parsed = new URL(MONGO_URI);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error(
      `SEED ABORTED: Refusing to run against non-local database "${parsed.hostname}". ` +
      'This script calls deleteMany({}) and will wipe all data.'
    );
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing users and posts
  await User.deleteMany({});
  await Post.deleteMany({});
  console.log('Cleared existing collections');

  // Create Users
  const alice = await User.create({
    name: 'Alice Cooper',
    username: 'alice',
    email: 'alice@quote.vote',
    password: 'securepassword123',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alice',
  });

  const bob = await User.create({
    name: 'Bob Marley',
    username: 'bob',
    email: 'bob@quote.vote',
    password: 'securepassword123',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=bob',
  });

  const charlie = await User.create({
    name: 'Charlie Chaplin',
    username: 'charlie',
    email: 'charlie@quote.vote',
    password: 'securepassword123',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=charlie',
  });

  console.log('Created Alice, Bob, and Charlie');

  const dummyGroupId = new mongoose.Types.ObjectId();

  // Create Posts
  await Post.create([
    {
      userId: alice._id,
      groupId: dummyGroupId,
      title: 'Building modern interfaces',
      text: 'I really love building user interfaces using #react! The component model is incredibly elegant.',
      enable_voting: true,
      created: new Date(),
    },
    {
      userId: bob._id,
      groupId: dummyGroupId,
      title: 'State of Next.js in 2026',
      text: 'Next.js App Router combined with #nextjs and #typescript gives a fantastic DX (developer experience). highly recommend it.',
      enable_voting: true,
      created: new Date(),
    },
    {
      userId: charlie._id,
      groupId: dummyGroupId,
      title: 'Decentralized Voting',
      text: 'Exploring #web3 decentralized curation patterns in #react applications. Exciting times ahead!',
      enable_voting: true,
      created: new Date(),
    },
    {
      userId: alice._id,
      groupId: dummyGroupId,
      title: 'TypeScript Advanced Types tips',
      text: 'Deep dive into #typescript advanced types: conditional types, mapped types, and template literal types.',
      enable_voting: true,
      created: new Date(),
    }
  ]);

  console.log('Created seeded posts successfully');
  await mongoose.disconnect();
  console.log('Disconnected');
}

seed().catch(console.error);
