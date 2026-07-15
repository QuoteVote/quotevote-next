import { expect, type Page } from '@playwright/test';

export const PUBLIC_TAG_NAME =
  process.env.E2E_PUBLIC_TAG_NAME ?? process.env.E2E_PUBLIC_GROUP_NAME ?? 'Public';

/** @deprecated Use selectPostTag */
export const PUBLIC_GROUP_NAME = PUBLIC_TAG_NAME;

export async function openPostComposer(page: Page): Promise<void> {
  const createButton = page.getByTestId('create-post-button').locator('visible=true');
  await createButton.click();

  const composer = page.getByTestId('post-composer');
  await expect(composer).toBeVisible();
}

export async function selectPostTag(page: Page, tagName = PUBLIC_TAG_NAME): Promise<void> {
  await page.getByTestId('post-tag-select').click();
  await page.getByPlaceholder('Search or type new tag name...').fill(tagName);
  await page.getByRole('button', { name: tagName, exact: true }).click();
}

/** @deprecated Use selectPostTag */
export const selectPostGroup = selectPostTag;

export async function assertComposerRemainsOpen(page: Page): Promise<void> {
  await expect(page.getByTestId('post-composer')).toBeVisible();
  await expect(page).not.toHaveURL(/\/dashboard\/post\/[^/]+\/[^/]+\/[^/?#]+/);
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toHaveCount(0);
}

export async function assertPostTitleNotVisibleOnPage(
  page: Page,
  titleMarker: string
): Promise<void> {
  await expect(page.locator(`[data-post-title="${titleMarker}"]`)).toHaveCount(0);
}

export async function assertInvalidPostNotPublished(
  page: Page,
  titleMarker: string,
  tagName = PUBLIC_TAG_NAME
): Promise<void> {
  const surfaces = [
    '/dashboard/explore',
    '/dashboard/post',
    '/dashboard/profile',
    `/dashboard/explore?q=${encodeURIComponent(tagName)}`,
  ];

  for (const path of surfaces) {
    await page.goto(path);
    await assertPostTitleNotVisibleOnPage(page, titleMarker);
  }
}
