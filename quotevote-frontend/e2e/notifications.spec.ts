/**
 * E2E-NOTIF: Notifications
 *
 * Actor: Registered User (authorUser), with a brand-new member (peer) acting on their post
 * Auth State: Logged in (storageState from global setup); the peer acts through the API
 * Viewports: Desktop, Mobile (playwright.config.ts projects)
 *
 * The peer upvotes, comments on and follows the author. The author then sees the three
 * new notifications, filters them, reads one by opening it, marks the rest read and
 * deletes one. Runs against the real API, no mocks.
 *
 * The peer is created for each run with `pnpm seed:e2e-user` (a follow notifies only the
 * first time between two members), so the spec runs only against a local API with
 * DATABASE_URL set, like the smoke test, and repeats with no cleanup.
 */
import { test, expect, type Locator, type Page } from "@playwright/test";
import {
  commentOnPostViaApi,
  createPostViaApi,
  deletePostViaApi,
  findTagIdByTitle,
  loginViaApi,
  markAllNotificationsReadViaApi,
  setFollowViaApi,
  voteOnPostViaApi,
} from "./helpers/api";
import { AUTHOR_PASSWORD, AUTHOR_USERNAME } from "./helpers/auth";
import { isLocalApi, seedFreshUser } from "./helpers/local-seed";
import { PUBLIC_TAG_NAME } from "./helpers/post-composer";

