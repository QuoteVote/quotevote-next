/**
 * Directory cards on `/` should open the post detail page (#454).
 */
import { test, expect, type Page } from "@playwright/test";

const DIRECTORY_POSTS = [
  {
    __typename: "Post",
    _id: "feat-e2e-1",
    userId: "user-1",
    tagId: "general",
    title: "E2E Featured Post One",
    text: "First featured post body used for navigation regression coverage.",
    upvotes: 5,
    downvotes: 0,
    bookmarkedBy: [],
    created: new Date().toISOString(),
    url: "/post/general/e2e-featured-post-one/feat-e2e-1",
    citationUrl: null,
    attribution: null,
    rejectedBy: [],
    approvedBy: [],
    enable_voting: true,
    featuredSlot: null,
    creator: {
      __typename: "User",
      _id: "user-1",
      name: "Featured Author",
      username: "featured_author",
      avatar: null,
      contributorBadge: false,
    },
    votes: [],
    comments: [{ __typename: "Comment", _id: "c1" }],
    quotes: [],
    messageRoom: null,
  },
  {
    __typename: "Post",
    _id: "feat-e2e-2",
    userId: "user-2",
    tagId: "climate",
    title: "E2E Featured Post Two",
    text: "Second featured post body used for navigation regression coverage.",
    upvotes: 3,
    downvotes: 1,
    bookmarkedBy: [],
    created: new Date().toISOString(),
    url: "/post/climate/e2e-featured-post-two/feat-e2e-2",
    citationUrl: null,
    attribution: null,
    rejectedBy: [],
    approvedBy: [],
    enable_voting: true,
    featuredSlot: null,
    creator: {
      __typename: "User",
      _id: "user-2",
      name: "Second Author",
      username: "second_author",
      avatar: null,
      contributorBadge: false,
    },
    votes: [],
    comments: [],
    quotes: [{ __typename: "Quote", _id: "q1" }],
    messageRoom: null,
  },
] as const;

async function mockDirectoryPostsGraphQL(page: Page) {
  await page.route("**/graphql", async (route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.fallback();
      return;
    }

    let query = "";
    try {
      const payload = request.postDataJSON() as { query?: string } | null;
      query = payload?.query || "";
    } catch {
      await route.fallback();
      return;
    }

    if (!query.includes("topPosts")) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          posts: {
            __typename: "Posts",
            entities: DIRECTORY_POSTS,
            pagination: {
              __typename: "Pagination",
              total_count: DIRECTORY_POSTS.length,
              limit: 20,
              offset: 0,
            },
          },
        },
      }),
    });
  });
}

test.describe("RC1-004 Directory posts navigate to post detail", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await mockDirectoryPostsGraphQL(page);
  });

  test("clicking each directory card opens the corresponding post page", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");

    // The guest home's feed (updated landing page): one card per post, opened from its title.
    const cards = page.locator("#feed article");
    await expect(cards).toHaveCount(DIRECTORY_POSTS.length);

    // Phones show a compact card for the first post only, without the body.
    const shown = isMobile ? DIRECTORY_POSTS.slice(0, 1) : DIRECTORY_POSTS;
    for (const post of shown) {
      await page.goto("/");
      await expect(cards).toHaveCount(DIRECTORY_POSTS.length);

      const card = cards.filter({ hasText: post.title });
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      if (!isMobile) await expect(card).toContainText(post.text);
      await expect(card.getByRole("button", { name: "Show More" })).toHaveCount(0);

      await card.getByRole("link", { name: post.title }).click();
      await expect(page).toHaveURL((url) => url.pathname === post.url);

      await page.goBack();
      await expect(page).toHaveURL((url) => url.pathname === '/');
      await expect(cards.first()).toBeVisible();
    }
  });
});
