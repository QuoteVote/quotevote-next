import { expect, type Page } from '@playwright/test';

export const PUBLIC_GROUP_NAME = process.env.E2E_PUBLIC_GROUP_NAME ?? 'Public';

export async function openPostComposer(page: Page): Promise<void> {
  const createButton = page.getByTestId('create-post-button').locator('visible=true');
  await createButton.click();

  const composer = page.getByTestId('post-composer');
  await expect(composer).toBeVisible();
}

export async function selectPostGroup(page: Page, groupName = PUBLIC_GROUP_NAME): Promise<void> {
  await page.getByTestId('post-group-select').click();
  await page.getByPlaceholder('Search or type new group name...').fill(groupName);
  await page.getByRole('button', { name: groupName, exact: true }).click();
}

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
  groupName = PUBLIC_GROUP_NAME
): Promise<void> {
  const surfaces = [
    '/dashboard/explore',
    '/dashboard/post',
    '/dashboard/profile',
    `/dashboard/explore?q=${encodeURIComponent(groupName)}`,
  ];

  for (const path of surfaces) {
    await page.goto(path);
    await assertPostTitleNotVisibleOnPage(page, titleMarker);
  }
}
