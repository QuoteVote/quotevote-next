import { getLoginToken, postLogin } from '../../src/lib/auth/restLogin';

/**
 * Route pattern for mocking GraphQL in specs. It matches whichever backend the
 * frontend under test calls, so mocks work against any local or test API.
 */
export const GRAPHQL_ROUTE = '**/graphql';

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

interface GraphQLPayload<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/** GraphQL POST against the E2E API. Pass `token` when the operation needs auth. */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiUrl()}/graphql`, {
    method: 'POST',
    headers,
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
      `
        mutation deletePost($postId: String!) {
          deletePost(postId: $postId) {
            _id
          }
        }
      `,
      { postId },
      token
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`deletePost cleanup warning: ${message}`);
  }
}

export async function findTagIdByTitle(token: string, title: string): Promise<string> {
  // No limit: the new backend reads `limit: 0` as none, and the composer asks the same way.
  const data = await graphqlRequest<{
    tags: Array<{ _id: string; title: string; privacy?: string | null }>;
  }>(
    `
      query tags {
        tags {
          _id
          title
          privacy
        }
      }
    `,
    undefined,
    token
  );

  const match = data.tags.find((tag) => tag.title.toLowerCase() === title.toLowerCase());

  if (!match?._id) {
    throw new Error(`No tag found with title "${title}"`);
  }

  return match._id;
}

export async function createPostViaApi(
  token: string,
  input: {
    userId: string;
    tagId: string;
    title: string;
    text: string;
  }
): Promise<{ _id: string; url?: string | null }> {
  const data = await graphqlRequest<{
    addPost: { _id: string; url?: string | null };
  }>(
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
        tagId: input.tagId,
        title: input.title,
        text: input.text,
      },
    },
    token
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
    `
      query searchUsernames($query: String!) {
        searchUser(queryName: $query) {
          _id
          username
          name
        }
      }
    `,
    { query },
    token
  );

  return data.searchUser ?? [];
}

export async function findUserByUsernameViaApi(
  token: string,
  username: string
): Promise<SearchUserResult> {
  const trimmed = username.trim();
  const candidates = await searchUsersViaApi(token, trimmed);
  const match = candidates.find(
    (user) => user.username.toLowerCase() === trimmed.toLowerCase()
  );

  if (!match) {
    throw new Error(`No user found with username "${trimmed}"`);
  }

  return match;
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
    `
      mutation chat($message: MessageInput!) {
        createMessage(message: $message) {
          _id
          messageRoomId
          text
        }
      }
    `,
    { message },
    token
  );

  if (!data.createMessage?._id || !data.createMessage.messageRoomId) {
    throw new Error('createMessage did not return message/room ids');
  }

  return data.createMessage;
}

export async function deleteMessageViaApi(messageId: string, token: string): Promise<void> {
  try {
    await graphqlRequest<{ deleteMessage?: { _id: string } }>(
      `
        mutation deleteMessage($messageId: String!) {
          deleteMessage(messageId: $messageId) {
            _id
          }
        }
      `,
      { messageId },
      token
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`deleteMessage cleanup warning: ${message}`);
  }
}

/** #498 — password reset email (public mutation). */
export async function sendPasswordResetEmailViaApi(email: string): Promise<boolean> {
  const data = await graphqlRequest<{ sendPasswordResetEmail: boolean }>(
    `
      mutation sendPasswordResetEmail($email: String!) {
        sendPasswordResetEmail(email: $email)
      }
    `,
    { email }
  );
  return data.sendPasswordResetEmail === true;
}

/** #498 — guest access request; returns the pending user id. */
export async function requestUserAccessViaApi(
  email: string
): Promise<{ _id: string; email: string }> {
  const data = await graphqlRequest<{
    requestUserAccess: { _id: string; email: string };
  }>(
    `
      mutation requestUserAccess($requestUserAccessInput: RequestUserAccessInput!) {
        requestUserAccess(requestUserAccessInput: $requestUserAccessInput) {
          _id
          email
        }
      }
    `,
    { requestUserAccessInput: { email } }
  );

  if (!data.requestUserAccess?._id) {
    throw new Error('requestUserAccess did not return a user id');
  }
  return data.requestUserAccess;
}

/** #498 — admin approve / resend / decline (`inviteStatus` "4" | "2" | "1"). */
export async function sendUserInviteApprovalViaApi(
  token: string,
  userId: string,
  inviteStatus: string
): Promise<{ code?: string; message?: string }> {
  const data = await graphqlRequest<{
    sendUserInviteApproval: { code?: string; message?: string } | null;
  }>(
    `
      mutation sendUserInviteApproval($userId: String!, $inviteStatus: String!) {
        sendUserInviteApproval(userId: $userId, inviteStatus: $inviteStatus)
      }
    `,
    { userId, inviteStatus },
    token
  );

  const result = data.sendUserInviteApproval;
  if (!result) {
    throw new Error('sendUserInviteApproval returned an empty result');
  }
  return result;
}

/** A member invites someone by email (#672); the invite email carries the signup link (#697). */
export async function sendUserInviteViaApi(
  token: string,
  email: string
): Promise<{ code?: string; message?: string }> {
  const data = await graphqlRequest<{
    sendUserInvite: { code?: string; message?: string } | null;
  }>(
    `
      mutation sendUserInvite($email: String!) {
        sendUserInvite(email: $email)
      }
    `,
    { email },
    token
  );

  const result = data.sendUserInvite;
  if (!result) {
    throw new Error('sendUserInvite returned an empty result');
  }
  return result;
}
