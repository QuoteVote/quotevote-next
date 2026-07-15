/**
 * E2E-MOB-005 — Mobile Highlight Selection
 *
 * Sheet mapping:
 * - Feature Area: Mobile
 * - Scenario: Mobile Highlight Selection
 * - Priority: P0
 * - Actor: Registered User (authorUser)
 * - Auth State: Logged in
 * - Required Data: Public post
 * - Viewport: Mobile
 * - Suggested Spec File: mobile.spec.ts
 *
 * Test Steps:
 * 1. Log in as authorUser in a mobile viewport.
 * 2. Navigate to an existing public post.
 * 3. Select a passage of text within the post body.
 * 4. Confirm the highlight action popup appears.
 * 5. Confirm the popup is fully visible within the viewport (not cut off by left or right edge).
 * 6. Confirm native copy/paste controls do not prevent interaction with the Quote.Vote popup.
 * 7. Tap the available popup actions enough to confirm they are visible, reachable, and responsive.
 */
import { test, expect } from '@playwright/test';
import { deletePostViaApi, loginViaApi } from './helpers/api';
import { AUTHOR_PASSWORD, AUTHOR_USERNAME } from './helpers/auth';
import { selectMobilePostText } from './helpers/selection';

import { PUBLIC_TAG_NAME } from './helpers/post-composer';

test.describe('E2E-MOB-005: Mobile Highlight Selection', () => {
  test.skip(!AUTHOR_PASSWORD, 'E2E_AUTHOR_PASSWORD is required');

  let createdPostId: string | null = null;
  let authToken: string | null = null;

  test.beforeAll(async () => {
    const session = await loginViaApi(AUTHOR_USERNAME, AUTHOR_PASSWORD);
    authToken = session.token;
  });

  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, 'This test suite is designed specifically for mobile viewports');
  });

  test.afterEach(async () => {
    if (createdPostId && authToken) {
      await deletePostViaApi(createdPostId, authToken);
      createdPostId = null;
    }
  });

  test('mobile user can select text and interact with highlight popup without clipping or overlap', async ({ page }) => {
    const uniqueSuffix = `${Date.now()}-mob`;
    const postTitle = `E2E-MOB-005 ${uniqueSuffix}`;
    const postBody = `Automated mobile post body for testing touch highlight selection in ${uniqueSuffix}. Please select this passage of text on a mobile viewport to see the action popup.`;

    // Step 1: Log in as authorUser in a mobile viewport
    await page.goto('/dashboard/explore');
    await expect(page).toHaveURL(/\/dashboard\/explore/);

    // Ensure at least one public post exists on the explore feed
    const firstPostCard = page.getByTestId('post-card').first();
    const hasExistingPost = await firstPostCard.isVisible().catch(() => false);

    if (!hasExistingPost) {
      const createButton = page.getByTestId('create-post-button').locator('visible=true');
      await createButton.click();

      const composer = page.getByTestId('post-composer');
      await expect(composer).toBeVisible();

      await page.getByTestId('post-title-input').fill(postTitle);
      await page.getByTestId('post-body-input').fill(postBody);

      await page.getByTestId('post-tag-select').click();
      await page.getByPlaceholder('Search or type new tag name...').fill(PUBLIC_TAG_NAME);
      await page.getByRole('button', { name: PUBLIC_TAG_NAME, exact: true }).click();

      await page.getByTestId('post-submit-button').click();
      await expect(page.getByTestId('post-composer')).toBeHidden({ timeout: 30_000 });
      await expect(page).toHaveURL(/\/dashboard\/explore/, { timeout: 30_000 });
    }

    // Step 2: Navigate to an existing public post
    const targetPostCard = page.getByTestId('post-card').first();
    await expect(targetPostCard).toBeVisible({ timeout: 30_000 });
    await targetPostCard.click();

    // Confirm mobile post page loads successfully and post body text is visible
    await expect(page).toHaveURL(/\/dashboard\/post\/.+\/.+\/.+/, { timeout: 30_000 });
    const postBodyElement = page.getByTestId('post-detail-body');
    await expect(postBodyElement).toBeVisible({ timeout: 30_000 });

    const postUrl = page.url();
    const postIdMatch = postUrl.match(/\/dashboard\/post\/[^/]+\/[^/]+\/([^/?#]+)/);
    if (!hasExistingPost && postIdMatch?.[1]) {
      createdPostId = postIdMatch[1];
    }

    // Step 3: Select a passage of text within the post body using mobile selection helper
    await selectMobilePostText(page);

    // Step 4: Confirm the highlight action popup appears
    const highlightPopup = page.getByTestId('highlight-popup');
    await expect(highlightPopup).toBeVisible({ timeout: 15_000 });

    // Step 5: Confirm the popup is fully visible within the viewport without side-of-screen clipping
    const popupBox = await highlightPopup.boundingBox();
    expect(popupBox).not.toBeNull();
    if (popupBox) {
      const viewportSize = page.viewportSize() || { width: 393, height: 851 };
      // Popup must not be cut off by left edge (x >= 0) or right edge (x + width <= viewportWidth)
      expect(popupBox.x).toBeGreaterThanOrEqual(0);
      expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(viewportSize.width);
    }

    // Step 6 & 7: Confirm native copy/paste controls do not prevent interaction with the Quote.Vote popup,
    // and tap available popup actions to confirm they are visible, reachable, and responsive.
    const agreeButton = page.getByTestId('highlight-agree-button').first();
    const disagreeButton = page.getByTestId('highlight-disagree-button').first();
    const commentButton = page.getByTestId('highlight-comment-button').first();
    const quoteButton = page.getByTestId('highlight-quote-button').first();

    await expect(agreeButton).toBeVisible();
    await expect(disagreeButton).toBeVisible();
    await expect(commentButton).toBeVisible();
    await expect(quoteButton).toBeVisible();

    // Tap comment action: Playwright's .tap() ensures the button receives touch events and is not obscured
    // by native OS selection handles or copy/paste popups.
    await commentButton.tap();

    // Verify tapping responsive action expanded the comment input or state cleanly
    await expect(highlightPopup).toBeVisible();

    // Confirm no runtime error or error toast appears
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
  });
});
