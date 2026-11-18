import type { Page } from '@playwright/test';

export const AUTHOR_USERNAME = (process.env.E2E_AUTHOR_USERNAME ?? 'authorUser').trim();
export const AUTHOR_PASSWORD = process.env.E2E_AUTHOR_PASSWORD ?? '';

/** Optional admin account for the invite review specs (E2E-AUTH-010). */
export const ADMIN_USERNAME = (process.env.E2E_ADMIN_USERNAME ?? '').trim();
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';

/** Optional second account for @person DM search (E2E-CHAT-008). */
export const PEER_USERNAME = (process.env.E2E_PEER_USERNAME ?? '').trim();

export async function loginAsAuthorUser(page: Page): Promise<void> {
  if (!AUTHOR_PASSWORD) {
    throw new Error(
      'E2E_AUTHOR_PASSWORD is required. Copy .env.e2e.example to .env.e2e.local and set credentials.'
    );
  }

  await page.goto('/auths/login');
  await page.locator('#email').fill(AUTHOR_USERNAME);
  await page.locator('#password').fill(AUTHOR_PASSWORD);
  await page.locator('#tos').click();
  await page.locator('#coc').click();

  const loginButton = page.getByRole('button', { name: /^login$/i });
  await loginButton.click();

  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '', { timeout: 30_000 });
}
