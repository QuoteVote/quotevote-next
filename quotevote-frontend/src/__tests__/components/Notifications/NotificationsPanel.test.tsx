/**
 * NotificationsPanel (updated design): from the left under the top bar on desktop, over
 * a dimmed page; full screen above the tab bar on phones.
 */

import { render, screen, resetStore } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { NotificationsPanel } from "@/components/Notifications/NotificationsPanel";
import { MARK_NOTIFICATION_READ } from "@/graphql/mutations";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import { useAppStore } from "@/store";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useSubscription: jest.fn(),
}));
jest.mock("@/hooks/useGuestGuard", () => ({ __esModule: true, default: () => () => true }));

const notifications = [
  {
    _id: "n1",
    userId: "alice-id",
    userIdBy: "bob-id",
    userBy: {
      _id: "bob-id",
      name: "Bob Local",
      avatar: null,
      username: "bob",
      contributorBadge: false,
    },
    label: "Nice point",
    status: "new",
    created: new Date().toISOString(),
    notificationType: "COMMENTED",
    post: { _id: "p1", title: "One", url: "/post/qa/one/p1", deleted: false },
  },
];

const mocks = [
  { request: { query: GET_NOTIFICATIONS }, result: { data: { notifications } } },
  {
    request: { query: MARK_NOTIFICATION_READ, variables: { notificationId: "n1" } },
    result: { data: { markNotificationRead: { _id: "n1", status: "read" } } },
  },
];

function openPanel() {
  useAppStore.setState((s) => ({
    user: { ...s.user, data: { _id: "alice-id", username: "alice" } },
    ui: { ...s.ui, notificationsOpen: true },
  }));
}

describe("NotificationsPanel (updated design)", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("renders nothing for a signed-out visitor", () => {
    useAppStore.setState((s) => ({ ui: { ...s.ui, notificationsOpen: true } }));
    render(<NotificationsPanel />, { mocks });
    expect(screen.queryByTestId("notifications-panel")).not.toBeInTheDocument();
  });

  it("opens as the Notifications dialog with the count and the rows", async () => {
    openPanel();
    render(<NotificationsPanel />, { mocks });

    const panel = await screen.findByTestId("notifications-panel");
    expect(panel).toHaveClass("qv-notif-panel");
    expect(screen.getByRole("dialog", { name: "Notifications" })).toBe(panel);
    expect(await screen.findByText("1 new since you last checked")).toBeInTheDocument();
    expect(screen.getByText("“Nice point”")).toBeInTheDocument();
  });

  it("dims the page behind it, and closes when the dimmed page is clicked", async () => {
    openPanel();
    render(<NotificationsPanel />, { mocks });
    await userEvent.setup().click(await screen.findByTestId("notifications-scrim"));
    expect(useAppStore.getState().ui.notificationsOpen).toBe(false);
  });

  it("closes from its close button", async () => {
    openPanel();
    render(<NotificationsPanel />, { mocks });
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Close notifications" }));
    expect(useAppStore.getState().ui.notificationsOpen).toBe(false);
  });

  it("closes after a notification is opened", async () => {
    openPanel();
    render(<NotificationsPanel />, { mocks });
    await userEvent.setup().click(await screen.findByText(/commented on your post/));
    expect(mockPush).toHaveBeenCalledWith("/post/qa/one/p1");
    expect(useAppStore.getState().ui.notificationsOpen).toBe(false);
  });
});
