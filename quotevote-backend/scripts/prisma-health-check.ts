/// <reference types="node" />
/**
 * Prisma Connection Health Check
 * Tests that Prisma Client can connect to MongoDB
 *
 * Usage: pnpm prisma:health
 */

import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('🔌 Initializing Prisma Client...');

  const prisma = new PrismaClient();

  try {
    console.log('📡 Connecting to MongoDB...');

    // Test connection by running a simple query
    await prisma.$connect();
    console.log('✅ Connected to MongoDB successfully!');

    // Try to count users as a simple health check
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in the database.`);

    // List available models
    console.log('\n📋 Available Prisma Models:');
    const models = [
      'User',
      'Post',
      'Comment',
      'Vote',
      'VoteLog',
      'Quote',
      'Reaction',
      'Message',
      'DirectMessage',
      'MessageRoom',
      'Notification',
      'Activity',
      'Group',
      'Roster',
      'Presence',
      'Typing',
      'UserInvite',
      'UserReport',
      'BotReport',
      'UserReputation',
      'Domain',
      'Creator',
      'Content',
      'Collection',
    ];
    models.forEach((model) => console.log(`  • ${model}`));

    console.log('\n🎉 Prisma Client is working correctly!');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

main();
