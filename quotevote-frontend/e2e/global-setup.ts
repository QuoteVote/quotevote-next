import {
  AUTHOR_PASSWORD,
  AUTHOR_USERNAME,
} from './helpers/auth';
import { getApiUrl, loginViaApi } from './helpers/api';
import { saveAuthorStorageState } from './helpers/storage-state';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default async function globalSetup(): Promise<void> {
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
