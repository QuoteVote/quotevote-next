/**
 * E2E-CHAT-010: A conversation between two members
 *
 * Actors: two brand-new members, each in their own browser
 * Auth State: Logged in (sessions from the API, saved per member)
 * Viewports: Desktop, Mobile (playwright.config.ts projects)
 *
 * One member messages the other from their profile. The other finds the conversation in
 * Messages, reads it and replies, and the reply reaches the first member live, without a
 * reload. The first member then sees when their message was read ("Seen 2:51 PM"). Runs against the real API and WebSocket, no mocks.
 *
 * Both members are created for each run with `pnpm seed:e2e-user`, so every run starts a
 * new conversation. It runs only against a local API with DATABASE_URL set, like the
 * smoke test, and repeats with no cleanup.
 */
import path from "path";
import {
  test,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { loginViaApi } from "./helpers/api";
import { openMessagesPanel, selectMessagesTab } from "./helpers/chat";
import { isLocalApi, seedFreshUser, type SeededUser } from "./helpers/local-seed";
import { saveStorageState } from "./helpers/storage-state";

interface Member {
  user: SeededUser;
  context: BrowserContext;
  page: Page;
}

/** A browser for `user`, signed in through the API, on the project's device. */
async function openAs(browser: Browser, testInfo: TestInfo, user: SeededUser): Promise<Member> {
  const baseURL = testInfo.project.use.baseURL ?? process.env.PLAYWRIGHT_BASE_URL ?? "";
  const statePath = path.join(testInfo.outputDir, `${user.username}.json`);
  await saveStorageState(statePath, baseURL, await loginViaApi(user.username, user.password));
  const context = await browser.newContext({ ...testInfo.project.use, storageState: statePath });
  return { user, context, page: await context.newPage() };
}

/** The open conversation's composer: fills it and sends. */
async function send(page: Page, text: string): Promise<void> {
  const input = page.getByRole("textbox", { name: "message input" }).locator("visible=true");
  await input.fill(text);
  await page.getByRole("button", { name: "Send message" }).locator("visible=true").click();
}

test.describe("E2E-CHAT-010: A conversation between two members", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!isLocalApi(), "Runs only against a local API (set E2E_API_URL); it seeds members");

  let sender: Member;
  let recipient: Member;
  const stamp = Date.now();
  const opening = `Are you coming to the transit meeting on Thursday? (${stamp})`;
  const reply = `Yes, I'll bring the ridership numbers. (${stamp})`;

  test.beforeAll(async ({ browser }, testInfo) => {
    sender = await openAs(browser, testInfo, seedFreshUser());
    recipient = await openAs(browser, testInfo, seedFreshUser());
  });

  test.afterAll(async () => {
    await sender?.context.close();
    await recipient?.context.close();
  });

  test("E2E-CHAT-010a: messages a member from their profile", async () => {
    const { page } = sender;
    await page.goto(`/profile/${recipient.user.username}`);
    // A click before the page has hydrated is lost, so click until the composer opens.
    await expect(async () => {
      await page
        .getByRole("button", { name: /^message$/i })
        .locator("visible=true")
        .click();
      await expect(
        page.getByRole("textbox", { name: "message input" }).locator("visible=true")
      ).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });

    await send(page, opening);
    await expect(page.getByText(opening).locator("visible=true").first()).toBeVisible();
  });

  test("E2E-CHAT-010b: the other member reads it in Messages and replies", async ({ isMobile }) => {
    const { page } = recipient;
    await page.goto("/");
    await expect(async () => {
      await openMessagesPanel(page, isMobile);
    }).toPass({ timeout: 20_000 });
    await selectMessagesTab(page, "Chats");

    const chat = page.getByTestId("chat-page").locator("visible=true");
    // The row's preview line is the newest message.
    await chat.getByTestId("discussion-thread").filter({ hasText: opening }).first().click();
    await expect(page.getByText(opening).locator("visible=true").first()).toBeVisible();

    await send(page, reply);
    await expect(page.getByText(reply).locator("visible=true").first()).toBeVisible();
  });

  test("E2E-CHAT-010c: the reply arrives live, without a reload", async () => {
    // The sender's conversation is still open from 010a; no navigation in between.
    await expect(sender.page.getByText(reply).locator("visible=true").first()).toBeVisible();
  });

  test("E2E-CHAT-010d: the sender sees when their message was read", async ({ isMobile }) => {
    // The recipient opened the conversation in 010b, which marks it read with the time.
    const { page } = sender;
    await page.goto("/");
    await expect(async () => {
      await openMessagesPanel(page, isMobile);
    }).toPass({ timeout: 20_000 });
    await selectMessagesTab(page, "Chats");
    const chat = page.getByTestId("chat-page").locator("visible=true");
    await chat.getByTestId("discussion-thread").filter({ hasText: reply }).first().click();
    await expect(page.getByTestId("message-seen").locator("visible=true")).toHaveText(
      /^Seen \d{1,2}:\d{2} (AM|PM)$/
    );
  });
});
