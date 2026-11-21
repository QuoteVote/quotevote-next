/**
 * E2E-AUTH-010: Admin invitation requests on Manage Invites (updated design)
 *
 * Actors: an admin (E2E_ADMIN_*, signed in by global setup) and a regular member (the author)
 * Viewports: Desktop, Mobile (playwright.config.ts projects)
 *
 * The admin's request list and its Accept / Decline replies are mocked, so the specs don't
 * depend on pending requests in the database or send invitation emails. Who may list the
 * requests is checked against the real API.
 */
import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import { GRAPHQL_ROUTE, graphqlRequest, loginViaApi } from "./helpers/api";
import { AUTHOR_PASSWORD, AUTHOR_USERNAME } from "./helpers/auth";
import { ADMIN_STORAGE_PATH } from "./helpers/storage-state";

// The proxy verifies the session token, so these specs sign in for real: the
// admin through E2E_ADMIN_* in global setup, the regular user as the author.
const hasAdminSession = fs.existsSync(ADMIN_STORAGE_PATH);

type InviteStatus = "1" | "2" | "4"; // pending, declined, accepted

/**
 * Serves one invitation request with `status()`; Accept / Decline change it through
 * `onDecision`, so the page's refetch and a reload show the new status.
 */
async function mockInviteRequests(
  page: Page,
  email: string,
  status: () => InviteStatus,
  onDecision?: (next: InviteStatus) => void
): Promise<void> {
  await page.route(GRAPHQL_ROUTE, async (route) => {
    let body: { operationName?: string; variables?: { inviteStatus?: string } } = {};
    try {
      body = route.request().postDataJSON() as typeof body;
    } catch {
      await route.fallback();
      return;
    }

    if (body?.operationName === "userInviteRequests") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            userInviteRequests: [
              {
                _id: "mock-invite-1",
                email,
                joined: new Date().toISOString(),
                status: status(),
                signedUp: false,
              },
            ],
          },
        }),
      });
      return;
    }

    if (body?.operationName === "sendUserInviteApproval" && onDecision) {
      onDecision(body.variables?.inviteStatus as InviteStatus);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { sendUserInviteApproval: { code: "SUCCESS", message: "ok" } },
        }),
      });
      return;
    }

    await route.fallback();
  });
}

test.describe("Admin Invitation Request Approval and Rejection (E2E-AUTH-010)", () => {
  test.skip(
    !hasAdminSession,
    "Set E2E_ADMIN_USERNAME and E2E_ADMIN_PASSWORD to run the admin specs."
  );
  test.use({ storageState: hasAdminSession ? ADMIN_STORAGE_PATH : undefined });

  const visitorEmail = `e2e-pending-${Date.now()}@example.com`;

  /** The request's row in the Received Requests table. */
  const requestRow = (page: Page) => page.getByRole("row").filter({ hasText: visitorEmail });

  test("Administrator can view pending invitation requests", async ({ page }) => {
    await mockInviteRequests(page, visitorEmail, () => "1");
    await page.goto("/manage-invites");

    await expect(page.getByRole("heading", { level: 1, name: "Manage Invites" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Received Requests/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    const row = requestRow(page);
    await expect(row).toBeVisible();
    await expect(row.getByText("Pending", { exact: true })).toBeVisible();
    await expect(row.getByRole("button", { name: "Accept" })).toBeVisible();
    await expect(row.getByRole("button", { name: "Decline" })).toBeVisible();
  });

  test("Administrator can approve a pending invitation request", async ({ page }) => {
    let status: InviteStatus = "1";
    await mockInviteRequests(
      page,
      visitorEmail,
      () => status,
      (next) => {
        status = next;
      }
    );
    await page.goto("/manage-invites");

    await requestRow(page).getByRole("button", { name: "Accept" }).click();
    await expect(page.getByText("Invitation accepted")).toBeVisible();
    expect(status).toBe("4");

    // An accepted request stays in the list, with Resend and Reset instead.
    const row = requestRow(page);
    await expect(row.getByText("Accepted", { exact: true })).toBeVisible();
    await expect(row.getByRole("button", { name: "Resend" })).toBeVisible();

    await page.reload();
    await expect(requestRow(page).getByText("Accepted", { exact: true })).toBeVisible();
  });

  test("Administrator can reject a pending invitation request", async ({ page }) => {
    let status: InviteStatus = "1";
    await mockInviteRequests(
      page,
      visitorEmail,
      () => status,
      (next) => {
        status = next;
      }
    );
    await page.goto("/manage-invites");

    // Decline asks first, in a small confirmation next to the button.
    await requestRow(page).getByRole("button", { name: "Decline" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Decline" }).click();
    await expect(page.getByText("Invitation declined")).toBeVisible();
    expect(status).toBe("2");

    await expect(requestRow(page).getByText("Declined", { exact: true })).toBeVisible();

    await page.reload();
    await expect(requestRow(page).getByText("Declined", { exact: true })).toBeVisible();
  });
});

test.describe("Admin Invitation Request Authorization Validation", () => {
  test.skip(!AUTHOR_PASSWORD, "E2E_AUTHOR_PASSWORD is required");

  test("Regular members only see their sent invites", async ({ page }) => {
    await page.goto("/manage-invites");

    await expect(page.getByRole("heading", { level: 1, name: "Manage Invites" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Sent Invites/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByRole("tab", { name: /Received Requests/i })).toHaveCount(0);
  });

  test("The API refuses the request list to a regular member", async () => {
    const { token } = await loginViaApi(AUTHOR_USERNAME, AUTHOR_PASSWORD);
    await expect(
      graphqlRequest("query userInviteRequests { userInviteRequests { _id } }", undefined, token)
    ).rejects.toThrow("Admin access required");
  });
});
