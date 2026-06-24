/**
 * E2E-POST-001 — Create Public Post
 *
 * Sheet mapping:
 * - Feature: Create Public Post
 * - Actor: Registered User (authorUser)
 * - Auth State: Logged in (precondition via global-setup storageState)
 * - Steps: Open composer → enter title/text → select Public → submit
 * - Expected: Post created, unique URL, appears in relevant lists
 * - Playwright notes: Assert post title/text on detail page
 * - Viewports: Desktop, Mobile (playwright.config.ts projects)
 */
import { test, expect } from '@playwright/test';
import { deletePostViaApi, loginViaApi } from './helpers/api';
import { AUTHOR_PASSWORD, AUTHOR_USERNAME } from './helpers/auth';

const PUBLIC_GROUP_NAME = process.env.E2E_PUBLIC_GROUP_NAME ?? 'Public';

test.describe('E2E-POST-001: Create Public Post', () => {
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

  test('creates a public text post and verifies detail page', async ({ page }) => {
    const uniqueSuffix = `${Date.now()}-${test.info().project.name}`;
    const postTitle = `E2E-POST-001 ${uniqueSuffix}`;
    const postBody = `Automated post body for ${uniqueSuffix}. Sharing thoughts for feedback.`;

    // Precondition: user is already authenticated (storageState from global setup)
    await page.goto('/dashboard/explore');
    await expect(page).toHaveURL(/\/dashboard\/explore/);

    // Step: open composer
    const createButton = page.getByTestId('create-post-button').locator('visible=true');
    await createButton.click();

    const composer = page.getByTestId('post-composer');
    await expect(composer).toBeVisible();

    // Step: enter title and text
    const titleInput = page.getByTestId('post-title-input');
    const bodyInput = page.getByTestId('post-body-input');
    await titleInput.fill(postTitle);
    await bodyInput.fill(postBody);

    await expect(titleInput).toHaveValue(postTitle);
    await expect(bodyInput).toHaveValue(postBody);

    // Step: select Public group
    const groupSelect = page.getByTestId('post-group-select');
    await groupSelect.click();

    const groupSearch = page.getByPlaceholder('Search or type new group name...');
    await groupSearch.fill(PUBLIC_GROUP_NAME);

    const publicGroupOption = page.getByRole('button', { name: PUBLIC_GROUP_NAME, exact: true });
    await expect(publicGroupOption).toBeVisible();
    await publicGroupOption.click();

    // Step: submit
    const submitButton = page.getByTestId('post-submit-button');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.getByTestId('post-composer')).toBeHidden({ timeout: 30_000 });
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard\/explore/, { timeout: 30_000 });

    // Expected: post appears in a relevant list (explore/home feed)
    const postCard = page.getByTestId('post-card').filter({ hasText: postTitle }).first();
    await expect(postCard).toBeVisible({ timeout: 30_000 });

    await postCard.click();

    // Expected: unique post URL generated
    await expect(page).toHaveURL(/\/dashboard\/post\/.+\/.+\/.+/, { timeout: 30_000 });

    const postUrl = page.url();
    const postIdMatch = postUrl.match(/\/dashboard\/post\/[^/]+\/[^/]+\/([^/?#]+)/);
    expect(postIdMatch?.[1]).toBeTruthy();
    createdPostId = postIdMatch![1];

    // Playwright notes: assert title/text on detail page
    await expect(page.getByTestId('post-detail-title')).toHaveText(postTitle);
    await expect(page.getByTestId('post-detail-body')).toContainText(postBody);

    await page.goto('/dashboard/explore');
    await expect(
      page.getByTestId('post-card').filter({ hasText: postTitle }).first()
    ).toBeVisible({ timeout: 30_000 });
  });
});
