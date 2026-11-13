/**
 * Moderation E2E specs (moderation.spec.ts)
 *
 * - E2E-MOD-006: Report Content Workflow (report a post, then a repeat report)
 * - E2E-MOD-007: Report User as Bot (report a profile, then a repeat report)
 *
 * Actor: Registered User (authorUser)
 * Auth State: Logged in (storageState from global setup)
 * Viewports: Desktop, Mobile (playwright.config.ts projects)
 *
 * Every test seeds its own fresh user (`pnpm seed:e2e-user` in quotevote-backend) and uses it only
 * through the API, as the author of the post and as the profile being reported. A post report and
 * a bot report can each happen once per account pair, so a fresh user per test lets the specs run
 * again on the same database with nothing to reset.
 *
 * These specs write test accounts, so they skip unless the API is explicitly local (set
 * E2E_API_URL, for example http://localhost:4000). The posts need an existing tag: set
 * E2E_PUBLIC_TAG_NAME to one that exists on the API under test (the default is "Public").
 */
import { test, expect, type Page } from "@playwright/test";
import { createPostViaApi, deletePostViaApi, findTagIdByTitle, loginViaApi } from "./helpers/api";
import type { AuthSession } from "./helpers/api";
import { AUTHOR_PASSWORD, AUTHOR_USERNAME } from "./helpers/auth";
import { isLocalApi, seedFreshUser, type SeededUser } from "./helpers/local-seed";
import { PUBLIC_TAG_NAME } from "./helpers/post-composer";

const SKIP_NOT_LOCAL =
  "Writes test accounts, so it only runs against an explicitly local API (set E2E_API_URL)";

async function openMoreOptions(page: Page): Promise<void> {
  await page.getByRole("button", { name: "More options" }).click();
}

test.describe("E2E-MOD-006: Report Content Workflow", () => {
  test.skip(!AUTHOR_PASSWORD, "E2E_AUTHOR_PASSWORD is required");
  test.skip(!isLocalApi(), SKIP_NOT_LOCAL);

  let author: AuthSession;
  let target: SeededUser;
  let targetSession: AuthSession;
  let tagId: string;
  const createdPosts: Array<{ id: string; token: string }> = [];

  test.beforeEach(async () => {
    author = await loginViaApi(AUTHOR_USERNAME, AUTHOR_PASSWORD);
    target = seedFreshUser();
    targetSession = await loginViaApi(target.username, target.password);
    tagId = await findTagIdByTitle(author.token, PUBLIC_TAG_NAME);
  });

  test.afterEach(async () => {
    for (const post of createdPosts.splice(0)) {
      await deletePostViaApi(post.id, post.token);
    }
  });

  test("reports another user's post, then handles a repeat report", async ({ page }) => {
    const post = await createPostViaApi(targetSession.token, {
      userId: targetSession.user._id,
      tagId,
      title: `E2E-MOD-006 ${Date.now()}-${test.info().project.name}`,
      text: "A post by a fresh user so authorUser can report it.",
    });
    createdPosts.push({ id: post._id, token: targetSession.token });

    // Step: open a public post that can be reported
    await page.goto(post.url!);
    const postUrl = page.url();

    // Step: open the report action and submit the report
    await openMoreOptions(page);
    await page.getByRole("menuitem", { name: /report post/i }).click();

    // Expect: a clear confirmation, and the user stays where they were
    await expect(page.getByText("Post reported (1 total)")).toBeVisible();
    expect(page.url()).toBe(postUrl);

    // Step: report the same post again
    await openMoreOptions(page);
    await page.getByRole("menuitem", { name: /report post/i }).click();

    // Expect: a clear "already reported" message, and the page is still the same post.
    // A failed report is toasted twice today (the global Apollo error link and handleReport),
    // so match the first copy instead of failing Playwright's strict single-element rule.
    await expect(page.getByText("You have already reported this post").first()).toBeVisible();
    expect(page.url()).toBe(postUrl);
  });

  test("does not let an author report their own post", async ({ page }) => {
    const own = await createPostViaApi(author.token, {
      userId: author.user._id,
      tagId,
      title: `E2E-MOD-006 own ${Date.now()}-${test.info().project.name}`,
      text: "authorUser reports their own post.",
    });
    createdPosts.push({ id: own._id, token: author.token });

    await page.goto(own.url!);
    await openMoreOptions(page);
    await page.getByRole("menuitem", { name: /report post/i }).click();

    // Same double toast as above, so match the first copy.
    await expect(page.getByText("Cannot report your own post").first()).toBeVisible();
  });
});

test.describe("E2E-MOD-007: Report User as Bot", () => {
  test.skip(!AUTHOR_PASSWORD, "E2E_AUTHOR_PASSWORD is required");
  test.skip(!isLocalApi(), SKIP_NOT_LOCAL);

  let target: SeededUser;

  test.beforeEach(() => {
    target = seedFreshUser();
  });

  test("reports a user as a suspected bot, then handles a repeat report", async ({ page }) => {
    const graphqlErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /GraphQL error/i.test(message.text())) {
        graphqlErrors.push(message.text());
      }
    });

    const dialog = page.getByRole("dialog");
    const confirm = dialog.getByRole("button", { name: /^report bot$/i });

    async function reportBotFromProfile(): Promise<void> {
      await openMoreOptions(page);
      await page.getByRole("menuitem", { name: /report bot/i }).click();
      await expect(dialog).toBeVisible();
      await confirm.click();
    }

    // Step: open another user's profile
    await page.goto(`/profile/${target.username}`);
    const profileUrl = page.url();

    // Step: report the user from the menu and confirm
    await reportBotFromProfile();

    // Expect: a clear confirmation, the dialog closes, the reporter stays on the profile
    await expect(page.getByText("User reported successfully!")).toBeVisible();
    await expect(dialog).toBeHidden();
    expect(page.url()).toBe(profileUrl);

    // Step: report the same user again
    graphqlErrors.length = 0;
    await reportBotFromProfile();

    // Expect: a neutral "already reported" message, the dialog closes, and no error is logged
    await expect(page.getByText("You have already reported this user as a bot")).toBeVisible();
    await expect(dialog).toBeHidden();
    expect(graphqlErrors).toEqual([]);

    // Expect: a report is only a signal. Nothing on the profile labels the user as a bot.
    await page.reload();
    const heading = page.getByRole("heading", { name: target.name });
    await expect(heading).toBeVisible();
    // Scope to the name block (heading, @handle, bio) so unrelated page text cannot trip this.
    const nameBlock = heading.locator("xpath=../..");
    await expect(nameBlock).not.toContainText(/bot|automated/i);
  });
});
