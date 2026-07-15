/**
 * E2E-HILITE-001 — Highlight Action Popup
 *
 * Sheet mapping:
 * - Feature: Highlight Action Popup
 * - Actor: Registered User (authorUser)
 * - Auth State: Logged in (precondition via global-setup storageState)
 * - Steps: Log in → navigate to public post → select text → assert popup & actions
 * - Expected: Highlight popup appears with Agree, Disagree, Comment, Quote actions
 * - Viewports: Desktop, Mobile (playwright.config.ts projects)
 */
import { test, expect } from '@playwright/test';
import { deletePostViaApi, loginViaApi } from './helpers/api';
import { AUTHOR_PASSWORD, AUTHOR_USERNAME } from './helpers/auth';
import { selectPostText } from './helpers/selection';

import { PUBLIC_TAG_NAME } from './helpers/post-composer';

test.describe('E2E-HILITE-001: Highlight Action Popup', () => {
  test.skip(!AUTHOR_PASSWORD, 'E2E_AUTHOR_PASSWORD is required');

  let createdPostId: string | null = null;
  let authToken: string | null = null;

  test.beforeAll(async () => {
    const session = await loginViaApi(AUTHOR_USERNAME, AUTHOR_PASSWORD);
    authToken = session.token;
  });

  test.afterEach(async () => {
    if (createdPostId && authToken) {
      await deletePostViaApi(createdPostId, authToken);
      createdPostId = null;
    }
  });

  test('opens highlight popup on text selection with expected actions', async ({ page }) => {
    const uniqueSuffix = `${Date.now()}-${test.info().project.name}`;
    const postTitle = `E2E-HILITE-001 ${uniqueSuffix}`;
    const postBody = `Automated post body for testing text highlight selection in ${uniqueSuffix}. Please select this passage of text to see the action popup.`;

    // Step 1: Log in as authorUser (precondition via global-setup storageState)
    await page.goto('/dashboard/explore');
    await expect(page).toHaveURL(/\/dashboard\/explore/);

    // Ensure at least one public post exists on the explore feed
    const firstPostCard = page.getByTestId('post-card').first();
    const hasExistingPost = await firstPostCard.isVisible().catch(() => false);

    if (!hasExistingPost) {
      // If no public posts exist in this environment, create one via the composer
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

    // Confirm public post page loads successfully and post body text is visible
    await expect(page).toHaveURL(/\/dashboard\/post\/.+\/.+\/.+/, { timeout: 30_000 });
    const postBodyElement = page.getByTestId('post-detail-body');
    await expect(postBodyElement).toBeVisible({ timeout: 30_000 });

    const postUrl = page.url();
    const postIdMatch = postUrl.match(/\/dashboard\/post\/[^/]+\/[^/]+\/([^/?#]+)/);
    if (!hasExistingPost && postIdMatch?.[1]) {
      createdPostId = postIdMatch[1];
    }

    // Step 3: Select a passage of text within the post body
    await selectPostText(page);

    // Step 4: Confirm that the highlight action popup appears
    const highlightPopup = page.getByTestId('highlight-popup');
    await expect(highlightPopup).toBeVisible({ timeout: 15_000 });

    // Step 5: Confirm that the popup includes the expected passage-level actions
    await expect(page.getByTestId('highlight-agree-button')).toBeVisible();
    await expect(page.getByTestId('highlight-disagree-button')).toBeVisible();
    await expect(page.getByTestId('highlight-comment-button')).toBeVisible();
    await expect(page.getByTestId('highlight-quote-button')).toBeVisible();

    // Check optional chat action if enabled
    const chatButton = page.getByTestId('highlight-chat-button');
    if ((await chatButton.count()) > 0) {
      await expect(chatButton).toBeVisible();
    }

    // Confirm popup remains visible long enough for the user to choose an action
    await page.waitForTimeout(1000);
    await expect(highlightPopup).toBeVisible();

    // Confirm no runtime error or error toast appears
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
  });
});
