/**
 * E2E-EMAIL-001…004 — transactional email delivery (#498)
 *
 * Requires real SendGrid on the API under test plus Mailosaur credentials.
 * Specs skip when secrets are missing so CI without email env stays green.
 *
 * Drive mail via GraphQL/API, then open the extracted link in the browser.
 * Direct invite (E2E-EMAIL-002) is skipped until sendUserInvite includes an
 * onboarding link (backend prerequisite).
 */
import { expect, test } from '@playwright/test';
import {
  loginViaApi,
  requestUserAccessViaApi,
  sendPasswordResetEmailViaApi,
  sendUserInviteApprovalViaApi,
} from './helpers/api';
import {
  extractAppLink,
  getEmailRecipient,
  hasEmailE2ECredentials,
  uniqueMailosaurRecipient,
  waitForEmail,
} from './helpers/email';

const ADMIN_USERNAME = (process.env.E2E_ADMIN_USERNAME ?? '').trim();
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
const RESET_USERNAME = (process.env.E2E_RESET_USERNAME ?? '').trim();
const RESET_PASSWORD = process.env.E2E_RESET_PASSWORD ?? '';

function skipUnlessEmailReady(): void {
  test.skip(
    !hasEmailE2ECredentials(),
    'Set E2E_EMAIL_RECIPIENT, MAILOSAUR_API_KEY, and MAILOSAUR_SERVER_ID in .env.e2e.local'
  );
}

function skipUnlessAdmin(): void {
  test.skip(
    !ADMIN_USERNAME || !ADMIN_PASSWORD,
    'Set E2E_ADMIN_USERNAME and E2E_ADMIN_PASSWORD for invite approval/resend'
  );
}

function skipUnlessResetUser(): void {
  test.skip(
    !RESET_USERNAME || !RESET_PASSWORD,
    'Set E2E_RESET_USERNAME and E2E_RESET_PASSWORD (account email must equal E2E_EMAIL_RECIPIENT)'
  );
}

test.describe('Transactional email delivery (#498)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('E2E-EMAIL-001: password reset email arrives with a working reset link', async ({
    page,
  }) => {
    skipUnlessEmailReady();
    skipUnlessResetUser();

    const recipient = getEmailRecipient();
    const receivedAfter = new Date();

    await sendPasswordResetEmailViaApi(recipient);

    const message = await waitForEmail({
      sentTo: recipient,
      receivedAfter,
    });

    expect(message.to?.some((t) => t.email?.toLowerCase() === recipient)).toBeTruthy();

    const link = extractAppLink(message);
    await page.goto(link);

    await expect(page).toHaveURL(/\/auths\/password-reset/);
    expect(page.url()).toMatch(/token=/);
  });

  test('E2E-EMAIL-002: direct user invite includes onboarding link', async () => {
    test.skip(
      true,
      'Blocked: sendUserInvite has no onboarding link — see #672 (prerequisite for #498).'
    );
  });

  test('E2E-EMAIL-003: invite approval email arrives with a working signup link', async ({
    page,
  }) => {
    skipUnlessEmailReady();
    skipUnlessAdmin();

    const recipient = uniqueMailosaurRecipient('invite');
    const receivedAfter = new Date();

    const pending = await requestUserAccessViaApi(recipient);
    expect(pending.email.toLowerCase()).toBe(recipient);

    const admin = await loginViaApi(ADMIN_USERNAME, ADMIN_PASSWORD);
    expect(admin.user.admin).toBe(true);

    await sendUserInviteApprovalViaApi(admin.token, pending._id, '4');

    const message = await waitForEmail({
      sentTo: recipient,
      receivedAfter,
    });

    const link = extractAppLink(message);
    await page.goto(link);

    await expect(page).toHaveURL(/\/auths\/signup/);
    expect(page.url()).toMatch(/token=/);
  });

  test('E2E-EMAIL-004: invite resend delivers a new signup link', async ({ page }) => {
    skipUnlessEmailReady();
    skipUnlessAdmin();

    const recipient = uniqueMailosaurRecipient('resend');
    const admin = await loginViaApi(ADMIN_USERNAME, ADMIN_PASSWORD);
    expect(admin.user.admin).toBe(true);

    const pending = await requestUserAccessViaApi(recipient);
    const firstAfter = new Date();
    await sendUserInviteApprovalViaApi(admin.token, pending._id, '4');
    const first = await waitForEmail({ sentTo: recipient, receivedAfter: firstAfter });
    const firstLink = extractAppLink(first);

    const secondAfter = new Date();
    await sendUserInviteApprovalViaApi(admin.token, pending._id, '4');
    const second = await waitForEmail({ sentTo: recipient, receivedAfter: secondAfter });
    const secondLink = extractAppLink(second);

    expect(second.id).not.toBe(first.id);
    expect(secondLink).toBeTruthy();

    await page.goto(secondLink);
    await expect(page).toHaveURL(/\/auths\/signup/);
    expect(page.url()).toMatch(/token=/);

    // First link should still look like a signup URL (token may differ after resend).
    expect(firstLink).toMatch(/signup|token=/i);
  });
});
