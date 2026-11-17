/**
 * NotificationsInbox clear-all focus (#464 / Moti): after Clear all removes the
 * focused control, keyboard focus returns to the Active tab.
 */

import { waitFor } from "@testing-library/react";
import { render, screen, resetStore } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { NotificationsInbox } from "@/components/Notifications/NotificationsInbox";
import { CLEAR_ALL_NOTIFICATIONS } from "@/graphql/mutations";
import {
  GET_NOTIFICATIONS,
  GET_NOTIFICATION_HISTORY,
  NOTIFICATION_HISTORY_LIMIT,
} from "@/graphql/queries";
import { useAppStore } from "@/store";

jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useSubscription: jest.fn(),
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useHasMounted: () => true,
  useMediaQuery: () => false,
}));

const notifications = [
  {
    _id: "n1",
    userId: "alice-id",
    userIdBy: "bob-id",
    userBy: { _id: "bob-id", name: "Bob Local", username: "bob" },
    label: "",
    status: "new",
    created: "2026-10-18T10:00:00.000Z",
    notificationType: "FOLLOW",
  },
];

const mocks = [
  { request: { query: GET_NOTIFICATIONS }, result: { data: { notifications } } },
  {
    request: {
      query: GET_NOTIFICATION_HISTORY,
      variables: { limit: NOTIFICATION_HISTORY_LIMIT },
    },
    result: { data: { notificationHistory: [] } },
  },
  {
    request: { query: CLEAR_ALL_NOTIFICATIONS },
    result: { data: { clearAllNotifications: 1 } },
  },
  {
    request: { query: GET_NOTIFICATIONS },
    result: { data: { notifications: [] } },
  },
  {
    request: {
      query: GET_NOTIFICATION_HISTORY,
      variables: { limit: NOTIFICATION_HISTORY_LIMIT },
    },
    result: { data: { notificationHistory: [] } },
  },
];

describe("NotificationsInbox clear-all focus (#464)", () => {
  beforeEach(() => {
    resetStore();
    useAppStore.setState((s) => ({
      user: { ...s.user, data: { _id: "alice-id", username: "alice" } },
    }));
  });

  it("moves focus to the Active tab after Clear all", async () => {
    const user = userEvent.setup();
    render(<NotificationsInbox pageView />, { mocks });

    const clearAll = await screen.findByTestId("clear-all-notifications");
    clearAll.focus();
    expect(clearAll).toHaveFocus();

    await user.click(clearAll);

    await waitFor(() => {
      expect(screen.queryByTestId("clear-all-notifications")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Active$/ })).toHaveFocus();
    });
  });
});
