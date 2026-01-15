/// <reference types="node" />
/**
 * Prisma CRUD Test Script
 * Tests Create, Read, Update, Delete operations with Prisma Client
 *
 * Usage: pnpm prisma:test
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting Prisma CRUD Tests...\n');

  try {
    // ============================================
    // Test 1: Connection
    // ============================================
    console.log('📡 Test 1: Database Connection');
    await prisma.$connect();
    console.log('   ✅ Connected to MongoDB successfully!\n');

    // ============================================
    // Test 2: CREATE - Create a test user
    // ============================================
    console.log('📝 Test 2: CREATE - Creating a test user');
    const testEmail = `test-${Date.now()}@prisma-test.com`;
    const testUsername = `testuser_${Date.now()}`;

    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        username: testUsername,
        name: 'Prisma Test User',
        accountStatus: 'active',
        emailVerified: false,
        isAdmin: false,
        isModerator: false,
        upvotes: 0,
        downvotes: 0,
        botReports: 0,
      },
    });
    console.log(`   ✅ Created user: ${newUser.username} (ID: ${newUser.id})\n`);

    // ============================================
    // Test 3: READ - Query the created user
    // ============================================
    console.log('🔍 Test 3: READ - Querying the user');
    const foundUser = await prisma.user.findUnique({
      where: { id: newUser.id },
    });

    if (foundUser && foundUser.email === testEmail) {
      console.log(`   ✅ Found user: ${foundUser.email}\n`);
    } else {
      throw new Error('User not found or email mismatch');
    }

    // ============================================
    // Test 4: UPDATE - Update the user
    // ============================================
    console.log('✏️  Test 4: UPDATE - Updating the user');
    const updatedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        name: 'Updated Prisma Test User',
        emailVerified: true,
        upvotes: 10,
      },
    });

    if (updatedUser.name === 'Updated Prisma Test User' && updatedUser.emailVerified === true) {
      console.log(`   ✅ Updated user name to: ${updatedUser.name}\n`);
    } else {
      throw new Error('Update failed');
    }

    // ============================================
    // Test 5: CREATE related - Create a post for the user
    // ============================================
    console.log('📝 Test 5: CREATE - Creating a post for the user');
    
    // First create a group for the post (required relation)
    const testGroup = await prisma.group.create({
      data: {
        creatorId: newUser.id,
        title: 'Test Group',
        privacy: 'public',
      },
    });
    
    const newPost = await prisma.post.create({
      data: {
        user: { connect: { id: newUser.id } },
        group: { connect: { id: testGroup.id } },
        title: 'Test Post from Prisma',
        text: 'This is a test post created by the Prisma CRUD test script.',
        upvotes: 0,
        downvotes: 0,
        enableVoting: false,
        deleted: false,
      },
    });
    console.log(`   ✅ Created post: "${newPost.title}" (ID: ${newPost.id})\n`);

    // ============================================
    // Test 6: READ with relations - Query user with posts
    // ============================================
    console.log('🔍 Test 6: READ - Querying user with posts (relations)');
    const userWithPosts = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: { posts: true },
    });

    if (userWithPosts && userWithPosts.posts.length > 0) {
      console.log(`   ✅ User has ${userWithPosts.posts.length} post(s)\n`);
    } else {
      throw new Error('Posts relation not working');
    }

    // ============================================
    // Test 7: COUNT - Count all users
    // ============================================
    console.log('📊 Test 7: COUNT - Counting users');
    const userCount = await prisma.user.count();
    console.log(`   ✅ Total users in database: ${userCount}\n`);

    // ============================================
    // Test 8: DELETE - Clean up test data
    // ============================================
    console.log('🗑️  Test 8: DELETE - Cleaning up test data');

    // Delete the post first (due to relation)
    await prisma.post.delete({
      where: { id: newPost.id },
    });
    console.log('   ✅ Deleted test post');

    // Delete the group
    await prisma.group.delete({
      where: { id: testGroup.id },
    });
    console.log('   ✅ Deleted test group');

    // Delete the user
    await prisma.user.delete({
      where: { id: newUser.id },
    });
    console.log('   ✅ Deleted test user\n');

    // ============================================
    // Summary
    // ============================================
    console.log('═══════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Connection: OK');
    console.log('✅ CREATE: OK');
    console.log('✅ READ: OK');
    console.log('✅ UPDATE: OK');
    console.log('✅ Relations: OK');
    console.log('✅ COUNT: OK');
    console.log('✅ DELETE: OK');
    console.log('═══════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

main();
