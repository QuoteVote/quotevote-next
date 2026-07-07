import { getLoginToken, postLogin } from '../../src/lib/auth/restLogin';

const DEFAULT_API_URL = 'http://localhost:4000';

export function getApiUrl(): string {
  const graphqlEndpoint =
    process.env.E2E_GRAPHQL_ENDPOINT ??
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ??
    'https://api.quote.vote/graphql';

  if (process.env.E2E_API_URL) {
    return process.env.E2E_API_URL.replace(/\/$/, '');
  }

  if (graphqlEndpoint.includes('/graphql')) {
    return graphqlEndpoint.replace(/\/graphql\/?$/, '');
  }

  return DEFAULT_API_URL;
}

export interface AuthSession {
  token: string;
  user: {
    _id: string;
    username: string;
    name?: string;
    email?: string;
    admin?: boolean;
  };
}

export async function loginViaApi(
  username: string,
  password: string
): Promise<AuthSession> {
  const trimmedUsername = username.trim();
  const { response, data } = await postLogin(getApiUrl(), trimmedUsername, password);

  if (!response.ok) {
    throw new Error(data.message ?? `Login failed with status ${response.status}`);
  }

  const token = getLoginToken(data);
  if (!token || !data.user?._id) {
    throw new Error('Login response missing token or user');
  }

  return { token, user: data.user as AuthSession['user'] };
}

export async function registerAuthorUser(input: {
  username: string;
  password: string;
  name: string;
  email: string;
}): Promise<void> {
  const baseUrl = getApiUrl();
  const paths = ['/auth/register', '/register'];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (response.status === 409) {
      return;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      continue;
    }

    if (response.ok) {
      return;
    }

    const data = (await response.json()) as { error_message?: string; message?: string };
    throw new Error(
      data.error_message ?? data.message ?? `Registration failed with status ${response.status}`
    );
  }

  throw new Error('Registration failed: no register endpoint responded with JSON');
}

export async function deletePostViaApi(postId: string, token: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation deletePost($postId: String!) {
          deletePost(postId: $postId) {
            _id
          }
        }
      `,
      variables: { postId },
    }),
  });

  if (!response.ok) {
    return;
  }

  const payload = (await response.json()) as {
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    console.warn(`deletePost cleanup warning: ${payload.errors[0]?.message}`);
  }
}
