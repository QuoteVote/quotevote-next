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

interface GraphQLPayload<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function graphqlRequest<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${getApiUrl()}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as GraphQLPayload<T>;

  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}`);
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? 'GraphQL request failed');
  }

  if (!payload.data) {
    throw new Error('GraphQL response missing data');
  }

  return payload.data;
}

export async function deletePostViaApi(postId: string, token: string): Promise<void> {
  try {
    await graphqlRequest<{ deletePost?: { _id: string } }>(
      token,
      `
        mutation deletePost($postId: String!) {
          deletePost(postId: $postId) {
            _id
          }
        }
      `,
      { postId }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`deletePost cleanup warning: ${message}`);
  }
}

export async function findGroupIdByTitle(token: string, title: string): Promise<string> {
  const data = await graphqlRequest<{
    groups: Array<{ _id: string; title: string; privacy?: string | null }>;
  }>(
    token,
    `
      query groups($limit: Int!) {
        groups(limit: $limit) {
          _id
          title
          privacy
        }
      }
    `,
    { limit: 200 }
  );

  const match = data.groups.find(
    (group) => group.title.toLowerCase() === title.toLowerCase()
  );

  if (!match?._id) {
    throw new Error(`No group/tag found with title "${title}"`);
  }

  return match._id;
}

export async function createPostViaApi(
  token: string,
  input: {
    userId: string;
    groupId: string;
    title: string;
    text: string;
  }
): Promise<{ _id: string; url?: string | null }> {
  const data = await graphqlRequest<{
    addPost: { _id: string; url?: string | null };
  }>(
    token,
    `
      mutation addPost($post: PostInput!) {
        addPost(post: $post) {
          _id
          url
        }
      }
    `,
    {
      post: {
        userId: input.userId,
        groupId: input.groupId,
        title: input.title,
        text: input.text,
      },
    }
  );

  if (!data.addPost?._id) {
    throw new Error('addPost did not return a post id');
  }

  return data.addPost;
}

export interface SearchUserResult {
  _id: string;
  username: string;
  name?: string | null;
}

export async function searchUsersViaApi(
  token: string,
  query: string
): Promise<SearchUserResult[]> {
  const data = await graphqlRequest<{ searchUser: SearchUserResult[] }>(
    token,
    `
      query searchUsernames($query: String!) {
        searchUser(queryName: $query) {
          _id
          username
          name
        }
      }
    `,
    { query }
  );

  return data.searchUser ?? [];
}

export async function createMessageViaApi(
  token: string,
  message: {
    type: 'USER' | 'POST';
    text: string;
    title?: string | null;
    messageRoomId?: string | null;
    componentId?: string | null;
  }
): Promise<{ _id: string; messageRoomId: string; text: string }> {
  const data = await graphqlRequest<{
    createMessage: { _id: string; messageRoomId: string; text: string };
  }>(
    token,
    `
      mutation chat($message: MessageInput!) {
        createMessage(message: $message) {
          _id
          messageRoomId
          text
        }
      }
    `,
    { message }
  );

  if (!data.createMessage?._id || !data.createMessage.messageRoomId) {
    throw new Error('createMessage did not return message/room ids');
  }

  return data.createMessage;
}
