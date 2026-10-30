/**
 * Authenticated mobile sidebar (#492)
 *
 * Profile bottom nav goes to /profile. Account links live in a Sheet drawer
 * matching the guest directory menu pattern.
 */

import { render, screen, within, fireEvent } from "../utils/test-utils";
import userEvent from "@testing-library/user-event";
import { DashboardShell } from "@/components/DashboardShell";
import { useAppStore } from "@/store";
import { useQuery } from "@apollo/client/react";
import { GET_CHAT_ROOMS, GET_NOTIFICATIONS } from "@/graphql/queries";

const mockUseQuery = useQuery as unknown as jest.Mock;

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useQuery: jest.fn(() => ({ data: undefined, loading: false, error: undefined })),
}));

jest.mock("@/lib/apollo", () => ({
  getApolloClient: () => ({ stop: jest.fn(), resetStore: jest.fn() }),
}));

jest.mock("@/hooks/usePresenceHeartbeat", () => ({ usePresenceHeartbeat: jest.fn() }));
jest.mock("@/hooks/usePresenceSubscription", () => ({ usePresenceSubscription: jest.fn() }));
jest.mock("@/hooks/useRosterManagement", () => ({ useRosterManagement: jest.fn() }));
jest.mock("@/hooks/useSyncCurrentUserProfile", () => ({ useSyncCurrentUserProfile: jest.fn() }));
jest.mock("@/hooks/useSyncCurrentUserPresence", () => ({ useSyncCurrentUserPresence: jest.fn() }));
jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: () => false }));

jest.mock("@/components/Chat/ChatContent", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/Navbars/NavSearch", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/Notifications/NotificationsPanel", () => ({
  NotificationsPanel: () => <div data-testid="notifications-panel-mount" />,
}));
jest.mock("@/components/SubmitPost", () => ({
  SubmitPost: () => null,
  SUBMIT_POST_DIALOG_CLASS: "",
}));
jest.mock("@/components/DisplayAvatar", () => ({
  DisplayAvatar: () => <div data-testid="avatar" />,
}));

const regularUser = {
  id: "user-1",
  _id: "user-1",
  username: "regular",
  name: "Regular User",
  admin: false,
};

const adminUser = {
  ...regularUser,
  id: "admin-1",
  _id: "admin-1",
  username: "admin",
  name: "Admin User",
  admin: true,
};

async function openAccountMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Open menu" }));
  return user;
}

