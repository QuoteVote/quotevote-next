/**
 * E2E-MOB-006 — Mobile pages stay within the screen (#815)
 *
 * Sheet mapping:
 * - Feature Area: Mobile
 * - Scenario: No horizontal page scrolling
 * - Priority: P1
 * - Actor: Guest, and Registered User (authorUser) when E2E_AUTHOR_PASSWORD is set
 * - Viewport: Mobile
 *
 * On each page and open panel:
 * 1. The page is no wider than the screen, so it can't be dragged sideways.
 * 2. Every visible text field is at least 16px. iOS Safari zooms the page when a smaller
 *    field is focused, and the zoomed page can then be dragged sideways.
 */
import { test, expect, type Page } from "@playwright/test";
import { AUTHOR_PASSWORD, AUTHOR_USERNAME } from "./helpers/auth";

const SMALLEST_FIELD_PX = 16;

async function openPage(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  // Let the client render and lay out before measuring.
  await page.waitForTimeout(800);
}

async function expectFitsScreen(page: Page, label: string): Promise<void> {
  const { pageWidth, screenWidth, smallFields } = await page.evaluate((smallest) => {
    const fields = Array.from(
      document.querySelectorAll<HTMLElement>(
        'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="file"]):not([type="range"]), textarea, select'
      )
    );
    return {
      pageWidth: document.documentElement.scrollWidth,
      screenWidth: document.documentElement.clientWidth,
      smallFields: fields
        .filter((el) => {
          const box = el.getBoundingClientRect();
          return box.width > 0 && box.height > 0;
        })
        .map((el) => ({
          field:
            el.id || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.tagName,
          size: parseFloat(getComputedStyle(el).fontSize),
        }))
        .filter((field) => field.size < smallest),
    };
  }, SMALLEST_FIELD_PX);

  expect(pageWidth, `${label}: the page is wider than the screen`).toBeLessThanOrEqual(screenWidth);
  expect(smallFields, `${label}: text fields under 16px make iOS Safari zoom`).toEqual([]);
}

test.describe("E2E-MOB-006: Mobile pages stay within the screen", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, "Checks the mobile layout only");
  });

  test.describe("guest", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    for (const path of [
      "/",
      "/auths/login",
      "/auths/request-access",
      "/about",
      "/terms",
      "/e2e-mob-006-missing-page",
    ]) {
      test(`${path} fits the screen`, async ({ page }) => {
        await openPage(page, path);
        await expectFitsScreen(page, path);
      });
    }
  });

  test.describe("signed in", () => {
    test.skip(!AUTHOR_PASSWORD, "E2E_AUTHOR_PASSWORD is required");

    for (const path of [`/profile/${AUTHOR_USERNAME}`, "/notifications", "/settings"]) {
      test(`${path} fits the screen`, async ({ page }) => {
        await openPage(page, path);
        await expectFitsScreen(page, path);
      });
    }

    test("the Messages panel and the composer fit the screen", async ({ page }) => {
      await openPage(page, `/profile/${AUTHOR_USERNAME}`);

      await page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByLabel("Messages")
        .click();
      await expect(page.getByTestId("messages-panel")).toBeVisible();
      await expectFitsScreen(page, "Messages panel");

      await openPage(page, `/profile/${AUTHOR_USERNAME}`);
      await page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByTestId("create-post-button")
        .click();
      await expect(page.getByTestId("post-composer")).toBeVisible();
      await expectFitsScreen(page, "composer");
    });
  });
});
