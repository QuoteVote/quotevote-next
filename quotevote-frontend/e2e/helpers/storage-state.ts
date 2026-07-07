import fs from 'fs';
import path from 'path';
import type { FullConfig } from '@playwright/test';
import type { AuthSession } from './api';

export const AUTHOR_STORAGE_PATH = path.join(__dirname, '../.auth/authorUser.json');

interface PlaywrightStorageState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

function buildStorageState(baseURL: string, session: AuthSession): PlaywrightStorageState {
  const url = new URL(baseURL);

  return {
    cookies: [
      {
        name: 'qv-token',
        value: session.token,
        domain: url.hostname,
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: url.protocol === 'https:',
        sameSite: 'Lax',
      },
    ],
    origins: [
      {
        origin: url.origin,
        localStorage: [
          { name: 'token', value: session.token },
          {
            name: 'qv-store',
            value: JSON.stringify({
              state: {
                user: {
                  data: session.user,
                  loading: false,
                  loginError: null,
                },
              },
              version: 0,
            }),
          },
        ],
      },
    ],
  };
}

export async function saveAuthorStorageState(
  baseURL: string,
  session: AuthSession
): Promise<void> {
  fs.mkdirSync(path.dirname(AUTHOR_STORAGE_PATH), { recursive: true });
  fs.writeFileSync(
    AUTHOR_STORAGE_PATH,
    JSON.stringify(buildStorageState(baseURL, session), null, 2),
    'utf8'
  );
}

export function authorStorageStatePath(config?: FullConfig): string | undefined {
  const baseURL = config?.projects[0]?.use?.baseURL ?? process.env.PLAYWRIGHT_BASE_URL;
  if (!fs.existsSync(AUTHOR_STORAGE_PATH) || !baseURL) {
    return undefined;
  }
  return AUTHOR_STORAGE_PATH;
}
