import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import { GRAPHQL_ROUTE } from "./helpers/api";
import { ADMIN_STORAGE_PATH } from "./helpers/storage-state";

// The proxy verifies the session token, so these specs sign in for real: the
// admin through E2E_ADMIN_* in global setup, the regular user as the author.
const hasAdminSession = fs.existsSync(ADMIN_STORAGE_PATH);

async function mockGraphQLOperation(
  page: Page,
  operationName: string,
  responseData: object | null,
  errorData?: object[]
) {
  await page.route(GRAPHQL_ROUTE, async (route) => {
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
    const payload: { data?: object; errors?: object[] } = {};
    if (responseData !== null) payload.data = responseData;
    if (errorData) payload.errors = errorData;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

test.describe("Admin Invitation Request Approval and Rejection (E2E-AUTH-010)", () => {
  test.skip(!hasAdminSession, "Set E2E_ADMIN_USERNAME and E2E_ADMIN_PASSWORD to run the admin specs.");
  test.use({ storageState: hasAdminSession ? ADMIN_STORAGE_PATH : undefined });

  const visitorEmail = `e2e-pending-${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    await mockGraphQLOperation(page, "userInviteRequests", {
      userInviteRequests: [
        {
          _id: "mock-invite-1",
          email: visitorEmail,
          joined: new Date().toISOString(),
          status: "1" // 1 = Pending
        }
      ]
    });
    await mockGraphQLOperation(page, "Heartbeat", {
      heartbeat: { success: true, timestamp: new Date().toISOString() }
    });
    await mockGraphQLOperation(page, "getChatRooms", { messageRooms: [] });
    await mockGraphQLOperation(page, "notifications", { notifications: [] });
  });

  test("Administrator can view pending invitation requests", async ({ page }) => {
    await page.goto("/dashboard/manage-invites");

    await expect(page.getByRole("heading", { name: "Manage Invites" })).toBeVisible();

    const receivedTab = page.getByRole('tab', { name: /Received Requests/i });
    await expect(receivedTab).toBeVisible();

    const isMobile = (page.viewportSize()?.width ?? 1024) < 768;
    
    if (isMobile) {
      await expect(page.locator('.md\\:hidden').getByText(visitorEmail)).toBeVisible();
      await expect(page.locator('.md\\:hidden').getByText("Pending", { exact: true })).toBeVisible();
    } else {
      await expect(page.locator('.hidden.md\\:block').getByText(visitorEmail)).toBeVisible();
      await expect(page.locator('.hidden.md\\:block').getByText("Pending", { exact: true })).toBeVisible();
    }

    const acceptButton = page.locator('button', { hasText: 'Accept' }).and(page.locator(':visible'));
    const declineButton = page.locator('button', { hasText: 'Decline' }).and(page.locator(':visible'));
    await expect(acceptButton).toBeVisible();
    await expect(declineButton).toBeVisible();
  });

  test("Administrator can approve a pending invitation request", async ({ page }) => {
    let currentStatus = "1"; // 1 = Pending

    await page.route(GRAPHQL_ROUTE, async (route) => {
      let body: { operationName?: string } = {};
      try {
        body = route.request().postDataJSON() as { operationName?: string };
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
                  email: visitorEmail,
                  joined: new Date().toISOString(),
                  status: currentStatus
                }
              ]
            }
          })
        });
        return;
      } else if (body?.operationName === "sendUserInviteApproval") {
        currentStatus = "4"; // 4 = Accepted
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              sendUserInviteApproval: { _id: "mock-invite-1", status: "4" }
            }
          })
        });
        return;
      }
      await route.fallback();
    });

    await page.goto("/dashboard/manage-invites");

    const acceptButton = page.locator('button', { hasText: 'Accept' }).and(page.locator(':visible'));
    await acceptButton.click();

    await expect(page.getByText("Invitation accepted")).toBeVisible();

    const sentTab = page.getByRole('tab', { name: /Sent Invites/i });
    await sentTab.click();

    const isMobile = (page.viewportSize()?.width ?? 1024) < 768;
    if (isMobile) {
      await expect(page.locator('.md\\:hidden').getByText(visitorEmail)).toBeVisible();
      await expect(page.locator('.md\\:hidden').getByText("Accepted")).toBeVisible();
    } else {
      await expect(page.locator('.hidden.md\\:block').getByText(visitorEmail)).toBeVisible();
      await expect(page.locator('.hidden.md\\:block').getByText("Accepted")).toBeVisible();
    }

    // Verify persistence after reload
    await page.reload();
    await page.getByRole('tab', { name: /Sent Invites/i }).click();

    if (isMobile) {
      await expect(page.locator('.md\\:hidden').getByText("Accepted")).toBeVisible();
    } else {
      await expect(page.locator('.hidden.md\\:block').getByText("Accepted")).toBeVisible();
    }
  });

  test("Administrator can reject a pending invitation request", async ({ page }) => {
    let currentStatus = "1"; // 1 = Pending

    await page.route(GRAPHQL_ROUTE, async (route) => {
      let body: { operationName?: string } = {};
      try {
        body = route.request().postDataJSON() as { operationName?: string };
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
                  email: visitorEmail,
                  joined: new Date().toISOString(),
                  status: currentStatus
                }
              ]
            }
          })
        });
        return;
      } else if (body?.operationName === "sendUserInviteApproval") {
        currentStatus = "2"; // 2 = Declined
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              sendUserInviteApproval: { _id: "mock-invite-1", status: "2" }
            }
          })
        });
        return;
      }
      await route.fallback();
    });

    await page.goto("/dashboard/manage-invites");

    const declineButton = page.locator('button', { hasText: 'Decline' }).and(page.locator(':visible')).first();
    await declineButton.click();

    const confirmButton = page.getByRole('alertdialog').locator('button', { hasText: 'Decline' });
    await confirmButton.click();

    await expect(page.getByText("Invitation declined")).toBeVisible();

    const isMobile = (page.viewportSize()?.width ?? 1024) < 768;
    if (isMobile) {
      await expect(page.locator('.md\\:hidden').getByText("Declined")).toBeVisible();
    } else {
      await expect(page.locator('.hidden.md\\:block').getByText("Declined")).toBeVisible();
    }

    // Verify persistence after reload
    await page.reload();

    if (isMobile) {
      await expect(page.locator('.md\\:hidden').getByText("Declined")).toBeVisible();
    } else {
      await expect(page.locator('.hidden.md\\:block').getByText("Declined")).toBeVisible();
    }
  });
});

test.describe("Admin Invitation Request Authorization Validation", () => {
  test("Regular authenticated users receive authorization error", async ({ page }) => {
    await mockGraphQLOperation(page, "userInviteRequests", null, [
      { message: "Not Authorized" }
    ]);

    await mockGraphQLOperation(page, "Heartbeat", {
      heartbeat: { success: true, timestamp: new Date().toISOString() }
    });
    await mockGraphQLOperation(page, "getChatRooms", { messageRooms: [] });
    await mockGraphQLOperation(page, "notifications", { notifications: [] });

    await page.goto("/dashboard/manage-invites");

    await expect(page.getByRole('alert').getByText("Not Authorized")).toBeVisible();
    
    await expect(page.getByRole('tab', { name: /Received Requests/i })).not.toBeVisible();
  });
});
