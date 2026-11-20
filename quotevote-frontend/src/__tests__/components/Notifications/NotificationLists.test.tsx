/**
 * Notification rows in the updated design: Today / Earlier groups, the excerpt per kind,
 * opening a notification reads it (it stays listed), and × deletes it.
 */

import { renderToString } from "react-dom/server.node";
import { ApolloProvider, useQuery } from "@apollo/client/react";
import {
  createMockApolloClient,
  render,
  screen,
  waitFor,
  within,
} from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import {
  NotificationLists,
  groupByDay,
  notificationExcerpt,
} from "@/components/Notifications/NotificationLists";
import { DELETE_NOTIFICATION, MARK_NOTIFICATION_READ } from "@/graphql/mutations";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import type { Notification } from "@/types/notification";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/hooks/useGuestGuard", () => ({ __esModule: true, default: () => () => true }));

const now = new Date().toISOString();
const lastWeek = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString();

const base = {
  userId: "alice-id",
  userIdBy: "bob-id",
  userBy: { _id: "bob-id", name: "Bob Local", username: "bob", avatar: null as unknown as undefined, contributorBadge: false },
  status: "new",
  created: now,
};

const comment: Notification = {
  ...base,
  _id: "n-comment",
  label: "Nice point",
  notificationType: "COMMENTED",
  post: { _id: "post-live", title: "Live post", url: "/post/qa/live/post-live", deleted: false },
};
const upvote: Notification = {
  ...base,
  _id: "n-up",
  label: "the voted words",
  notificationType: "UPVOTED",
  post: { _id: "post-up", title: "Should the city price parking?", url: "/post/qa/up/post-up", deleted: false },
};
const onDeletedPost: Notification = {
  ...base,
  _id: "n-deleted",
  label: "Four-day weeks",
  notificationType: "DOWNVOTED",
  post: {
    _id: "post-gone",
    title: "Four-day weeks",
    url: "/post/qa/gone/post-gone",
    deleted: true,
  },
};
const follow: Notification = {
  ...base,
  _id: "n-follow",
  label: "",
  status: "read",
  created: lastWeek,
  notificationType: "FOLLOW",
  post: null as unknown as undefined,
};
const followTwo: Notification = {
  ...follow,
  _id: "n-follow-2",
  userBy: { _id: "cara-id", name: "Cara Local", username: "cara", avatar: null as unknown as undefined, contributorBadge: false },
};

const markReadMock = (id: string) => ({
  request: { query: MARK_NOTIFICATION_READ, variables: { notificationId: id } },
  result: { data: { markNotificationRead: { _id: id, status: "read" } } },
});
const deleteMock = (id: string) => ({
  request: { query: DELETE_NOTIFICATION, variables: { notificationId: id } },
  result: { data: { removeNotification: { _id: id, status: "deleted" } } },
});
const listMock = (items: Notification[]) => ({
  request: { query: GET_NOTIFICATIONS },
  result: { data: { notifications: items } },
});

/** The list as the inbox shows it: rows come from the Apollo cache. */
function CachedList({ onListEmptied }: { onListEmptied?: () => void }) {
  const { data } = useQuery<{ notifications?: Notification[] }>(GET_NOTIFICATIONS);
  return (
    <NotificationLists notifications={data?.notifications ?? []} onListEmptied={onListEmptied} />
  );
}

