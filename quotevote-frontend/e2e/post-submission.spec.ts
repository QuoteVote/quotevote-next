/**
 * E2E-POST-003 — Post Validation
 *
 * Sheet mapping:
 * - Feature Area: Post Submission
 * - Scenario: Post Validation
 * - Priority: P0
 * - Actor: Registered User (authorUser)
 * - Auth State: Logged in (precondition via global-setup storageState)
 * - Viewports: Desktop, Mobile (playwright.config.ts projects)
 *
 * Confirms required-field validation blocks submission, shows inline field errors
 * for title, body, and group, keeps the user in the composer, and never creates
 * an incomplete post.
 */
import { test, expect } from '@playwright/test';
import { AUTHOR_PASSWORD } from './helpers/auth';
import {
  assertComposerRemainsOpen,
  assertInvalidPostNotPublished,
  openPostComposer,
  selectPostGroup,
} from './helpers/post-composer';

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
