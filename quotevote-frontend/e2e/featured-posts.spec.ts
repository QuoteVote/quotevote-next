/**
 * Directory cards on `/` should open the post detail page (#454).
 */
import { test, expect, type Page } from "@playwright/test";

const DIRECTORY_POSTS = [
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
    groupId: "climate",
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
  }) => {
    await page.goto("/");

    const cards = page.getByTestId("post-card");
    await expect(cards).toHaveCount(DIRECTORY_POSTS.length);

    for (const post of DIRECTORY_POSTS) {
      await page.goto("/");
      await expect(cards).toHaveCount(DIRECTORY_POSTS.length);

      const card = page.getByTestId("post-card").filter({
        hasText: post.title,
      });
      await expect(card).toBeVisible();
      await expect(card).toContainText(post.text);
      await expect(card.getByRole("button", { name: "Show More" })).toHaveCount(0);

      await card.click();
      await expect(page).toHaveURL(new RegExp(`/dashboard${post.url}$`));

      await page.goBack();
      await expect(page).toHaveURL((url) => url.pathname === '/');
      await expect(cards.first()).toBeVisible();
    }
  });
});
