/**
 * The Notifications inbox (updated design): unread count, Mark all read and the
 * All / Votes / Comments / Quotes / Follows filters.
 */

import { render, screen, resetStore, waitFor, within } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { NotificationsInbox, unreadSummary } from "@/components/Notifications/NotificationsInbox";
import { MARK_ALL_NOTIFICATIONS_READ } from "@/graphql/mutations";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import { useAppStore } from "@/store";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useSubscription: jest.fn(),
}));
jest.mock("@/hooks/useGuestGuard", () => ({ __esModule: true, default: () => () => true }));

const userBy = {
  _id: "bob-id",
  name: "Bob Local",
  avatar: null,
  username: "bob",
  contributorBadge: false,
};
const row = (id: string, notificationType: string, status = "new") => ({
  _id: id,
  userId: "alice-id",
  userIdBy: "bob-id",
  userBy,
  label: `${notificationType} text`,
  status,
  created: new Date().toISOString(),
  notificationType,
  post: { _id: `p-${id}`, title: `Post ${id}`, url: `/post/qa/x/p-${id}`, deleted: false },
});

const notifications = [
  row("n1", "UPVOTED"),
  row("n2", "COMMENTED"),
  row("n3", "QUOTED", "read"),
  row("n4", "FOLLOW", "read"),
  row("n5", "DOWNVOTED"),
];
const listMock = { request: { query: GET_NOTIFICATIONS }, result: { data: { notifications } } };
const markAllMock = {
  request: { query: MARK_ALL_NOTIFICATIONS_READ },
  result: { data: { markAllNotificationsRead: 3 } },
};

beforeEach(() => {
  resetStore();
  useAppStore.setState((s) => ({
    user: { ...s.user, data: { _id: "alice-id", username: "alice" } },
  }));
});

describe("NotificationsInbox (updated design)", () => {
  it("says how many are new", async () => {
    render(<NotificationsInbox />, { mocks: [listMock] });
    expect(await screen.findByText("3 new since you last checked")).toBeInTheDocument();
    expect(unreadSummary(0)).toBe("Nothing new since you last checked");
    expect(screen.getByRole("heading", { level: 1, name: "Notifications" })).toBeInTheDocument();
  });

  it("filters by kind: Votes shows up and down votes only", async () => {
    render(<NotificationsInbox />, { mocks: [listMock] });
    await screen.findAllByTestId("notification-row");
    const tabs = screen.getByRole("tablist", { name: "Filter notifications" });
    expect(
      within(tabs)
        .getAllByRole("tab")
        .map((t) => t.textContent)
    ).toEqual(["All", "Votes", "Comments", "Quotes", "Follows"]);

    await userEvent.setup().click(within(tabs).getByRole("tab", { name: "Votes" }));

    expect(within(tabs).getByRole("tab", { name: "Votes" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    const rows = screen.getAllByTestId("notification-row");
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.getAttribute("data-light"))).toEqual(["up", "down"]);
  });

  it("moves between filters with the arrow keys", async () => {
    render(<NotificationsInbox />, { mocks: [listMock] });
    await screen.findAllByTestId("notification-row");
    const all = screen.getByRole("tab", { name: "All" });
    all.focus();
    await userEvent.setup().keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Votes" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Votes" })).toHaveAttribute("aria-selected", "true");
    await userEvent.setup().keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Follows" })).toHaveAttribute("aria-selected", "true");
  });

  it("shows an empty state for a filter with nothing in it", async () => {
    render(<NotificationsInbox />, {
      mocks: [
        {
          request: { query: GET_NOTIFICATIONS },
          result: { data: { notifications: [row("n1", "FOLLOW")] } },
        },
      ],
    });
    await screen.findAllByTestId("notification-row");
    await userEvent.setup().click(screen.getByRole("tab", { name: "Quotes" }));
    expect(screen.getByTestId("notifications-empty")).toHaveTextContent(
      "No quotes from your posts yet."
    );
  });

  it("marks all read: the count clears and the rows stay listed", async () => {
    render(<NotificationsInbox />, { mocks: [listMock, markAllMock] });
    await screen.findByText("3 new since you last checked");

    await userEvent.setup().click(screen.getByTestId("mark-all-notifications-read"));

    await waitFor(() =>
      expect(screen.getByText("Nothing new since you last checked")).toBeInTheDocument()
    );
    expect(screen.getAllByTestId("notification-row")).toHaveLength(5);
    expect(screen.getByTestId("mark-all-notifications-read")).toBeDisabled();
    expect(screen.queryByText("Unread:")).not.toBeInTheDocument();
  });

  it("has no History or Clear all, which the design dropped", async () => {
    render(<NotificationsInbox />, { mocks: [listMock] });
    await screen.findAllByTestId("notification-row");
    expect(screen.queryByText("History")).not.toBeInTheDocument();
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("shows the close button only when the panel passes one", async () => {
    const onClose = jest.fn();
    const { unmount } = render(<NotificationsInbox />, { mocks: [listMock] });
    expect(screen.queryByRole("button", { name: "Close notifications" })).not.toBeInTheDocument();
    unmount();
    render(<NotificationsInbox onClose={onClose} />, { mocks: [listMock] });
    await userEvent.setup().click(screen.getByRole("button", { name: "Close notifications" }));
    expect(onClose).toHaveBeenCalled();
  });
});
