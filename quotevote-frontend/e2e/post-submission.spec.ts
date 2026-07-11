/**
 * Post submission E2E specs (post-submission.spec.ts)
 *
 * - E2E-POST-001: Create Public Post (happy path)
 * - E2E-POST-003: Post Validation (required-field inline errors)
 *
 * Actor: Registered User (authorUser)
 * Auth State: Logged in (precondition via global-setup storageState)
 * Viewports: Desktop, Mobile (playwright.config.ts projects)
 */
import { test, expect } from '@playwright/test';
import { deletePostViaApi, loginViaApi } from './helpers/api';
import { AUTHOR_PASSWORD, AUTHOR_USERNAME } from './helpers/auth';
import {
  assertComposerRemainsOpen,
  assertInvalidPostNotPublished,
  openPostComposer,
  selectPostGroup,
} from './helpers/post-composer';

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
    await openPostComposer(page);

    // Step: enter title and text
    const titleInput = page.getByTestId('post-title-input');
    const bodyInput = page.getByTestId('post-body-input');
    await titleInput.fill(postTitle);
    await bodyInput.fill(postBody);

    await expect(titleInput).toHaveValue(postTitle);
    await expect(bodyInput).toHaveValue(postBody);

    // Step: select Public group
    await selectPostGroup(page);

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

test.describe('E2E-POST-003: Post Validation', () => {
  test.skip(!AUTHOR_PASSWORD, 'E2E_AUTHOR_PASSWORD is required');

  test('blocks submission and shows inline validation for missing required fields', async ({
    page,
  }) => {
    const uniqueSuffix = `${Date.now()}-${test.info().project.name}`;
    const attemptedTitle = `E2E-POST-003-title-${uniqueSuffix}`;
    const attemptedBody = `E2E-POST-003-body-${uniqueSuffix}`;

    // Step 1: Log in as authorUser (precondition via global-setup storageState)
    await page.goto('/dashboard/explore');
    await expect(page).toHaveURL(/\/dashboard\/explore/);

    // Step 2: Open the post composer
    await openPostComposer(page);
    const composer = page.getByTestId('post-composer');

    // Step 3: Attempt submit with empty title, body, and group
    await page.getByTestId('post-submit-button').click();

    await expect(page.getByTestId('post-title-error')).toBeVisible();
    await expect(page.getByTestId('post-title-error')).toHaveText('Title is required');
    await expect(page.getByTestId('post-body-error')).toBeVisible();
    await expect(page.getByTestId('post-body-error')).toHaveText('Post content is required');
    await expect(page.getByTestId('post-group-error')).toBeVisible();
    await expect(page.getByTestId('post-group-error')).toHaveText('Please select or create a group');
    await assertComposerRemainsOpen(page);

    // Step 4: Enter title and body but leave group unselected, then submit again
    await page.getByTestId('post-title-input').fill(attemptedTitle);
    await page.getByTestId('post-body-input').fill(attemptedBody);
    await page.getByTestId('post-submit-button').click();

    await expect(page.getByTestId('post-group-error')).toBeVisible();
    await expect(page.getByTestId('post-group-error')).toHaveText('Please select or create a group');
    await expect(page.getByTestId('post-title-error')).toHaveCount(0);
    await expect(page.getByTestId('post-body-error')).toHaveCount(0);
    await assertComposerRemainsOpen(page);

    // Step 5: Select group but leave body empty, then submit again
    await selectPostGroup(page);
    await page.getByTestId('post-body-input').fill('');
    await page.getByTestId('post-submit-button').click();

    await expect(page.getByTestId('post-body-error')).toBeVisible();
    await expect(page.getByTestId('post-body-error')).toHaveText('Post content is required');
    await expect(page.getByTestId('post-title-error')).toHaveCount(0);
    await expect(page.getByTestId('post-group-error')).toHaveCount(0);
    await assertComposerRemainsOpen(page);

    // Step 6: Clear title, enter body text, then submit again
    await page.getByTestId('post-title-input').fill('');
    await page.getByTestId('post-body-input').fill(attemptedBody);
    await page.getByTestId('post-submit-button').click();

    await expect(page.getByTestId('post-title-error')).toBeVisible();
    await expect(page.getByTestId('post-title-error')).toHaveText('Title is required');
    await expect(page.getByTestId('post-body-error')).toHaveCount(0);
    await expect(page.getByTestId('post-group-error')).toHaveCount(0);
    await assertComposerRemainsOpen(page);

    // Step 7: Confirm no post was created from any invalid submission attempt
    await composer.getByRole('button').first().click();
    await expect(composer).toBeHidden();
    await assertInvalidPostNotPublished(page, attemptedTitle);

    // Confirm no runtime error toast appears
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
  });
});
