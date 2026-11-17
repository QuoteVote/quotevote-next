/**
 * SMOKE-001: staging smoke test (#182)
 *
 * One pass over the core of the product on a running stack: sign in, password reset, post,
 * vote, comment, quote, follow, message, notifications and a live update over WebSocket.
 *
 * Two members are created fresh for every run (`pnpm seed:e2e-user`), so the test repeats on
 * the same database with no cleanup. It runs only against a local API with the SendGrid mock,
 * because it writes accounts and posts and reads the reset email from the mock.
 *
 * Run it against production builds (see e2e/SMOKE.md), desktop only:
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm test:e2e smoke.spec.ts --project=desktop
 */
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createMessageViaApi, findTagIdByTitle, getApiUrl, loginViaApi } from "./helpers/api";
import { extractAppLink, hasEmailE2ECredentials, waitForEmail } from "./helpers/email";
import { isLocalApi, seedFreshUser, type SeededUser } from "./helpers/local-seed";
import { PUBLIC_TAG_NAME, openPostComposer, selectPostTag } from "./helpers/post-composer";
import { selectPostText } from "./helpers/selection";

const NO_SESSION = { cookies: [], origins: [] };

async function signIn(page: Page, identifier: string, password: string): Promise<void> {
  await page.goto("/auths/login");
  await page.getByTestId("login-identifier-input").fill(identifier);
  await page.getByTestId("login-password-input").fill(password);
  await page.getByTestId("login-tos-checkbox").click();
  await page.getByTestId("login-coc-checkbox").click();
  await page.getByTestId("login-submit-button").click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 30_000 });
}

async function memberPage(
  browser: Browser,
  user: SeededUser
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: NO_SESSION });
  const page = await context.newPage();
  await signIn(page, user.username, user.password);
  return { context, page };
}

