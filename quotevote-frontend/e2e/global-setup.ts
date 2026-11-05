import fs from 'fs';
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  AUTHOR_PASSWORD,
  AUTHOR_USERNAME,
} from './helpers/auth';
import { getApiUrl, loginViaApi } from './helpers/api';
import {
  ADMIN_STORAGE_PATH,
  saveAuthorStorageState,
  saveStorageState,
} from './helpers/storage-state';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

async function saveAdminSession(): Promise<void> {
  // A stale admin session from an earlier run must not stand in for a missing account.
  fs.rmSync(ADMIN_STORAGE_PATH, { force: true });

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.warn('[e2e] E2E_ADMIN_USERNAME/PASSWORD are not set. Admin specs will be skipped.');
    return;
  }

  const session = await loginViaApi(ADMIN_USERNAME, ADMIN_PASSWORD);
  if (!session.user.admin) {
    throw new Error(`[e2e] "${ADMIN_USERNAME}" is not an admin on ${getApiUrl()}`);
  }
  await saveStorageState(ADMIN_STORAGE_PATH, baseURL, session);
  console.log(`[e2e] admin session saved; API: ${getApiUrl()}`);
}

export default async function globalSetup(): Promise<void> {
  await saveAdminSession();

  if (!AUTHOR_PASSWORD) {
    console.warn(
      '[e2e] E2E_AUTHOR_PASSWORD is not set. Post submission tests will fail until credentials are configured.'
    );
    return;
  }

  try {
    const session = await loginViaApi(AUTHOR_USERNAME, AUTHOR_PASSWORD);
    await saveAuthorStorageState(baseURL, session);
    console.log(`[e2e] authorUser session saved; API: ${getApiUrl()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[e2e] Unable to authenticate "${AUTHOR_USERNAME}" against ${getApiUrl()}: ${message}. ` +
        'Seed the author on local backends with `pnpm seed:e2e-author` in quotevote-backend, or provide valid credentials.'
    );
  }
}
