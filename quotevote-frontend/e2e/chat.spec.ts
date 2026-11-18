/**
 * E2E-CHAT-008: Chat Search
 *
 * Actor: Registered User (authorUser)
 * Auth State: Logged in (storageState from global setup)
 * Viewports: Desktop, Mobile (playwright.config.ts projects)
 *
 * Covers Messages search after #531: plain keywords, @person, #tag,
 * empty state, and opening a result. Uses real API seed data — no login
 * or GraphQL mocks.
 *
 * @person requires E2E_PEER_USERNAME (a dedicated second account). When unset,
 * that step is skipped so keyword/#tag coverage still runs.
 */
import { test, expect } from '@playwright/test';
import {
  createMessageViaApi,
  createPostViaApi,
  deleteMessageViaApi,
  deletePostViaApi,
  findTagIdByTitle,
  findUserByUsernameViaApi,
  loginViaApi,
  type SearchUserResult,
} from './helpers/api';
import { AUTHOR_PASSWORD, AUTHOR_USERNAME, PEER_USERNAME } from './helpers/auth';
import { atHandleFromPerson, openMessagesPanel, selectMessagesTab } from './helpers/chat';
import { PUBLIC_TAG_NAME } from './helpers/post-composer';
import { tagToken } from '../src/lib/utils/conversationSearch';

test.describe('E2E-CHAT-008: Chat Search', () => {
  test.skip(!AUTHOR_PASSWORD, 'E2E_AUTHOR_PASSWORD is required');

  let authToken: string;
  let authorUserId: string;
  let createdPostId: string | null = null;
  let dmMessageId: string | null = null;
  let postTitle: string;
  let messageKeyword: string;
  let otherUser: SearchUserResult | null = null;
  let atQuery: string | null = null;
  let tagQuery: string;

  test.beforeAll(async () => {
    const session = await loginViaApi(AUTHOR_USERNAME, AUTHOR_PASSWORD);
    authToken = session.token;
    authorUserId = session.user._id;

    const unique = `chat008-${Date.now()}`;
    postTitle = `E2E-CHAT-008 Discussion ${unique}`;
    messageKeyword = `solarpanels${unique.replace(/[^a-z0-9]/gi, '')}`;
    tagQuery = `#${tagToken(PUBLIC_TAG_NAME)}`;

    if (PEER_USERNAME) {
      const peer = await findUserByUsernameViaApi(authToken, PEER_USERNAME);
      if (peer._id === authorUserId) {
        throw new Error('E2E_PEER_USERNAME must be a different account than E2E_AUTHOR_USERNAME');
      }
      otherUser = peer;
      atQuery = atHandleFromPerson(peer);

      const dm = await createMessageViaApi(authToken, {
        type: 'USER',
        componentId: peer._id,
        title: peer.name || peer.username,
        text: `E2E DM ping ${unique}`,
      });
      dmMessageId = dm._id;
    }

    const tagId = await findTagIdByTitle(authToken, PUBLIC_TAG_NAME);
    const post = await createPostViaApi(authToken, {
      userId: authorUserId,
      tagId,
      title: postTitle,
      text: `Discussion body for chat search ${unique}.`,
    });
    createdPostId = post._id;

    await createMessageViaApi(authToken, {
      type: 'POST',
      componentId: post._id,
      title: postTitle,
      text: `I found a package about ${messageKeyword} that might help.`,
    });
  });

  test.afterAll(async () => {
    if (dmMessageId && authToken) {
      await deleteMessageViaApi(dmMessageId, authToken);
      dmMessageId = null;
    }
    if (createdPostId && authToken) {
      await deletePostViaApi(createdPostId, authToken);
      createdPostId = null;
    }
  });

  test('searches discussions by @person, keyword, and #tag', async ({ page, isMobile }) => {
    await page.goto('/');
    await expect(page).toHaveURL((url) => url.pathname === '/');

    await openMessagesPanel(page, isMobile);

    const chatPage = page.getByTestId('chat-page').locator('visible=true');
    const searchInput = chatPage.getByTestId('chat-search-input');
    await expect(searchInput).toBeVisible();

    // @person — Chats tab (requires E2E_PEER_USERNAME)
    if (otherUser && atQuery) {
      await selectMessagesTab(page, 'Chats');
      await searchInput.fill(atQuery);

      const peerLabel = otherUser.name || otherUser.username;
      await expect(
        chatPage.getByTestId('chat-search-result').filter({ hasText: peerLabel }).first()
      ).toBeVisible({ timeout: 30_000 });

      await chatPage.getByRole('button', { name: /clear search/i }).click();
      await expect(searchInput).toHaveValue('');
    }

    // Keyword from a discussion message — Discussions tab
    await selectMessagesTab(page, 'Discussions');
    await expect(chatPage.getByTestId('discussion-list')).toBeVisible({ timeout: 30_000 });

    await searchInput.fill(messageKeyword);
    const keywordResults = chatPage.getByTestId('chat-search-result');
    await expect(keywordResults.filter({ hasText: postTitle }).first()).toBeVisible({
      timeout: 30_000,
    });

    // #tag — seeded post uses E2E_PUBLIC_TAG_NAME
    await searchInput.fill(tagQuery);
    await expect(
      chatPage.getByTestId('chat-search-result').filter({ hasText: postTitle }).first()
    ).toBeVisible({ timeout: 30_000 });

    // Empty state
    await searchInput.fill('zzznomatchchat008xyz');
    await expect(chatPage.getByTestId('chat-search-result')).toHaveCount(0);
    const emptyState = chatPage.getByTestId('chat-empty-search-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/no discussions match/i);

    // Open a keyword result and confirm the conversation header (not just the list subtitle)
    await searchInput.fill(messageKeyword);
    await expect(
      chatPage.getByTestId('chat-search-result').filter({ hasText: postTitle }).first()
    ).toBeVisible({ timeout: 30_000 });

    await chatPage
      .getByTestId('discussion-thread')
      .filter({ hasText: postTitle })
      .first()
      .click();

    await expect(chatPage.getByRole('link', { name: `View post: ${postTitle}` })).toBeVisible({
      timeout: 30_000,
    });
    await expect(chatPage.getByText(messageKeyword, { exact: false }).first()).toBeVisible();
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
  });
});
