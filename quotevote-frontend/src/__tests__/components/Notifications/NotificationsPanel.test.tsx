/**
 * NotificationsPanel (#532): Notifications as an overlay from the main navigation,
 * on the left on desktop (Messages is on the right) and a bottom sheet on mobile.
 */

import { render, screen, resetStore } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { NotificationsPanel } from "@/components/Notifications/NotificationsPanel";
import { DELETE_NOTIFICATION } from "@/graphql/mutations";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import { useAppStore } from "@/store";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useSubscription: jest.fn(),
}));
jest.mock("@/hooks/useGuestGuard", () => ({
  __esModule: true,
  default: () => () => true,
}));
let mockIsMobile = false;
jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => mockIsMobile,
  useHasMounted: () => true,
}));

const userBy = {
  _id: "bob-id",
  name: "Bob Local",
  avatar: null,
  username: "bob",
  contributorBadge: false,
};

const notifications = [
  {
    _id: "n1",
    userId: "alice-id",
    userIdBy: "bob-id",
    userBy,
    label: "Nice point",
    status: "new",
    created: "2026-10-18T10:00:00.000Z",
    notificationType: "COMMENTED",
    post: { _id: "p1", url: "/post/qa/one/p1", deleted: false },
  },
  {
    _id: "n2",
    userId: "alice-id",
    userIdBy: "bob-id",
    userBy,
    label: "Gone now",
    status: "seen",
    created: "2026-10-17T10:00:00.000Z",
    notificationType: "QUOTED",
    post: { _id: "p2", url: "/post/qa/two/p2", deleted: true },
  },
];

const mocks = [
  { request: { query: GET_NOTIFICATIONS }, result: { data: { notifications } } },
  {
    request: {
      query: DELETE_NOTIFICATION,
      variables: { notificationId: "n1" },
    },
    result: { data: { removeNotification: { _id: "n1", status: "deleted" } } },
  },
];

function openPanel() {
  useAppStore.setState((s) => ({
    user: { ...s.user, data: { _id: "alice-id", username: "alice" } },
    ui: { ...s.ui, notificationsOpen: true },
  }));
}

describe("NotificationsPanel (#532)", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    mockIsMobile = false;
  });

  it("renders nothing for a signed-out visitor", () => {
    useAppStore.setState((s) => ({ ui: { ...s.ui, notificationsOpen: true } }));
    render(<NotificationsPanel />, { mocks });
    expect(screen.queryByTestId("notifications-panel")).not.toBeInTheDocument();
  });

  it("opens from the left on desktop with the list and the new count", async () => {
    openPanel();
    render(<NotificationsPanel />, { mocks });

    const panel = await screen.findByTestId("notifications-panel");
    expect(panel).toHaveClass("left-0");
    expect(screen.getByRole("dialog", { name: "Notifications" })).toBe(panel);
    expect(await screen.findByText("Nice point", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("1 new")).toBeInTheDocument();
    expect(screen.getByText("This post has been deleted")).toBeInTheDocument();
  });

  it("opens as a bottom sheet above the tab bar on mobile", async () => {
    mockIsMobile = true;
    openPanel();
    render(<NotificationsPanel />, { mocks });

    const panel = await screen.findByTestId("notifications-panel");
    expect(panel).toHaveClass("bottom-[56px]");
    expect(panel).not.toHaveClass("left-0");
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