describe("DashboardShell authenticated sidebar (#492)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.getState().resetStore();
  });

  it("does not show the account menu button when logged out", () => {
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    expect(screen.queryByRole("button", { name: "Open menu" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Sign in" }).length).toBeGreaterThan(0);
  });

  it("lets authenticated users open the sidebar", async () => {
    useAppStore.getState().setUserData(regularUser);
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    await openAccountMenu();
    expect(screen.getByTestId("authenticated-account-menu")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Menu" })).toBeInTheDocument();
  });

  it("links Profile in the bottom nav directly to the user profile", () => {
    useAppStore.getState().setUserData(regularUser);
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    const profile = screen.getByRole("link", { name: "Profile" });
    expect(profile).toHaveAttribute("href", "/profile");
  });

  it("keeps Messages in the bottom nav and omits it from the sidebar", async () => {
    useAppStore.getState().setUserData(regularUser);
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    expect(screen.getAllByRole("button", { name: "Messages" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("desktop-messages-button")).toBeInTheDocument();
    await openAccountMenu();

    const menu = screen.getByTestId("authenticated-account-menu");
    expect(within(menu).queryByText("Messages")).not.toBeInTheDocument();
  });

  it("opens the messages panel from the desktop navbar button", async () => {
    useAppStore.getState().setUserData(regularUser);
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    fireEvent.click(screen.getByTestId("desktop-messages-button"));
    expect(useAppStore.getState().chat.open).toBe(true);
  });

  it("includes Settings, Donate, GitHub, and Sign Out in the sidebar", async () => {
    useAppStore.getState().setUserData(regularUser);
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    await openAccountMenu();
    const menu = screen.getByTestId("authenticated-account-menu");

    expect(within(menu).getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings"
    );
    expect(within(menu).getByRole("link", { name: /donate/i })).toHaveAttribute(
      "href",
      "https://opencollective.com/quotevote/donate"
    );
    expect(within(menu).getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/QuoteVote/quotevote-next"
    );
    expect(within(menu).getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("hides Admin Panel for non-admins", async () => {
    useAppStore.getState().setUserData(regularUser);
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    await openAccountMenu();
    expect(
      within(screen.getByTestId("authenticated-account-menu")).queryByRole("link", {
        name: /admin panel/i,
      })
    ).not.toBeInTheDocument();
  });

  it("shows Admin Panel only for admins", async () => {
    useAppStore.getState().setUserData(adminUser);
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    await openAccountMenu();
    expect(
      within(screen.getByTestId("authenticated-account-menu")).getByRole("link", {
        name: /admin panel/i,
      })
    ).toHaveAttribute("href", "/control-panel");
  });

  it("signs out from the sidebar", async () => {
    useAppStore.getState().setUserData(regularUser);
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    await openAccountMenu();
    await userEvent.click(
      within(screen.getByTestId("authenticated-account-menu")).getByRole("button", {
        name: /sign out/i,
      })
    );

    expect(useAppStore.getState().user.data._id).toBeUndefined();
    expect(mockPush).toHaveBeenCalledWith("/auths/login");
  });
});

describe("DashboardShell notifications in the main navigation (#532)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.getState().resetStore();
    useAppStore.getState().setUserData(regularUser);
  });

  function renderShell() {
    return render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );
  }

  it("toggles the Notifications panel from the desktop navbar", () => {
    renderShell();
    const bell = screen.getByTestId("desktop-notifications-button");
    expect(bell).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(bell);
    expect(useAppStore.getState().ui.notificationsOpen).toBe(true);
    expect(bell).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(bell);
    expect(useAppStore.getState().ui.notificationsOpen).toBe(false);
  });

  it("keeps Messages open on desktop when Notifications opens", () => {
    renderShell();
    fireEvent.click(screen.getByTestId("desktop-messages-button"));
    fireEvent.click(screen.getByTestId("desktop-notifications-button"));

    expect(useAppStore.getState().chat.open).toBe(true);
    expect(useAppStore.getState().ui.notificationsOpen).toBe(true);
  });

  it("opens the panel from the mobile tab instead of leaving the page", () => {
    renderShell();
    const tab = screen.getByTestId("mobile-notifications-button");
    expect(tab).toHaveTextContent("Notifications");

    fireEvent.click(tab);
    expect(useAppStore.getState().ui.notificationsOpen).toBe(true);
    expect(mockPush).not.toHaveBeenCalledWith("/notifications");
  });

  it("shows only one bottom sheet at a time on mobile", () => {
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });

    fireEvent.click(within(nav).getByRole("button", { name: "Messages" }));
    expect(useAppStore.getState().chat.open).toBe(true);

    fireEvent.click(screen.getByTestId("mobile-notifications-button"));
    expect(useAppStore.getState().ui.notificationsOpen).toBe(true);
    expect(useAppStore.getState().chat.open).toBe(false);

    fireEvent.click(within(nav).getByRole("button", { name: "Messages" }));
    expect(useAppStore.getState().chat.open).toBe(true);
    expect(useAppStore.getState().ui.notificationsOpen).toBe(false);
  });

  it("announces the number of new notifications on both buttons", () => {
    mockUseQuery.mockImplementation((query: unknown) =>
      query === GET_NOTIFICATIONS
        ? {
            data: {
              notifications: [
                { _id: "a", status: "new" },
                { _id: "b", status: "new" },
                { _id: "c", status: "seen" },
              ],
            },
            loading: false,
          }
        : { data: undefined, loading: false }
    );
    renderShell();

    expect(screen.getByTestId("desktop-notifications-button")).toHaveAccessibleName(
      "Notifications, 2 new"
    );
    expect(screen.getByTestId("mobile-notifications-button")).toHaveAccessibleName(
      "Notifications, 2 new"
    );
    mockUseQuery.mockImplementation(() => ({ data: undefined, loading: false }));
  });

  it("mounts the panel only for signed-in users", () => {
    renderShell();
    expect(screen.getByTestId("notifications-panel-mount")).toBeInTheDocument();
  });

  it("closes the panel on sign-out", () => {
    renderShell();
    fireEvent.click(screen.getByTestId("desktop-notifications-button"));
    useAppStore.getState().logout();
    expect(useAppStore.getState().ui.notificationsOpen).toBe(false);
  });
});

describe("DashboardShell account dropdown (#536)", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("names the item Settings and drops the subtext under each item", async () => {
    useAppStore.getState().setUserData(regularUser);
    const user = userEvent.setup();
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    // The desktop navbar trigger (the mobile one opens the Sheet instead).
    const trigger = screen
      .getAllByTestId("user-profile-menu")
      .find((el) => el.getAttribute("aria-haspopup") === "menu");
    await user.click(trigger!);
    const menu = await screen.findByRole("menu");

    expect(within(menu).getByRole("menuitem", { name: "Your Profile" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Settings" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
    for (const subtext of [
      "View and edit profile",
      "Manage your account",
      "See you next time!",
      "Settings & Privacy",
    ]) {
      expect(within(menu).queryByText(subtext)).not.toBeInTheDocument();
    }

    await user.click(within(menu).getByRole("menuitem", { name: "Settings" }));
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });
});

describe("DashboardShell chat rooms in background tabs (#625)", () => {
  afterEach(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    mockUseQuery.mockImplementation(() => ({ data: undefined, loading: false }));
  });

  it("refetches chat rooms when the tab becomes visible again", () => {
    const refetchRooms = jest.fn().mockResolvedValue({});
    mockUseQuery.mockImplementation((query: unknown) =>
      query === GET_CHAT_ROOMS
        ? { data: undefined, loading: false, refetch: refetchRooms }
        : { data: undefined, loading: false }
    );
    useAppStore.getState().setUserData(regularUser);
    render(
      <DashboardShell>
        <div>feed</div>
      </DashboardShell>
    );

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(refetchRooms).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(refetchRooms).toHaveBeenCalledTimes(1);
  });
});
