import { test, expect, type Page } from "@playwright/test";
import { registeredUser } from "./fixtures/registeredUser";

/**
 * E2E-AUTH-006: Eyebrow Email Gateway — Registered User
 *
 * A logged-out visitor enters an email belonging to an existing registered
 * account into the top-of-page "eyebrow" email gateway. The gateway should
 * recognize the account and offer magic link / password login options,
 * without logging the user in.
 *
 * Out of scope (covered by other issues): completing magic link login,
 * completing password login, invite request flow, pending invite state,
 * approved invite onboarding, password reset, email delivery.
 */

/**
 * Mocks the `/auth/check-email` endpoint so this spec doesn't depend on a
 * real seeded database account or a backend implementation that doesn't
 * exist yet (see e2e/fixtures/registeredUser.ts for context). Swap this for
 * a real seeded fixture once the backend route ships.
 */
async function mockRegisteredEmailCheck(page: Page, email: string) {
  // Match on path only — embedding '?'/'=' query-string characters directly
  // in a glob pattern is fragile (Playwright parses the glob through `new
  // URL()`, which has known quirks with '?'). Instead, match any request to
  // the endpoint and verify the email query param inside the handler.
  await page.route("**/auth/check-email**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("email") !== email) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "registered" }),
    });
  });
}

test.describe("Eyebrow Email Gateway: Registered User (E2E-AUTH-006)", () => {
  test.beforeEach(async ({ page }) => {
    await mockRegisteredEmailCheck(page, registeredUser.email);
  });

  test("recognizes a registered email and offers login options", async ({ page }) => {
    const errorToastLocator = page.locator('[data-sonner-toast][data-type="error"]');

    await page.goto("/");

    // 1. Eyebrow email field is visible to logged-out visitors
    const form = page.getByTestId("eyebrow-email-form");
    const emailInput = page.getByTestId("eyebrow-email-input");
    const submitButton = page.getByTestId("eyebrow-email-submit");

    await expect(form).toBeVisible();
    await expect(emailInput).toBeVisible();

    // Submit is disabled before a valid email is entered
    await expect(submitButton).toBeDisabled();

    // 2. Email input accepts a registered email address
    await emailInput.fill(registeredUser.email);

    // 3. Submit button becomes available once the email is valid
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 4. Registered-user state appears after submission
    const registeredMessage = page.getByTestId("registered-user-message");
    await expect(registeredMessage).toBeVisible();
    await expect(registeredMessage).toContainText(/we recognize this email/i);

    // 5. Magic link login option is visible
    const magicLinkOption = page.getByTestId("magic-link-login-option");
    await expect(magicLinkOption).toBeVisible();

    // 6. Password login option is visible
    const passwordOption = page.getByTestId("password-login-option");
    await expect(passwordOption).toBeVisible();

    // 7. User remains logged out — no session/auth cookie or token has
    // been set, and the eyebrow gateway (which only renders for logged-out
    // visitors) is still present underneath the modal.
    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some((cookie) =>
      /token|session|auth/i.test(cookie.name)
    );
    expect(hasAuthCookie).toBe(false);
    await expect(form).toBeVisible();

    // 8. No runtime error or generic error toast appears
    await expect(errorToastLocator).toHaveCount(0);
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    expect(pageErrors).toHaveLength(0);
  });
});