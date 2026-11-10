/**
 * NotificationLists navigation (#532): deleted posts get an explicit state, and the
 * panel can close itself after a notification is opened.
 */

import { renderToString } from "react-dom/server.node";
import { ApolloProvider } from "@apollo/client/react";
import { createMockApolloClient, render, screen, within } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { NotificationLists } from "@/components/Notifications/NotificationLists";
import { DELETE_NOTIFICATION } from "@/graphql/mutations";
import type { Notification } from "@/types/notification";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/hooks/useGuestGuard", () => ({
  __esModule: true,
  default: () => () => true,
}));

function deleteMock(notificationId: string) {
  return {
    request: {
      query: DELETE_NOTIFICATION,
      variables: { notificationId },
    },
    result: {
      data: { removeNotification: { _id: notificationId, status: "deleted" } },
    },
  };
}

const base = {
  userId: "alice-id",
  userIdBy: "bob-id",
  userBy: { _id: "bob-id", name: "Bob Local", username: "bob" },
  status: "new",
  created: new Date().toISOString(),
};

const commentOnLivePost: Notification = {
  ...base,
  _id: "n-live",
  label: "Nice point",
  notificationType: "COMMENTED",
  post: { _id: "post-live", url: "/post/qa/live/post-live", deleted: false },
};

const commentOnDeletedPost: Notification = {
  ...base,
  _id: "n-deleted",
  label: "Commenting before it goes away",
  notificationType: "COMMENTED",
  post: { _id: "post-gone", url: "/post/qa/gone/post-gone", deleted: true },
};

const follow: Notification = {
  ...base,
  _id: "n-follow",
  label: "",
  notificationType: "FOLLOW",
};

describe("NotificationLists (#532)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("marks a notification whose post was deleted", () => {
    render(
      <NotificationLists notifications={[commentOnLivePost, commentOnDeletedPost]} pageView />
    );
    expect(screen.getAllByText("This post has been deleted")).toHaveLength(1);
  });

  it("opens a deleted post with the deleted flag so the page can explain it", async () => {
    const onNavigate = jest.fn();
    render(
      <NotificationLists notifications={[commentOnDeletedPost]} pageView onNavigate={onNavigate} />,
      { mocks: [deleteMock("n-deleted")] }
    );

    await userEvent.setup().click(screen.getByText(/commented on your post/));
    expect(mockPush).toHaveBeenCalledWith("/post/qa/gone/post-gone?deleted=1");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("opens a live post as before, clears it into history, and reports the navigation", async () => {
    const onNavigate = jest.fn();
    render(
      <NotificationLists notifications={[commentOnLivePost]} pageView onNavigate={onNavigate} />,
      { mocks: [deleteMock("n-live")] }
    );

    await userEvent.setup().click(screen.getByText(/commented on your post/));
    expect(mockPush).toHaveBeenCalledWith("/post/qa/live/post-live");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("opens the follower's profile for a follow, from the keyboard too", async () => {
    const onNavigate = jest.fn();
    render(<NotificationLists notifications={[follow]} pageView onNavigate={onNavigate} />, {
      mocks: [deleteMock("n-follow")],
    });

    screen.getByRole("button", { name: /started following you/ }).focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(mockPush).toHaveBeenCalledWith("/profile/bob");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("keeps history rows clickable without a clear control", async () => {
    const onNavigate = jest.fn();
    render(
      <NotificationLists
        notifications={[{ ...commentOnLivePost, status: "deleted" }]}
        pageView
        mode="history"
        onNavigate={onNavigate}
      />
    );

    expect(screen.queryByRole("button", { name: /Clear notification/ })).not.toBeInTheDocument();
    expect(screen.getByText("Cleared")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByText(/commented on your post/));
    expect(mockPush).toHaveBeenCalledWith("/post/qa/live/post-live");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("renders legacy history rows with no sender without crashing", async () => {
    const onNavigate = jest.fn();
    const orphan: Notification = {
      ...commentOnLivePost,
      _id: "n-orphan",
      status: "deleted",
      userBy: null,
      userIdBy: null,
    };

    render(
      <NotificationLists notifications={[orphan]} pageView mode="history" onNavigate={onNavigate} />
    );

    expect(screen.getByText("Someone")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByText(/commented on your post/));
    expect(mockPush).toHaveBeenCalledWith("/post/qa/live/post-live");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("does not navigate a FOLLOW notification when the sender has no username", async () => {
    const onNavigate = jest.fn();
    render(
      <NotificationLists
        notifications={[{ ...follow, userBy: null }]}
        pageView
        onNavigate={onNavigate}
      />
    );

    await userEvent.setup().click(screen.getByText(/started following you/));
    expect(mockPush).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("doesn't nest a second scroll area in the panel", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ ...commentOnLivePost, _id: `n-${i}` }));
    const { container } = render(<NotificationLists notifications={many} pageView />);
    expect(container.querySelector(".max-h-\\[75vh\\]")).toBeNull();
  });

  it("keeps Clear beside the row, not inside it, and names whose notification it clears", () => {
    render(<NotificationLists notifications={[follow]} pageView />);
    const row = screen.getByRole("button", { name: /started following you/ });
    const del = screen.getByRole("button", { name: "Clear notification from Bob Local" });
    expect(row).not.toContainElement(del);
    expect(within(row).queryByRole("button")).toBeNull();
  });

  it("shows the time in a machine-readable element, reading millisecond strings too", () => {
    const at = new Date("2026-03-01T12:00:00.000Z");
    render(
      <NotificationLists notifications={[{ ...follow, created: String(at.getTime()) }]} pageView />
    );
    const time = screen.getByTestId("notification-time");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", at.toISOString());
    expect(time.textContent).toMatch(/2026|at/);
  });

  it("leaves the time text out of the server HTML, since it depends on the time zone (#605)", () => {
    const html = renderToString(
      <ApolloProvider client={createMockApolloClient()}>
        <NotificationLists notifications={[follow]} pageView />
      </ApolloProvider>
    );
    expect(html).toContain("started following you");
    expect(html).not.toMatch(/Today at|Yesterday at/);
  });
});
