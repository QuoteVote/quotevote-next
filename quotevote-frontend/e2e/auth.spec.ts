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
    await emailInput.click();
    await page.keyboard.type(registeredUser.email);

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

/**
 * E2E-AUTH-005: Invite Request CTA
 *
 * A logged-out visitor navigates to /auths/request-access, enters a unique
 * email, and submits an invite request. The app should confirm success.
 * A duplicate submission with the same email should be handled gracefully.
 *
 * Both GraphQL operations (duplicate check query + request mutation) are
 * mocked at the network layer since no real backend is required for this
 * test to be meaningful.
 *
 * Out of scope: invite approval, account creation, magic link login,
 * password setup, admin invite management, email delivery.
 */

const GRAPHQL_URL = "http://localhost:4000/graphql";

async function mockGraphQLOperation(
  page: Page,
  operationName: string,
  responseData: object
) {
  await page.route(GRAPHQL_URL, async (route) => {
    let body: { operationName?: string } = {};
    try {
      body = route.request().postDataJSON() as { operationName?: string };
    } catch {
      await route.fallback();
      return;
    }
    if (body?.operationName !== operationName) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: responseData }),
    });
  });
}

test.describe("Invite Request CTA (E2E-AUTH-005)", () => {
  const visitorEmail = `e2e-invite-${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    await mockGraphQLOperation(page, "checkDuplicateEmail", {
      checkDuplicateEmail: [],
    });
    await mockGraphQLOperation(page, "requestUserAccess", {
      requestUserAccess: { _id: "mock-id", email: visitorEmail },
    });
  });

  test("submits a new invite request and shows confirmation", async ({ page }) => {
    await page.goto("/auths/request-access");

    // 1. Invite CTA is visible to logged-out visitors
    const form = page.getByTestId("invite-request-form");
    const emailInput = page.getByTestId("invite-email-input");
    const submitButton = page.getByTestId("invite-submit-button");

    await expect(form).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // 2. Email input accepts a registered email address
    await emailInput.fill(registeredUser.email);
    await emailInput.dispatchEvent("input");

    // 3. Submit button becomes available once the email is valid
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 4. Confirmation message appears
    const successMessage = page.getByTestId("invite-success-message");
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/thank you for joining us/i);

    // 5. Visitor remains logged out
    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some((c) => /token|session|auth/i.test(c.name));
    expect(hasAuthCookie).toBe(false);
  });

  test("handles duplicate invite request gracefully", async ({ page }) => {
    // Override: duplicate check returns existing record
    await mockGraphQLOperation(page, "checkDuplicateEmail", {
      checkDuplicateEmail: [{ _id: "existing-id", email: visitorEmail }],
    });
    await mockGraphQLOperation(page, "requestUserAccess", {
      requestUserAccess: null,
    });

    await page.goto("/auths/request-access");

    const emailInput = page.getByTestId("invite-email-input");
    const submitButton = page.getByTestId("invite-submit-button");

    await emailInput.fill(visitorEmail);
    await submitButton.click();

    // Duplicate message appears instead of success
    const duplicateMessage = page.getByTestId("invite-duplicate-message");
    await expect(duplicateMessage).toBeVisible();
    await expect(duplicateMessage).toContainText(/this email already exists/i);

    // Success state does NOT render
    const successMessage = page.getByTestId("invite-success-message");
    await expect(successMessage).not.toBeVisible();

    // Visitor remains logged out
    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some((c) => /token|session|auth/i.test(c.name));
    expect(hasAuthCookie).toBe(false);
  });
});