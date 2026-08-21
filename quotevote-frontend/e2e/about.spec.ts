/**
 * About page (#350) — Zeplin marketing page at /about.
 * Guest-only: the public About route should render without auth.
 */
import { test, expect } from "@playwright/test";

test.describe("About page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("renders the Zeplin about page without horizontal scroll", async ({ page }) => {
    await page.goto("/about");

    await expect(page.getByTestId("about-page")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /better conversations build stronger communities/i,
      })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /request an invite/i }).first()).toHaveAttribute(
      "href",
      "/auths/request-access"
    );
    await expect(page.getByRole("link", { name: /explore discussions/i })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 1;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
