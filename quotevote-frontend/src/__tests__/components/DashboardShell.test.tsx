/**
 * Authenticated mobile sidebar (#492)
 *
 * Profile bottom nav goes to /profile. Account links live in a Sheet drawer
 * matching the guest directory menu pattern.
 */

import { render, screen, within } from "../utils/test-utils";
import userEvent from "@testing-library/user-event";
import { DashboardShell } from "@/components/DashboardShell";
import { useAppStore } from "@/store";

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
jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: () => false }));

jest.mock("@/components/Chat/ChatContent", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/Navbars/NavSearch", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/DashboardSidebars", () => ({
  DashboardSidebars: () => null,
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

    expect(screen.getByRole("button", { name: "Messages" })).toBeInTheDocument();
    await openAccountMenu();

    const menu = screen.getByTestId("authenticated-account-menu");
    expect(within(menu).queryByText("Messages")).not.toBeInTheDocument();
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

    expect(within(menu).getByRole("link", { name: /settings & privacy/i })).toHaveAttribute(
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
