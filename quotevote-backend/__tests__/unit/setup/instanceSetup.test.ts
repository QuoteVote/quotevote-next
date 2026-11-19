jest.mock('~/data/utils/pubsub', () => ({
  pubsub: { publish: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('~/data/resolvers/tagResolver', () => ({
  tagResolver: { Mutation: { createTag: jest.fn() } },
}));

jest.mock('~/data/resolvers/postsResolver', () => ({
  postsResolver: { Mutation: { addPost: jest.fn() } },
}));

import bcrypt from 'bcryptjs';
import { postsResolver } from '~/data/resolvers/postsResolver';
import { tagResolver } from '~/data/resolvers/tagResolver';
import {
  createFirstAdmin,
  parseDemoContent,
  seedDemoContent,
  validateAdminInput,
} from '~/setup/instanceSetup';

const adminId = '60d5ec49ad414d7a8d5464a0';
const tagId = '60d5ec49ad414d7a8d5464b1';
const PASSWORD = 'a-long-enough-password';

const createTag = tagResolver.Mutation.createTag as jest.Mock;
const addPost = postsResolver.Mutation.addPost as jest.Mock;

function mockPrisma() {
  return {
    user: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: adminId }),
    },
    tag: { findFirst: jest.fn().mockResolvedValue(null) },
    post: { findFirst: jest.fn().mockResolvedValue(null) },
  };
}

const asPrisma = (p: ReturnType<typeof mockPrisma>) => p as never;

const input = { email: ' Admin@Example.org ', username: 'admin1', name: '', password: PASSWORD };

describe('instance setup: first administrator', () => {
  beforeEach(() => jest.clearAllMocks());

  it('trims the details, lowercases the email and falls back to the username for the name', () => {
    expect(validateAdminInput(input)).toEqual({
      email: 'admin@example.org',
      username: 'admin1',
      name: 'admin1',
      password: PASSWORD,
    });
  });

  it.each([
    [{ ...input, email: 'not-an-email' }, /valid email/],
    [{ ...input, username: 'a b' }, /Username/],
    [{ ...input, username: 'ab' }, /Username/],
    [{ ...input, password: 'short' }, /at least 12/],
  ])('refuses bad details before touching the database', async (bad, message) => {
    const prisma = mockPrisma();
    await expect(createFirstAdmin(asPrisma(prisma), bad)).rejects.toThrow(message);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates an active admin with a hashed password', async () => {
    const prisma = mockPrisma();
    await expect(createFirstAdmin(asPrisma(prisma), input)).resolves.toBe('created');

    const { data } = prisma.user.create.mock.calls[0][0];
    expect(data).toEqual(
      expect.objectContaining({
        email: 'admin@example.org',
        username: 'admin1',
        isAdmin: true,
        accountStatus: 'active',
        emailVerified: true,
      })
    );
    expect(data.password).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, data.password)).toBe(true);
  });

  it('leaves an existing admin as is when run again', async () => {
    const prisma = mockPrisma();
    prisma.user.findFirst.mockResolvedValue({ id: adminId, isAdmin: true, password: 'hash' });
    await expect(createFirstAdmin(asPrisma(prisma), input)).resolves.toBe('exists');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it.each([
    ['a member', { isAdmin: false, password: 'hash' }],
    ['an unfinished account', { isAdmin: false, password: null }],
    ['an admin without a password', { isAdmin: true, password: null }],
  ])('never overwrites or promotes %s with that username or email', async (_label, found) => {
    const prisma = mockPrisma();
    prisma.user.findFirst.mockResolvedValue({ id: adminId, ...found });
    await expect(createFirstAdmin(asPrisma(prisma), input)).rejects.toThrow(/Nothing was changed/);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe('instance setup: starting content', () => {
  beforeEach(() => jest.clearAllMocks());

  const content = {
    tags: [{ title: 'Public Policy', description: 'Policy questions.' }],
    posts: [{ tag: 'Public Policy', title: 'A first topic', text: 'Some text to discuss.' }],
  };

  it('reads a valid content file', () => {
    expect(parseDemoContent(content)).toEqual(content);
  });

  it.each([
    [[], /JSON object/],
    [{}, /no tags or posts/],
    [{ tags: [{ title: 'T' }] }, /tags\[0\]\.description/],
    [{ tags: content.tags, posts: [{ ...content.posts[0], tag: 'Other' }] }, /doesn't list/],
  ])('refuses a bad content file', (value, message) => {
    expect(() => parseDemoContent(value)).toThrow(message);
  });

  const adminRows = (prisma: ReturnType<typeof mockPrisma>) => {
    prisma.user.findMany.mockResolvedValue([
      { id: '60d5ec49ad414d7a8d546400', password: null, accountStatus: 'active' },
      { id: adminId, password: 'hash', accountStatus: 'active' },
    ]);
    prisma.user.findUnique.mockResolvedValue({
      id: adminId,
      email: 'admin@example.org',
      username: 'admin1',
      name: 'Admin',
      avatar: null,
      isAdmin: true,
      accountStatus: 'active',
    });
  };

  it('needs a finished admin account first', async () => {
    const prisma = mockPrisma();
    prisma.user.findMany.mockResolvedValue([
      { id: adminId, password: null, accountStatus: 'active' },
    ]);
    await expect(seedDemoContent(asPrisma(prisma), content, jest.fn())).rejects.toThrow(
      /admin step/
    );
    expect(createTag).not.toHaveBeenCalled();
  });

  it('creates tags and posts through the resolvers, as the first finished admin', async () => {
    const prisma = mockPrisma();
    adminRows(prisma);
    createTag.mockResolvedValue({ _id: tagId });
    addPost.mockResolvedValue({ _id: 'p1' });

    const result = await seedDemoContent(asPrisma(prisma), content, jest.fn());

    expect(result).toEqual({ tagsCreated: 1, tagsKept: 0, postsCreated: 1, postsKept: 0 });
    // The password is never loaded into the acting user.
    expect(prisma.user.findUnique.mock.calls[0][0].select).not.toHaveProperty('password');
    const [, tagArgs, context] = createTag.mock.calls[0];
    expect(tagArgs).toEqual({
      tag: {
        creatorId: adminId,
        title: 'Public Policy',
        description: 'Policy questions.',
        privacy: 'public',
      },
    });
    expect(context.userId).toBe(adminId);
    expect(context.user.admin).toBe(true);
    expect(addPost.mock.calls[0][1]).toEqual({
      post: { userId: adminId, tagId, title: 'A first topic', text: 'Some text to discuss.' },
    });
  });

  it('keeps tags and posts that already exist when run again', async () => {
    const prisma = mockPrisma();
    adminRows(prisma);
    prisma.tag.findFirst.mockResolvedValue({ id: tagId });
    prisma.post.findFirst.mockResolvedValue({ id: 'p1', deleted: false });

    const result = await seedDemoContent(asPrisma(prisma), content, jest.fn());

    expect(result).toEqual({ tagsCreated: 0, tagsKept: 1, postsCreated: 0, postsKept: 1 });
    expect(createTag).not.toHaveBeenCalled();
    expect(addPost).not.toHaveBeenCalled();
  });

  it('posts again when the earlier post with that title was deleted', async () => {
    const prisma = mockPrisma();
    adminRows(prisma);
    prisma.tag.findFirst.mockResolvedValue({ id: tagId });
    prisma.post.findFirst.mockResolvedValue({ id: 'p1', deleted: true });
    addPost.mockResolvedValue({ _id: 'p2' });

    const result = await seedDemoContent(asPrisma(prisma), content, jest.fn());

    expect(result.postsCreated).toBe(1);
    expect(addPost.mock.calls[0][1].post.tagId).toBe(tagId);
  });
});
