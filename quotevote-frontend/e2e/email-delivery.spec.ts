/**
 * E2E-EMAIL-001…004 — transactional email delivery (#498)
 *
 * Uses a local SendGrid mock (quotevote-backend `pnpm sendgrid:mock`) so no
 * shared SendGrid key or Mailosaur inbox is required. Specs skip unless
 * E2E_API_URL is set to a non-production API and the mock URL is present.
 *
 * Drive mail via GraphQL/API, then open the extracted link in the browser.
 * Direct invite (E2E-EMAIL-002) is skipped until sendUserInvite includes an
 * onboarding link (backend prerequisite — #672).
 */
import { expect, test } from "@playwright/test";
import {
  getApiUrl,
  loginViaApi,
  requestUserAccessViaApi,
  sendPasswordResetEmailViaApi,
  sendUserInviteApprovalViaApi,
} from "./helpers/api";
import {
  extractAppLink,
  getEmailRecipient,
  hasEmailE2ECredentials,
  uniqueE2ERecipient,
  waitForEmail,
} from "./helpers/email";

const ADMIN_USERNAME = (process.env.E2E_ADMIN_USERNAME ?? "").trim();
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

function isProductionApiHost(hostname: string): boolean {
  return hostname === "api.quote.vote";
}

function skipUnlessSafeLocalApi(): void {
  const explicitApiUrl = (process.env.E2E_API_URL ?? "").trim();
  test.skip(
    !explicitApiUrl,
    "Set E2E_API_URL explicitly to a local/non-prod API (never relies on NEXT_PUBLIC fallback)"
  );

  if (!explicitApiUrl) {
    return;
  }

  let hostname = "";
  try {
    hostname = new URL(getApiUrl()).hostname;
  } catch {
    test.skip(true, `E2E_API_URL is not a valid URL: ${explicitApiUrl}`);
    return;
  }

  test.skip(
    isProductionApiHost(hostname),
    "Email E2E must not run against api.quote.vote — point E2E_API_URL at local/staging"
  );
}

function skipUnlessEmailReady(): void {
  skipUnlessSafeLocalApi();
  test.skip(
    !hasEmailE2ECredentials(),
    "Set E2E_SENDGRID_MOCK_URL (or SENDGRID_MOCK_BASE_URL) to the local SendGrid mock"
  );
}

function skipUnlessAdmin(): void {
  test.skip(
    !ADMIN_USERNAME || !ADMIN_PASSWORD,
    "Set E2E_ADMIN_USERNAME and E2E_ADMIN_PASSWORD for invite approval/resend"
  );
}

function skipUnlessResetRecipient(): void {
  test.skip(
    !getEmailRecipient(),
    "Set E2E_EMAIL_RECIPIENT to an existing local account email for password-reset"
  );
}

test.describe("Transactional email delivery (#498)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Email delivery runs once, on desktop");
  });

  test("E2E-EMAIL-001: password reset email arrives with a working reset link", async ({
    page,
  }) => {
    skipUnlessEmailReady();
    skipUnlessResetRecipient();

    const recipient = getEmailRecipient();
    const receivedAfter = new Date();

    await sendPasswordResetEmailViaApi(recipient);

    const message = await waitForEmail({
      sentTo: recipient,
      receivedAfter,
    });

    expect(message.to.some((email) => email.toLowerCase() === recipient)).toBeTruthy();

    const link = extractAppLink(message);
    await page.goto(link);

    await expect(page).toHaveURL(/\/auths\/password-reset/);
    expect(page.url()).toMatch(/token=/);
  });

  test("E2E-EMAIL-002: direct user invite includes onboarding link", async () => {
    test.skip(
      true,
      "Blocked: sendUserInvite has no onboarding link — see #672 (prerequisite for #498)."
    );
  });

  test("E2E-EMAIL-003: invite approval email arrives with a working signup link", async ({
    page,
  }) => {
    skipUnlessEmailReady();
    skipUnlessAdmin();

    const recipient = uniqueE2ERecipient("invite");
    const receivedAfter = new Date();

    const pending = await requestUserAccessViaApi(recipient);
    expect(pending.email.toLowerCase()).toBe(recipient);

    const admin = await loginViaApi(ADMIN_USERNAME, ADMIN_PASSWORD);
    expect(admin.user.admin).toBe(true);

    await sendUserInviteApprovalViaApi(admin.token, pending._id, "4");

    const message = await waitForEmail({
      sentTo: recipient,
      receivedAfter,
    });

    const link = extractAppLink(message);
    await page.goto(link);

    await expect(page).toHaveURL(/\/auths\/signup/);
    expect(page.url()).toMatch(/token=/);
  });

  test("E2E-EMAIL-004: invite resend delivers a new signup link", async ({ page }) => {
    skipUnlessEmailReady();
    skipUnlessAdmin();

    const recipient = uniqueE2ERecipient("resend");
    const admin = await loginViaApi(ADMIN_USERNAME, ADMIN_PASSWORD);
    expect(admin.user.admin).toBe(true);

    const pending = await requestUserAccessViaApi(recipient);
    const firstAfter = new Date();
    await sendUserInviteApprovalViaApi(admin.token, pending._id, "4");
    const first = await waitForEmail({ sentTo: recipient, receivedAfter: firstAfter });
    const firstLink = extractAppLink(first);

    const secondAfter = new Date();
    await sendUserInviteApprovalViaApi(admin.token, pending._id, "4");
    const second = await waitForEmail({ sentTo: recipient, receivedAfter: secondAfter });
    const secondLink = extractAppLink(second);

    expect(second.id).not.toBe(first.id);
    expect(secondLink).not.toBe(firstLink);

    await page.goto(secondLink);
    await expect(page).toHaveURL(/\/auths\/signup/);
    expect(page.url()).toMatch(/token=/);
  });
});
