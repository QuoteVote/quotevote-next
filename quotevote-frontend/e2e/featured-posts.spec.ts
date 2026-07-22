/**
 * RC1-004 — Featured posts should navigate to post detail page
 *
 * Clicking a featured post card on the homepage should open the
 * corresponding post detail route.
 */
import { test, expect, type Page } from "@playwright/test";

const FEATURED_POSTS = [
  {
    __typename: "Post",
    _id: "feat-e2e-1",
    userId: "user-1",
    groupId: "general",
    title: "E2E Featured Post One",
    text: "First featured post body used for navigation regression coverage.",
    upvotes: 5,
    downvotes: 0,
    bookmarkedBy: [],
    created: new Date().toISOString(),
    url: "/post/general/e2e-featured-post-one/feat-e2e-1",
    citationUrl: null,
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
    groupId: "climate",
    title: "E2E Featured Post Two",
    text: "Second featured post body used for navigation regression coverage.",
    upvotes: 3,
    downvotes: 1,
    bookmarkedBy: [],
    created: new Date().toISOString(),
    url: "/post/climate/e2e-featured-post-two/feat-e2e-2",
    citationUrl: null,
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

async function mockFeaturedPostsGraphQL(page: Page) {
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

    if (!query.includes("featuredPosts")) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          featuredPosts: {
            __typename: "Posts",
            entities: FEATURED_POSTS,
            pagination: {
              __typename: "Pagination",
              total_count: FEATURED_POSTS.length,
              limit: 10,
              offset: 0,
            },
          },
        },
      }),
    });
  });
}

test.describe("RC1-004 Featured posts navigate to post detail", () => {
  // Homepage featured posts are for logged-out visitors; clear stored auth.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await mockFeaturedPostsGraphQL(page);
  });

  test("clicking each featured post card opens the corresponding post page", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.getByTestId("featured-post-card");
    await expect(cards).toHaveCount(FEATURED_POSTS.length);

    for (const post of FEATURED_POSTS) {
      await page.goto("/");
      await expect(cards).toHaveCount(FEATURED_POSTS.length);

      const card = page.getByTestId("featured-post-card").filter({
        hasText: post.title,
      });
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute(
        "href",
        `/dashboard${post.url.replace(/\?/g, "")}`
      );

      await card.click();
      await expect(page).toHaveURL(new RegExp(`/dashboard${post.url}$`));

      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
      await expect(cards.first()).toBeVisible();
    }
  });
});
