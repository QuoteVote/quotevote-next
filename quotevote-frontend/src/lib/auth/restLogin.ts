/**
 * REST login against hosted (/login) or migrated local backend (/auth/login).
 */

export interface LoginApiResponse {
  accessToken?: string;
  token?: string;
  message?: string;
  user?: {
    _id: string;
    username: string;
    name?: string;
    email?: string;
    admin?: boolean;
    accountStatus?: string;
    avatar?: string | Record<string, unknown> | null;
    bio?: string;
  };
}

const LOGIN_PATHS = ['/login', '/auth/login'] as const;

export function getLoginToken(data: LoginApiResponse): string | undefined {
  return data.accessToken ?? data.token;
}

export async function postLogin(
  serverUrl: string,
  username: string,
  password: string
): Promise<{ response: Response; data: LoginApiResponse }> {
  const baseUrl = serverUrl.replace(/\/$/, '');
  const body = JSON.stringify({ username, password });
  const headers = { 'Content-Type': 'application/json' };

  let lastResponse: Response | null = null;
  let lastData: LoginApiResponse = {};

  for (const path of LOGIN_PATHS) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body,
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      lastResponse = response;
      continue;
    }

    const data = (await response.json()) as LoginApiResponse;
    lastResponse = response;
    lastData = data;

    if (response.ok) {
      return { response, data };
    }

    // Valid endpoint but rejected credentials — do not fall through to another path.
    if (response.status === 401 || response.status === 403) {
      return { response, data };
    }
  }

  if (!lastResponse) {
    throw new Error('Login request failed: no auth endpoint responded with JSON');
  }

  return { response: lastResponse, data: lastData };
}
