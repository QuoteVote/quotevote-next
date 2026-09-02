/**
 * E2E-MOB-005 — Mobile Highlight Selection (delayed two-tap, issue #484)
 *
 * Sheet mapping:
 * - Feature Area: Mobile
 * - Scenario: Mobile Highlight Selection (delayed toolbar)
 * - Priority: P0
 * - Actor: Registered User (authorUser)
 * - Auth State: Logged in
 * - Required Data: Public post
 * - Viewport: Mobile
 *
 * Steps (delayed workflow):
 * 1. Select passage → native Selection contains text, toolbar hidden, retained mark absent
 * 2. First background tap → native cleared, retained mark + toolbar visible, clamped
 * 3. Actions interactive (Comment tap)
 * 4. Second background tap → toolbar/highlight dismissed, URL unchanged
 */
import { test, expect } from "@playwright/test";
import { deletePostViaApi, loginViaApi } from "./helpers/api";
import { AUTHOR_PASSWORD, AUTHOR_USERNAME } from "./helpers/auth";
import {
  selectMobilePostText,
  advanceMobileSelectionToToolbar,
  dismissMobileToolbar,
} from "./helpers/selection";

import { PUBLIC_TAG_NAME } from "./helpers/post-composer";

test.describe("E2E-MOB-005: Mobile Highlight Selection", () => {
  test.skip(!AUTHOR_PASSWORD, "E2E_AUTHOR_PASSWORD is required");

  let createdPostId: string | null = null;
  let authToken: string | null = null;

  test.beforeAll(async () => {
    const session = await loginViaApi(AUTHOR_USERNAME, AUTHOR_PASSWORD);
    authToken = session.token;
  });

  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, "This test suite is designed specifically for mobile viewports");
  });

  test.afterEach(async () => {
    if (createdPostId && authToken) {
      await deletePostViaApi(createdPostId, authToken);
      createdPostId = null;
    }
  });

  test("mobile delayed toolbar: selection → first tap shows retained highlight → second tap dismisses", async ({
    page,
  }) => {
    const uniqueSuffix = `${Date.now()}-mob`;
    const postTitle = `E2E-MOB-005 ${uniqueSuffix}`;
    const postBody = `Automated mobile post body for testing touch highlight selection in ${uniqueSuffix}. Please select this passage of text on a mobile viewport to see the action popup.`;

    await page.goto("/");
    await expect(page).toHaveURL((url) => url.pathname === "/");

    const firstPostCard = page.getByTestId("post-card").first();
    const hasExistingPost = await firstPostCard.isVisible().catch(() => false);

    if (!hasExistingPost) {
      const createButton = page.getByTestId("create-post-button").locator("visible=true");
      await createButton.click();

      const composer = page.getByTestId("post-composer");
      await expect(composer).toBeVisible();

      await page.getByTestId("post-title-input").fill(postTitle);
      await page.getByTestId("post-body-input").fill(postBody);

      await page.getByTestId("post-tag-select").click();
      await page.getByPlaceholder("Search or type new tag name...").fill(PUBLIC_TAG_NAME);
      await page.getByRole("button", { name: PUBLIC_TAG_NAME, exact: true }).click();

      await page.getByTestId("post-submit-button").click();
      await expect(page.getByTestId("post-composer")).toBeHidden({ timeout: 30_000 });
      await expect(page).toHaveURL((url) => url.pathname === "/", { timeout: 30_000 });
    }

    const targetPostCard = page.getByTestId("post-card").first();
    await expect(targetPostCard).toBeVisible({ timeout: 30_000 });
    await targetPostCard.click();

    await expect(page).toHaveURL(/\/dashboard\/post\/.+\/.+\/.+/, { timeout: 30_000 });
    const postBodyElement = page.getByTestId("post-detail-body");
    await expect(postBodyElement).toBeVisible({ timeout: 30_000 });

    const postUrl = page.url();
    const postIdMatch = postUrl.match(/\/dashboard\/post\/[^/]+\/[^/]+\/([^/?#]+)/);
    if (!hasExistingPost && postIdMatch?.[1]) {
      createdPostId = postIdMatch[1];
    }

    const highlightPopup = page.getByTestId("highlight-popup");
    const retainedMark = page.getByTestId("retained-selection-highlight");

    // Step 1: Create DOM selection — toolbar and retained must remain hidden
    await selectMobilePostText(page);

    // Native Selection contains text
    const nativeText = await page.evaluate(() => window.getSelection()?.toString() ?? "");
    expect(nativeText.length).toBeGreaterThan(0);

    await expect(highlightPopup).toBeHidden({ timeout: 5_000 });
    await expect(retainedMark).toBeHidden({ timeout: 5_000 });

    // Step 2: First background tap → retained + toolbar appear, native cleared
    await advanceMobileSelectionToToolbar(page);

    await expect
      .poll(async () => await page.evaluate(() => window.getSelection()?.toString() ?? ""), {
        timeout: 5_000,
      })
      .toBe("");

    await expect(retainedMark).toBeVisible({ timeout: 10_000 });
    // Retained mark contains the selected passage
    await expect(retainedMark).toContainText(nativeText.slice(0, 20));

    await expect(highlightPopup).toBeVisible({ timeout: 10_000 });

    // Viewport clamped
    const popupBox = await highlightPopup.boundingBox();
    expect(popupBox).not.toBeNull();
    if (popupBox) {
      const viewportSize = page.viewportSize() || { width: 393, height: 851 };
      expect(popupBox.x).toBeGreaterThanOrEqual(0);
      expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(viewportSize.width);
    }

    await expect(page.getByTestId("highlight-agree-button").first()).toBeVisible();
    await expect(page.getByTestId("highlight-disagree-button").first()).toBeVisible();
    await expect(page.getByTestId("highlight-comment-button").first()).toBeVisible();
    await expect(page.getByTestId("highlight-quote-button").first()).toBeVisible();

    // Comment input remains usable
    const commentButton = page.getByTestId("highlight-comment-button").first();
    await commentButton.tap();
    await expect(highlightPopup).toBeVisible();

    // Step 3: Second background tap dismisses toolbar/highlight, URL unchanged
    const urlBeforeDismiss = page.url();
    await dismissMobileToolbar(page);

    await expect(highlightPopup).toBeHidden({ timeout: 5_000 });
    await expect(retainedMark).toBeHidden({ timeout: 5_000 });
    expect(page.url()).toBe(urlBeforeDismiss);

    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
  });
});
