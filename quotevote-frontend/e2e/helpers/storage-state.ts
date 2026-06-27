import fs from 'fs';
import path from 'path';
import { chromium, type FullConfig } from '@playwright/test';
import type { AuthSession } from './api';

export const AUTHOR_STORAGE_PATH = path.join(__dirname, '../.auth/authorUser.json');

export async function saveAuthorStorageState(
  baseURL: string,
  session: AuthSession
): Promise<void> {
  fs.mkdirSync(path.dirname(AUTHOR_STORAGE_PATH), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto('/');

  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('token', token);
      document.cookie = `qv-token=${token}; path=/; SameSite=Lax`;
      localStorage.setItem(
        'qv-store',
        JSON.stringify({
          state: {
            user: {
              data: user,
              loading: false,
              loginError: null,
            },
          },
          version: 0,
        })
      );
    },
    { token: session.token, user: session.user }
  );

  await context.storageState({ path: AUTHOR_STORAGE_PATH });
  await browser.close();
}

export function authorStorageStatePath(config?: FullConfig): string | undefined {
  const baseURL = config?.projects[0]?.use?.baseURL ?? process.env.PLAYWRIGHT_BASE_URL;
  if (!fs.existsSync(AUTHOR_STORAGE_PATH) || !baseURL) {
    return undefined;
  }
  return AUTHOR_STORAGE_PATH;
}
