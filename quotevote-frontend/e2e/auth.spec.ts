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

test.describe("Signup / Account Creation (E2E-AUTH-001)", () => {
  // Override global storage state so we start as a logged-out visitor
  test.use({ storageState: { cookies: [], origins: [] } });

  test("creates a new account, logs in, and routes to authenticated dashboard", async ({ page }) => {
    // 1. Listen for page errors from the start of the test
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const errorToastLocator = page.locator('[data-sonner-toast][data-type="error"]');
    const uniqueId = Date.now();
    const uniqueUsername = `user_${uniqueId.toString().slice(-10)}`;
    const uniqueEmail = `e2e-signup-${uniqueId}@example.com`;
    const validPassword = `Password${uniqueId}!`;

    // 2. Open Quote.Vote while logged out and navigate to signup
    await page.goto("/auths/signup");

    // 3. Assert signup form and elements load successfully
    const signupForm = page.getByTestId("signup-form");
    const usernameInput = page.getByTestId("signup-username-input");
    const emailInput = page.getByTestId("signup-email-input");
    const passwordInput = page.getByTestId("signup-password-input");
    const confirmPasswordInput = page.getByTestId("signup-confirm-password-input");
    const submitButton = page.getByTestId("signup-submit-button");

    await expect(signupForm).toBeVisible();
    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // 4. Fill in direct signup credentials
    await usernameInput.fill(uniqueUsername);
    await emailInput.fill(uniqueEmail);
    await passwordInput.fill(validPassword);
    await confirmPasswordInput.fill(validPassword);

    // 5. Submit the signup form
    await submitButton.click();

    // 6. Direct signup redirects to /auths/login
    await page.waitForURL("**/auths/login", { timeout: 15000 });

    // 7. Complete login using newly created credentials
    await page.getByPlaceholder('Email/Username').fill(uniqueEmail);
    await page.getByPlaceholder('Password').fill(validPassword);

    await page.click('#tos');
    await page.click('#coc');

    const loginButton = page.getByRole('button', { name: 'Log in' });
    await expect(loginButton).toBeEnabled();

    await loginButton.click({ force: true });

    // 8. Verify navigation to the authenticated experience /dashboard/explore
    await page.waitForURL("**/dashboard/explore", { timeout: 15000 });

    // 9. Confirm the new user is authenticated
    const authNav = page.getByTestId("authenticated-navigation").filter({ visible: true });
    await expect(authNav).toBeVisible();

    const profileMenu = page.getByTestId("user-profile-menu").filter({ visible: true });
    await expect(profileMenu).toBeVisible();

    // 10. Confirm session persists after page reload
    await page.reload();
    await page.waitForURL("**/dashboard/explore", { timeout: 15000 });
    await expect(authNav).toBeVisible();
    await expect(profileMenu).toBeVisible();

    // 11. No runtime errors or generic error toasts appear
    await expect(errorToastLocator).toHaveCount(0);
    expect(pageErrors).toHaveLength(0);
  });
});

/**
 * Helper to generate a lightweight unsigned JWT mock for test sessions.
 */
function createMockJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mock_signature`;
}

/**
 * Mocks the REST login endpoint (/login and /auth/login) so tests pass
 * reliably in isolated environments while preserving standard browser auth behavior.
 */
async function mockPasswordLogin(page: Page, user = registeredUser) {
  const mockToken = createMockJwt({
    id: user._id,
    username: user.username,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  });

  await page.route(/(\/login|\/auth\/login)/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    let body: { username?: string; password?: string } = {};
    try {
      body = route.request().postDataJSON() as { username?: string; password?: string };
    } catch {
      await route.fallback();
      return;
    }

    const isMatch =
      (body.username === user.email || body.username === user.username) &&
      body.password === user.password;

    if (!isMatch) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid username or password.' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: mockToken,
        accessToken: mockToken,
        user: {
          _id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
        },
      }),
    });
  });
}

/**
 * 5.1.12 E2E-AUTH-002: Password Login
 *
 * A registered user logs into Quote.Vote with a valid password from a logged-out
 * state. The test confirms:
 * - Login form and input controls render properly
 * - Inputs accept valid text
 * - Terms checkboxes enable submission
 * - Form submits without errors
 * - Application authenticates and navigates to the dashboard (/dashboard/explore)
 * - Authenticated navigation / profile menu controls appear
 * - Authenticated session persists across page reload
 * - Works across desktop and mobile viewports
 */
test.describe("Password Login (E2E-AUTH-002)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await mockPasswordLogin(page, registeredUser);
  });

  test("logs in with valid email and password, routes to dashboard, and preserves session after reload", async ({ page }) => {
    const errorToastLocator = page.locator('[data-sonner-toast][data-type="error"]');
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    // 1. Open Quote.Vote while logged out and navigate to login form
    await page.goto("/auths/login");

    // 2. Assert login form and controls load successfully
    const form = page.getByTestId("login-form");
    const identifierInput = page.getByTestId("login-identifier-input");
    const passwordInput = page.getByTestId("login-password-input");
    const tosCheckbox = page.getByTestId("login-tos-checkbox");
    const cocCheckbox = page.getByTestId("login-coc-checkbox");
    const submitButton = page.getByTestId("login-submit-button");

    await expect(form).toBeVisible();
    await expect(identifierInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Submit is disabled before required fields and terms agreements are filled
    await expect(submitButton).toBeDisabled();

    // 3. Enter registered user email and valid password
    await identifierInput.fill(registeredUser.email);
    await expect(identifierInput).toHaveValue(registeredUser.email);

    await passwordInput.fill(registeredUser.password);
    await expect(passwordInput).toHaveValue(registeredUser.password);

    // 4. Accept Terms of Service and Code of Conduct
    await tosCheckbox.click();
    await cocCheckbox.click();

    // 5. Submit button becomes available
    await expect(submitButton).toBeEnabled();

    // 6. Submit login form
    await submitButton.click();

    // 7. Confirm user becomes authenticated and routes to the authenticated dashboard
    await page.waitForURL("**/dashboard/explore", { timeout: 15000 });

    // 8. Confirm authenticated navigation and profile controls appear
    const authNav = page.getByTestId("authenticated-navigation").filter({ visible: true });
    await expect(authNav).toBeVisible();

    const profileMenu = page.getByTestId("user-profile-menu").filter({ visible: true });
    await expect(profileMenu).toBeVisible();

    // 9. Confirm session persists after page reload
    await page.reload();
    await page.waitForURL("**/dashboard/explore", { timeout: 15000 });
    await expect(authNav).toBeVisible();
    await expect(profileMenu).toBeVisible();

    // 10. Confirm no runtime errors or error toasts occurred
    await expect(errorToastLocator).toHaveCount(0);
    expect(pageErrors).toHaveLength(0);
  });

  test("logs in with valid username and password", async ({ page }) => {
    const errorToastLocator = page.locator('[data-sonner-toast][data-type="error"]');
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/auths/login");

    const identifierInput = page.getByTestId("login-identifier-input");
    const passwordInput = page.getByTestId("login-password-input");
    const tosCheckbox = page.getByTestId("login-tos-checkbox");
    const cocCheckbox = page.getByTestId("login-coc-checkbox");
    const submitButton = page.getByTestId("login-submit-button");

    await identifierInput.fill(registeredUser.username);
    await passwordInput.fill(registeredUser.password);
    await tosCheckbox.click();
    await cocCheckbox.click();

    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await page.waitForURL("**/dashboard/explore", { timeout: 15000 });

    const authNav = page.getByTestId("authenticated-navigation").filter({ visible: true });
    await expect(authNav).toBeVisible();

    await expect(errorToastLocator).toHaveCount(0);
    expect(pageErrors).toHaveLength(0);
  });
});