describe("NotificationLists (updated design)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("groups rows into Today and Earlier", () => {
    render(<NotificationLists notifications={[comment, follow]} />);
    expect(screen.getByRole("region", { name: "Today" })).toHaveTextContent("Bob Local");
    expect(screen.getByRole("region", { name: "Earlier" })).toHaveTextContent(
      "started following you"
    );
    expect(groupByDay([follow]).map((g) => g.label)).toEqual(["Earlier"]);
  });

  it("shows the post title for votes, the text for comments and quotes, nothing for follows", () => {
    expect(notificationExcerpt(upvote)).toBe("Should the city price parking?");
    expect(notificationExcerpt(comment)).toBe("Nice point");
    expect(notificationExcerpt(follow)).toBeNull();

    render(<NotificationLists notifications={[upvote, comment]} />);
    expect(screen.getByText("“Should the city price parking?”")).toBeInTheDocument();
    expect(screen.getByText("“Nice point”")).toBeInTheDocument();
  });

  it("colours each row by its kind and says when the post was deleted", () => {
    render(<NotificationLists notifications={[upvote, onDeletedPost]} />);
    const rows = screen.getAllByTestId("notification-row");
    expect(rows[0]).toHaveAttribute("data-light", "up");
    expect(rows[1]).toHaveAttribute("data-light", "down");
    expect(within(rows[1]).getByText("This post has been deleted")).toBeInTheDocument();
  });

  it("marks unread rows for screen readers", () => {
    render(<NotificationLists notifications={[comment, follow]} />);
    const [unread, read] = screen.getAllByTestId("notification-row");
    expect(unread).toHaveAttribute("data-unread", "true");
    expect(within(unread).getByText("Unread:")).toBeInTheDocument();
    expect(read).not.toHaveAttribute("data-unread");
  });

  it("opens a live post, reports the navigation and marks it read, keeping it listed", async () => {
    const onNavigate = jest.fn();
    const client = createMockApolloClient([listMock([comment]), markReadMock("n-comment")]);
    await client.query({ query: GET_NOTIFICATIONS });
    render(
      <ApolloProvider client={client}>
        <NotificationLists notifications={[comment]} onNavigate={onNavigate} />
      </ApolloProvider>
    );

    await userEvent.setup().click(screen.getByText(/commented on your post/));

    expect(mockPush).toHaveBeenCalledWith("/post/qa/live/post-live");
    expect(onNavigate).toHaveBeenCalledTimes(1);
    const cached = client.readQuery<{ notifications: Notification[] }>({
      query: GET_NOTIFICATIONS,
    });
    expect(cached?.notifications).toEqual([
      expect.objectContaining({ _id: "n-comment", status: "read" }),
    ]);
  });

  it("opens a deleted post with the deleted flag so the page can explain it", async () => {
    render(<NotificationLists notifications={[onDeletedPost]} />, {
      mocks: [markReadMock("n-deleted")],
    });
    await userEvent.setup().click(screen.getByText(/downvoted your post/));
    expect(mockPush).toHaveBeenCalledWith("/post/qa/gone/post-gone?deleted=1");
  });

  it("opens the follower's profile, from the keyboard too", async () => {
    render(<NotificationLists notifications={[follow]} />);
    screen.getByRole("button", { name: /started following you/ }).focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(mockPush).toHaveBeenCalledWith("/profile/bob");
  });

  it("deletes a row with × and moves focus to the next delete button", async () => {
    const client = createMockApolloClient([
      listMock([follow, followTwo]),
      deleteMock("n-follow"),
      listMock([followTwo]),
    ]);
    render(
      <ApolloProvider client={client}>
        <CachedList />
      </ApolloProvider>
    );

    const del = await screen.findByRole("button", { name: "Delete notification from Bob Local" });
    await userEvent.setup().click(del);

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Delete notification from Bob Local" })
      ).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "Delete notification from Cara Local" })
    ).toHaveFocus();
  });

  it("hands focus back when the last row is deleted", async () => {
    const onListEmptied = jest.fn();
    const client = createMockApolloClient([
      listMock([follow]),
      deleteMock("n-follow"),
      listMock([]),
    ]);
    render(
      <ApolloProvider client={client}>
        <CachedList onListEmptied={onListEmptied} />
      </ApolloProvider>
    );

    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: /Delete notification/ }));
    await waitFor(() => expect(onListEmptied).toHaveBeenCalled());
    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
  });

  it("names a sender it doesn't know Someone", () => {
    render(<NotificationLists notifications={[{ ...comment, userBy: null }]} />);
    expect(screen.getByText("Someone")).toBeInTheDocument();
  });

  it("leaves the time out of the server render, so it reads in the viewer's time zone", () => {
    const html = renderToString(
      <ApolloProvider client={createMockApolloClient()}>
        <NotificationLists notifications={[comment]} />
      </ApolloProvider>
    );
    expect(html).not.toContain("notification-time");
  });
});