test.describe.serial("SMOKE-001: staging smoke test (#182)", () => {
  test.skip(!isLocalApi(), "Runs only against a local API (set E2E_API_URL)");
  test.skip(!hasEmailE2ECredentials(), "Needs the SendGrid mock (set E2E_SENDGRID_MOCK_URL)");
  test.use({ storageState: NO_SESSION });

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The smoke test runs once, on desktop");
  });

  let author: SeededUser;
  let reader: SeededUser;
  let a: { context: BrowserContext; page: Page };
  let b: { context: BrowserContext; page: Page };
  let postUrl = "";
  let postId = "";
  const stamp = Date.now();
  const postTitle = `SMOKE ${stamp}: should the library open on Sundays?`;
  const postBody = `Opening the main library on Sundays would help students and shift workers who cannot visit during the week. Run ${stamp}.`;

  test.beforeAll(() => {
    author = seedFreshUser();
    reader = seedFreshUser();
  });

  test.afterAll(async () => {
    await a?.context.close();
    await b?.context.close();
  });

  test("signs in both members", async ({ browser }) => {
    a = await memberPage(browser, author);
    b = await memberPage(browser, reader);
    await expect(a.page.getByTestId("create-post-button").locator("visible=true")).toBeVisible();
    await expect(b.page.getByTestId("create-post-button").locator("visible=true")).toBeVisible();
  });

  test("resets a password from the email link and signs in with it", async ({ browser }) => {
    const context = await browser.newContext({ storageState: NO_SESSION });
    const page = await context.newPage();
    const receivedAfter = new Date();

    await page.goto("/auths/forgot-password");
    await page.locator("#email").fill(author.email);
    await page.getByRole("button", { name: /^send$/i }).click();

    const message = await waitForEmail({ sentTo: author.email, receivedAfter });
    await page.goto(extractAppLink(message));
    await expect(page).toHaveURL(/\/auths\/password-reset/);

    const newPassword = `Smoke-${stamp}-Pw!`;
    await page.locator("#newPassword").fill(newPassword);
    await page.locator("#confirmPassword").fill(newPassword);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText(
      "Password updated!"
    );

    await signIn(page, author.username, newPassword);
    author.password = newPassword;
    await context.close();
  });

  test("creates a post", async () => {
    const { page } = a;
    await openPostComposer(page);
    await page.getByTestId("post-title-input").fill(postTitle);
    await page.getByTestId("post-body-input").fill(postBody);
    await selectPostTag(page, PUBLIC_TAG_NAME);
    await page.getByTestId("post-submit-button").click();

    const toast = page.locator('[data-sonner-toast][data-type="success"]');
    await expect(toast.filter({ hasText: "Post created!" })).toBeVisible();
    await toast
      .filter({ hasText: "Post created!" })
      .getByRole("button", { name: "View post" })
      .click();
    await expect(page).toHaveURL(/\/post\/.+\/.+\/.+/, { timeout: 30_000 });
    await expect(page.getByTestId("post-detail-title")).toContainText(postTitle);

    postUrl = page.url();
    postId = postUrl.match(/\/post\/[^/]+\/[^/]+\/([^/?#]+)/)?.[1] ?? "";
    expect(postId).not.toBe("");
  });

  test("votes on a passage of the post", async () => {
    const { page } = b;
    await page.goto(postUrl);
    await expect(page.getByTestId("post-detail-body")).toBeVisible();
    await selectPostText(page);
    await page.getByTestId("highlight-vote-mode-button").click();
    await page.getByTestId("highlight-agree-button").click();
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
    await expect(page.getByText("Vote saved: Agree")).toBeVisible();
  });

  test("comments on the post", async () => {
    const { page } = b;
    const comment = `Weekend hours would make a real difference for families. (${stamp})`;
    await page.keyboard.press("Escape");
    await page.getByPlaceholder("Add to discussion...").fill(comment);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(comment)).toBeVisible();
  });

  test("quotes a passage of the post", async () => {
    const { page } = b;
    await selectPostText(page);
    await page.getByTestId("highlight-quote-button").click();
    await expect(page.getByTestId("composer-quote").locator("visible=true")).toBeVisible();
    // No note, so it is saved as a Quote (a quote with a note is saved as a comment on the passage).
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Quoted successfully")).toBeVisible();
  });

  test("follows the author", async () => {
    const { page } = b;
    await page.goto(`/profile/${author.username}`);
    await page
      .getByRole("button", { name: /^follow$/i })
      .first()
      .click();
    await expect(page.getByRole("button", { name: /unfollow/i }).first()).toBeVisible();
    await expect(page.getByText(/^1\s*Followers?$/).first()).toBeVisible();
  });

  test("sends the author a direct message", async () => {
    // The first message from a profile starts the conversation with the author (#713).
    const { page } = b;
    const text = `Thanks for posting this. Want to bring it to the council? (${stamp})`;
    await page
      .getByRole("button", { name: /^message$/i })
      .locator("visible=true")
      .click();
    await page.getByRole("textbox", { name: "message input" }).fill(text);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(text).first()).toBeVisible();

    // The author gets the conversation in their Messages panel, and the message in it.
    await a.page.goto("/");
    await a.page.getByTestId("desktop-messages-button").click();
    const chat = a.page.getByTestId("chat-page").locator("visible=true");
    await chat.getByText("Direct message").first().click();
    await expect(a.page.getByText(text).first()).toBeVisible();
  });

  // Checks the vote and the follow; the comment and quote notifications (#725) aren't part of this run.
  test("shows the author notifications for the vote and follow", async () => {
    const { page } = a;
    await page.goto("/");
    await page.getByTestId("desktop-notifications-button").click();
    const panel = page.getByTestId("notifications-panel").locator("visible=true");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/upvoted|voted/i);
    await expect(panel).toContainText(/follow/i);
  });

  test("delivers a new comment live over WebSocket without a reload", async () => {
    const { page } = a;
    await page.goto(postUrl);
    await expect(page.getByPlaceholder("Add to discussion...")).toBeVisible();

    const session = await loginViaApi(reader.username, reader.password);
    const live = `Live update check ${stamp}`;
    await createMessageViaApi(session.token, {
      type: "POST",
      componentId: postId,
      title: postTitle,
      text: live,
    });
    await expect(page.getByText(live)).toBeVisible({ timeout: 20_000 });
  });

  test("keeps the API it ran against local", async () => {
    expect(new URL(getApiUrl()).hostname).toMatch(/^(localhost|127\.0\.0\.1|\[::1\])$/);
    // The tag exists, so the run used real data rather than an empty database.
    const session = await loginViaApi(author.username, author.password);
    await expect(findTagIdByTitle(session.token, PUBLIC_TAG_NAME)).resolves.toMatch(
      /^[a-f0-9]{24}$/
    );
  });
});