/** Opens Notifications from the desktop header or the phone tab bar. */
async function openNotifications(page: Page, isMobile: boolean): Promise<Locator> {
  await page.goto("/");
  const inbox = page.getByTestId("notifications-inbox").locator("visible=true");
  // A click before the page has hydrated is lost, so click until the inbox opens.
  await expect(async () => {
    await page
      .getByTestId(isMobile ? "mobile-notifications-button" : "desktop-notifications-button")
      .click();
    await expect(inbox).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await expect(inbox.getByTestId("notifications-loading")).toHaveCount(0);
  return inbox;
}

test.describe("E2E-NOTIF: Notifications", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!AUTHOR_PASSWORD, "E2E_AUTHOR_PASSWORD is required");
  test.skip(!isLocalApi(), "Runs only against a local API (set E2E_API_URL); it seeds a member");

  let authorToken: string;
  let postId: string | null = null;
  let postTitle: string;
  let commentText: string;
  let peerName: string;

  test.beforeAll(async () => {
    const author = await loginViaApi(AUTHOR_USERNAME, AUTHOR_PASSWORD);
    const seeded = seedFreshUser();
    const peer = await loginViaApi(seeded.username, seeded.password);
    authorToken = author.token;
    peerName = peer.user.name || peer.user.username;

    const stamp = `notif-${Date.now()}`;
    postTitle = `E2E-NOTIF ${stamp}`;
    commentText = `A fair point, but who pays for it? (${stamp})`;
    const tagId = await findTagIdByTitle(author.token, PUBLIC_TAG_NAME);
    const post = await createPostViaApi(author.token, {
      userId: author.user._id,
      tagId,
      title: postTitle,
      text: "Night buses after the stadium closes would cost less than the overtime the city pays.",
    });
    postId = post._id;

    // Start from nothing new, so the counts below are this run's three notifications.
    await markAllNotificationsReadViaApi(author.token);

    await voteOnPostViaApi(peer.token, {
      postId: post._id,
      userId: peer.user._id,
      type: "up",
      tags: "#agree",
      words: 4,
    });
    await commentOnPostViaApi(peer.token, {
      postId: post._id,
      userId: peer.user._id,
      content: commentText,
    });
    await setFollowViaApi(peer.token, author.user._id, true);
  });

  test.afterAll(async () => {
    if (postId) await deletePostViaApi(postId, authorToken);
  });

  test("E2E-NOTIF-001: shows the new vote, comment and follow with the unread count", async ({
    page,
    isMobile,
  }) => {
    const inbox = await openNotifications(page, isMobile);
    await expect(inbox.getByText("3 new since you last checked")).toBeVisible();

    const rows = inbox.getByTestId("notification-row");
    await expect(
      rows.filter({ hasText: `${peerName} upvoted your post` }).filter({ hasText: postTitle })
    ).toHaveAttribute("data-unread", "true");
    await expect(
      rows
        .filter({ hasText: `${peerName} commented on your post` })
        .filter({ hasText: commentText })
    ).toHaveAttribute("data-unread", "true");
    await expect(
      rows.filter({ hasText: `${peerName} started following you` }).first()
    ).toHaveAttribute("data-unread", "true");
  });

  test("E2E-NOTIF-002: filters by kind", async ({ page, isMobile }) => {
    const inbox = await openNotifications(page, isMobile);
    const filters = inbox.getByRole("tablist", { name: "Filter notifications" });
    const rows = inbox.getByTestId("notification-row");

    await filters.getByRole("tab", { name: "Votes" }).click();
    await expect(rows.filter({ hasText: postTitle })).toHaveCount(1);
    await expect(rows.filter({ hasText: commentText })).toHaveCount(0);
    await expect(rows.filter({ hasText: "started following you" })).toHaveCount(0);

    await filters.getByRole("tab", { name: "Comments" }).click();
    await expect(rows.filter({ hasText: commentText })).toHaveCount(1);
    await expect(rows.filter({ hasText: "upvoted your post" })).toHaveCount(0);

    await filters.getByRole("tab", { name: "Follows" }).click();
    await expect(
      rows.filter({ hasText: `${peerName} started following you` }).first()
    ).toBeVisible();
    await expect(rows.filter({ hasText: "commented on your post" })).toHaveCount(0);

    await filters.getByRole("tab", { name: "All" }).click();
    await expect(rows.filter({ hasText: commentText })).toHaveCount(1);
  });

  test("E2E-NOTIF-003: opening a notification goes to the post and reads it", async ({
    page,
    isMobile,
  }) => {
    const inbox = await openNotifications(page, isMobile);
    await inbox
      .getByTestId("notification-row")
      .filter({ hasText: commentText })
      .getByRole("button", { name: /commented on your post/ })
      .click();
    await expect(page).toHaveURL(new RegExp(`/post/.+/${postId}`));

    // It stays in the list, read, and the count drops by one.
    const reopened = await openNotifications(page, isMobile);
    await expect(reopened.getByText("2 new since you last checked")).toBeVisible();
    await expect(
      reopened.getByTestId("notification-row").filter({ hasText: commentText })
    ).not.toHaveAttribute("data-unread", "true");
  });

  test("E2E-NOTIF-004: Mark all read clears the unread count", async ({ page, isMobile }) => {
    const inbox = await openNotifications(page, isMobile);
    const markAll = inbox.getByTestId("mark-all-notifications-read");
    await markAll.click();
    await expect(inbox.getByText("Nothing new since you last checked")).toBeVisible();
    await expect(markAll).toBeDisabled();

    // Saved on the server, not just in this page.
    const reopened = await openNotifications(page, isMobile);
    await expect(reopened.getByText("Nothing new since you last checked")).toBeVisible();
    await expect(reopened.locator('[data-testid="notification-row"][data-unread]')).toHaveCount(0);
  });

  test("E2E-NOTIF-005: deletes a notification", async ({ page, isMobile }) => {
    const inbox = await openNotifications(page, isMobile);
    const voteRow = inbox.getByTestId("notification-row").filter({ hasText: postTitle });
    await voteRow.getByRole("button", { name: `Delete notification from ${peerName}` }).click();
    await expect(voteRow).toHaveCount(0);

    const reopened = await openNotifications(page, isMobile);
    await expect(
      reopened.getByTestId("notification-row").filter({ hasText: postTitle })
    ).toHaveCount(0);
  });
});
