import { test, expect } from '@playwright/test';

test.describe('E2E-CHAT-008 Chat Search', () => {
  test.beforeEach(async ({ page }) => {
    // Forward browser console logs to the test terminal for easier debugging
    page.on('console', (msg) => {
      console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    // 1. Mock REST login endpoints
    await page.route('**/login', async (route) => {
      const request = route.request();
      if (request.method() !== 'POST') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token-12345',
          user: {
            _id: 'user-current',
            username: 'current_user',
            name: 'Current User',
            email: 'current@example.com',
            admin: false,
            accountStatus: 'active',
          },
        }),
      });
    });

    await page.route('**/auth/login', async (route) => {
      const request = route.request();
      if (request.method() !== 'POST') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-jwt-token-12345',
          refreshToken: 'mock-refresh-token',
          user: {
            _id: 'user-current',
            username: 'current_user',
            name: 'Current User',
            email: 'current@example.com',
            admin: false,
            accountStatus: 'active',
          },
        }),
      });
    });

    // 2. Mock GraphQL endpoint
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      if (request.method() !== 'POST') {
        return route.continue();
      }

      const payload = request.postDataJSON();
      const query = payload?.query || '';

      if (query.includes('getChatRooms')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              messageRooms: [
                {
                  __typename: 'MessageRoom',
                  _id: 'room-dm-1',
                  title: 'authorUser',
                  messageType: 'USER',
                  users: ['user-author', 'user-current'],
                  avatar: null,
                  created: new Date(Date.now() - 1000 * 60).toISOString(),
                  lastMessageTime: new Date(Date.now() - 1000 * 60).toISOString(),
                  lastActivity: new Date(Date.now() - 1000 * 60).toISOString(),
                  unreadMessages: 0,
                  postDetails: null,
                },
                {
                  __typename: 'MessageRoom',
                  _id: 'room-dm-2',
                  title: 'john_doe',
                  messageType: 'USER',
                  users: ['user-john', 'user-current'],
                  avatar: null,
                  created: new Date(Date.now() - 1000 * 120).toISOString(),
                  lastMessageTime: new Date(Date.now() - 1000 * 120).toISOString(),
                  lastActivity: new Date(Date.now() - 1000 * 120).toISOString(),
                  unreadMessages: 0,
                  postDetails: null,
                },
                {
                  __typename: 'MessageRoom',
                  _id: 'room-group-1',
                  title: 'Next.js Migration Discussions',
                  messageType: 'POST',
                  users: ['user-author', 'user-current', 'user-john'],
                  avatar: null,
                  created: new Date(Date.now() - 1000 * 180).toISOString(),
                  lastMessageTime: new Date(Date.now() - 1000 * 180).toISOString(),
                  lastActivity: new Date(Date.now() - 1000 * 180).toISOString(),
                  unreadMessages: 0,
                  postDetails: {
                    __typename: 'Post',
                    _id: 'post-1',
                    title: 'Next.js Migration Discussions',
                    text: 'We are migrating from React 17/Vite to Next.js 16. Let\'s discuss solar panels and green energy.',
                  },
                },
              ],
            },
          }),
        });
      } else if (query.includes('getRoomMessages')) {
        const roomId = payload.variables?.messageRoomId;
        let messages = [];

        if (roomId === 'room-dm-1') {
          messages = [
            {
              __typename: 'Message',
              _id: 'msg-1',
              messageRoomId: 'room-dm-1',
              userId: 'user-author',
              userName: 'authorUser',
              title: null,
              text: 'Hey, did you search the discussion history?',
              created: new Date(Date.now() - 1000 * 30).toISOString(),
              type: 'user',
              readBy: [],
              user: {
                __typename: 'User',
                _id: 'user-author',
                username: 'authorUser',
                name: 'Author User',
                avatar: null,
              },
            },
          ];
        } else if (roomId === 'room-group-1') {
          messages = [
            {
              __typename: 'Message',
              _id: 'msg-2',
              messageRoomId: 'room-group-1',
              userId: 'user-john',
              userName: 'john_doe',
              title: null,
              text: 'I found a package that might be useful.',
              created: new Date(Date.now() - 1000 * 60).toISOString(),
              type: 'user',
              readBy: [],
              user: {
                __typename: 'User',
                _id: 'user-john',
                username: 'john_doe',
                name: 'John Doe',
                avatar: null,
              },
            },
          ];
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              messages,
            },
          }),
        });
      } else if (query.includes('messageReactions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              messageReactions: [],
            },
          }),
        });
      } else if (query.includes('getRoster') || query.includes('buddyList')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              getRoster: [],
              buddyList: [],
            },
          }),
        });
      } else if (query.includes('featuredPosts')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              featuredPosts: {
                __typename: 'Posts',
                entities: [],
                pagination: {
                  __typename: 'Pagination',
                  total_count: 0,
                  limit: 10,
                  offset: 0,
                },
              },
            },
          }),
        });
      } else if (query.includes('getNotifications')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              notifications: [],
            },
          }),
        });
      } else if (query.includes('posts')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              posts: {
                __typename: 'Posts',
                entities: [],
                pagination: {
                  __typename: 'Pagination',
                  total_count: 0,
                  limit: 10,
                  offset: 0,
                },
              },
            },
          }),
        });
      } else if (/\bme\b/.test(query) || /\bgetCurrentUser\b/.test(query)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              me: {
                __typename: 'User',
                _id: 'user-current',
                username: 'current_user',
                name: 'Current User',
                email: 'current@example.com',
                avatar: null,
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should login and search discussions by username and keyword', async ({ page, isMobile }) => {
    test.setTimeout(180_000);
    // Set viewport size to ensure xl breakpoint is matched on desktop
    if (!isMobile) {
      console.log('TEST PROGRESS: Setting viewport size to 1440x900');
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    // 1. Log in as authorUser
    console.log('TEST PROGRESS: Navigating to login page');
    await page.goto('/auths/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for hydration to complete
    console.log('TEST PROGRESS: Waiting for hydration');
    await page.waitForTimeout(1000);
    
    // Fill credentials
    console.log('TEST PROGRESS: Filling credentials');
    await page.getByPlaceholder('Email/Username').fill('authorUser');
    await page.getByPlaceholder('Password').fill('password123');

    // Accept ToS and CoC
    console.log('TEST PROGRESS: Checking ToS and CoC checkboxes');
    await page.click('#tos');
    await page.click('#coc');

    // Verify submit button is enabled
    console.log('TEST PROGRESS: Verifying submit button is enabled');
    const submitBtn = page.getByRole('button', { name: 'Log in' });
    await expect(submitBtn).toBeEnabled();

    // Click submit and wait for navigation
    console.log('TEST PROGRESS: Clicking submit and waiting for /dashboard/explore');
    await submitBtn.click({ force: true });
    try {
      await page.waitForURL('**/dashboard/explore', { timeout: 15000 });
    } catch (e) {
      console.log('TEST PROGRESS: Navigation to /dashboard/explore timed out!');
      console.log('Current URL:', page.url());
      const bodyText = await page.innerText('body');
      console.log('Body Text:', bodyText);
      throw e;
    }

    // 2. Open chat area on mobile (already open in aside for desktop)
    if (isMobile) {
      console.log('TEST PROGRESS: Mobile navigation to Messages');
      await expect(page.locator('[data-testid="chat-page"]').filter({ visible: true })).toHaveCount(0);
      // Click Account/profile menu button in mobile bottom nav
      await page.locator('button[aria-label="Account menu"]').filter({ visible: true }).click({ force: true });
      // Click "Messages" option in the dropdown menu
      await page.locator('[role="menuitem"]:has-text("Messages")').click({ force: true });
    }

    // Verify chat page loads
    console.log('TEST PROGRESS: Waiting for chat page to be visible');
    const chatPage = page.locator('[data-testid="chat-page"]').filter({ visible: true });
    await expect(chatPage).toBeVisible();

    // Verify discussions list and search input are visible
    console.log('TEST PROGRESS: Verifying search input and discussion list visibility');
    const chatSearchInput = chatPage.locator('[data-testid="chat-search-input"]');
    await expect(chatSearchInput).toBeVisible();
    await expect(chatPage.locator('[data-testid="discussion-list"]')).toBeVisible();

    // 3. Search discussions by Username (authorUser)
    console.log('TEST PROGRESS: Searching for username authorUser');
    await chatSearchInput.fill('authorUser');

    // Verify only matching result is displayed
    console.log('TEST PROGRESS: Verifying search results count is 1');
    const searchResults = chatPage.locator('[data-testid="chat-search-result"]');
    await expect(searchResults).toHaveCount(1);
    await expect(searchResults.first()).toContainText('authorUser');
    await expect(chatPage.locator('text=john_doe')).not.toBeVisible();

    // 4. Clear search query
    console.log('TEST PROGRESS: Clearing search query');
    const clearBtn = chatPage.locator('button[aria-label="clear search"]');
    if (await clearBtn.isVisible()) {
      await clearBtn.dispatchEvent('click');
    } else {
      await chatSearchInput.fill('');
    }
    // Verify all 2 chats in the 'chats' tab are shown again (authorUser and john_doe)
    console.log('TEST PROGRESS: Verifying 2 chats are shown after clear');
    await expect(chatPage.locator('[data-testid="discussion-thread"]')).toHaveCount(2);

    console.log('TEST PROGRESS: Switching to Groups tab');
    await chatPage.locator('button:has-text("Discussions")').first().dispatchEvent('click');

    console.log('TEST PROGRESS: Searching for solar');
    await chatSearchInput.fill('solar');
    
    // Verify matching group is displayed
    console.log('TEST PROGRESS: Verifying group search result count is 1');
    await expect(searchResults).toHaveCount(1);
    await expect(searchResults.first()).toContainText('Next.js Migration Discussions');

    // 6. Search for keyword that matches nothing
    console.log('TEST PROGRESS: Searching for nonexistent keyword');
    await chatSearchInput.fill('nonexistentkeyword');
    await expect(searchResults).toHaveCount(0);
    
    // Verify empty state is displayed clearly
    console.log('TEST PROGRESS: Verifying empty search state');
    const emptyState = chatPage.locator('[data-testid="chat-empty-search-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/no groups found/i);

    // 7. Clear search and open a result
    console.log('TEST PROGRESS: Clearing search query again');
    if (await clearBtn.isVisible()) {
      await clearBtn.dispatchEvent('click');
    } else {
      await chatSearchInput.fill('');
    }

    // Click on the group discussion thread
    console.log('TEST PROGRESS: Clicking on group discussion thread');
    const thread = chatPage.locator('[data-testid="discussion-thread"]:has-text("Next.js Migration Discussions")').first();
    await thread.dispatchEvent('click');
    await page.waitForTimeout(500);

    // Confirm user is taken to the correct discussion context by checking message visibility
    console.log('TEST PROGRESS: Verifying discussion message visibility');
    const message = page.locator('text=I found a package that might be useful.').filter({ visible: true });
    await expect(message).toBeVisible();
  });
});
