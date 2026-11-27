/**
 * First-time setup for a new instance: the first administrator and the starting tags and
 * posts. Run through `app/setup.ts`; see docs/backend/instance-setup.md.
 *
 * Every step is safe to run twice: existing accounts, tags and posts are left as they are.
 */
import type { PrismaClient } from '@prisma/client';
import { postsResolver } from '~/data/resolvers/postsResolver';
import { tagResolver } from '~/data/resolvers/tagResolver';
import { generateHashPassword } from '~/data/utils/authentication';
import { pubsub } from '~/data/utils/pubsub';
import { toPublicUser, type PrismaUserRecord } from '~/data/utils/userPrismaMapper';
import type { GraphQLContext } from '~/types/graphql';
import type { AdminInput, DemoContent, DemoSeedResult } from '~/types/instanceSetup';
import { normalizeUsername } from '~/data/utils/usernames';

/** Same rule as signup (`completeSignup`). */
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 12;

/** Checks the first administrator's details. Returns them trimmed, or throws. */
export function validateAdminInput(input: AdminInput): AdminInput {
  const email = input.email.trim().toLowerCase();
  const typedUsername = input.username.trim();
  // Saved in lowercase, like legacy (#748); the display name keeps the capitals.
  const username = normalizeUsername(typedUsername);
  const name = input.name.trim() || typedUsername;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email');
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error('Username must be 3 to 20 letters, digits or underscores');
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return { email, username, name, password: input.password };
}

/**
 * Creates the first administrator. An admin who already has this username or email is
 * left as is ('exists'); any other account with it stops the step, so nothing is ever
 * overwritten or promoted by accident.
 */
export async function createFirstAdmin(
  prisma: PrismaClient,
  input: AdminInput
): Promise<'created' | 'exists'> {
  const admin = validateAdminInput(input);
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: admin.username }, { email: admin.email }] },
    select: { id: true, isAdmin: true, password: true },
  });
  if (existing) {
    if (existing.isAdmin && existing.password) return 'exists';
    throw new Error(
      'An account with this username or email already exists and is not a finished admin account. Nothing was changed.'
    );
  }
  await prisma.user.create({
    data: {
      email: admin.email,
      username: admin.username,
      name: admin.name,
      password: await generateHashPassword(admin.password),
      isAdmin: true,
      accountStatus: 'active',
      emailVerified: true,
    },
    select: { id: true },
  });
  return 'created';
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown, where: string): string => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${where} is required`);
  return value.trim();
};

/** Reads `{ tags: [{ title, description }], posts: [{ tag, title, text }] }`. */
export function parseDemoContent(value: unknown): DemoContent {
  if (!isRecord(value)) throw new Error('The content file must hold a JSON object');
  const tags = Array.isArray(value.tags) ? value.tags : [];
  const posts = Array.isArray(value.posts) ? value.posts : [];
  if (tags.length === 0 && posts.length === 0)
    throw new Error('The content file has no tags or posts');

  const content: DemoContent = {
    tags: tags.map((t, i) => {
      if (!isRecord(t)) throw new Error(`tags[${i}] must be an object`);
      return {
        title: text(t.title, `tags[${i}].title`),
        description: text(t.description, `tags[${i}].description`),
      };
    }),
    posts: posts.map((p, i) => {
      if (!isRecord(p)) throw new Error(`posts[${i}] must be an object`);
      return {
        tag: text(p.tag, `posts[${i}].tag`),
        title: text(p.title, `posts[${i}].title`),
        text: text(p.text, `posts[${i}].text`),
      };
    }),
  };
  const titles = new Set(content.tags.map((t) => t.title));
  for (const post of content.posts) {
    if (!titles.has(post.tag))
      throw new Error(`Post "${post.title}" uses tag "${post.tag}", which the file doesn't list`);
  }
  return content;
}

/** A resolver context acting as the given admin, as the server would build it. */
function adminContext(prisma: PrismaClient, record: PrismaUserRecord): GraphQLContext {
  const user = toPublicUser(record);
  return {
    prisma,
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    user,
    userId: String(user._id),
    pubsub,
    requestId: 'instance-setup',
  } as GraphQLContext;
}

/**
 * Creates the starting tags and posts as the first administrator, through the same
 * resolvers the app uses. Tags and posts whose title already exists are skipped.
 */
export async function seedDemoContent(
  prisma: PrismaClient,
  content: DemoContent,
  log: (line: string) => void
): Promise<DemoSeedResult> {
  // Older admin records may lack a password; only a finished admin account can post.
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    orderBy: { id: 'asc' },
    select: { id: true, password: true, accountStatus: true },
  });
  const adminId = admins.find((a) => a.password && a.accountStatus !== 'disabled')?.id;
  if (!adminId) throw new Error('No administrator yet: run the admin step first');
  const record = await prisma.user.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      isAdmin: true,
      accountStatus: true,
    },
  });
  if (!record) throw new Error('No administrator yet: run the admin step first');
  const context = adminContext(prisma, record as PrismaUserRecord);

  const result: DemoSeedResult = { tagsCreated: 0, tagsKept: 0, postsCreated: 0, postsKept: 0 };
  const tagIds = new Map<string, string>();
  for (const tag of content.tags) {
    const found = await prisma.tag.findFirst({ where: { title: tag.title }, select: { id: true } });
    if (found) {
      tagIds.set(tag.title, found.id);
      result.tagsKept += 1;
      log(`tag kept: ${tag.title}`);
      continue;
    }
    const created = await tagResolver.Mutation.createTag(
      null,
      {
        tag: {
          creatorId: record.id,
          title: tag.title,
          description: tag.description,
          privacy: 'public',
        },
      },
      context
    );
    tagIds.set(tag.title, String(created._id));
    result.tagsCreated += 1;
    log(`tag created: ${tag.title}`);
  }

  for (const post of content.posts) {
    const found = await prisma.post.findFirst({
      where: { title: post.title },
      select: { id: true, deleted: true },
    });
    if (found && found.deleted !== true) {
      result.postsKept += 1;
      log(`post kept: ${post.title}`);
      continue;
    }
    await postsResolver.Mutation.addPost(
      null,
      {
        post: {
          userId: record.id,
          tagId: tagIds.get(post.tag),
          title: post.title,
          text: post.text,
        },
      },
      context
    );
    result.postsCreated += 1;
    log(`post created: ${post.title}`);
  }
  return result;
}
