/**
 * App shell redesign: top bar, phone top bar, phone tab bar and nav search.
 */

import { render, screen, fireEvent } from "../utils/test-utils";
import { AppHeader } from "@/components/AppShell/AppHeader";
import { MobileTopBar } from "@/components/AppShell/MobileTopBar";
import { MobileTabBar } from "@/components/AppShell/MobileTabBar";
import { CountBadge } from "@/components/AppShell/CountBadge";
import NavSearch from "@/components/Navbars/NavSearch";
import type { ShellPanels, ShellUser } from "@/types/appShell";

let mockPathname = "/post";
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/DisplayAvatar", () => ({
  DisplayAvatar: () => <div data-testid="avatar" />,
}));

const user: ShellUser = {
  username: "maya",
  avatar: undefined,
  avatarSeed: "maya",
  isAdmin: false,
};

function makePanels(overrides: Partial<ShellPanels> = {}): ShellPanels {
  return {
    chatOpen: false,
    notificationsOpen: false,
    onToggleChat: jest.fn(),
    onToggleNotifications: jest.fn(),
    ...overrides,
  };
}

function renderHeader(counts = { unreadMessages: 3, unreadNotifications: 12 }) {
  const props = {
    user,
    counts,
    panels: makePanels(),
    onCreate: jest.fn(),
    onSignIn: jest.fn(),
    onLogout: jest.fn(),
  };
  render(<AppHeader {...props} />);
  return props;
}

describe("CountBadge", () => {
  it("renders nothing at zero", () => {
    const { container } = render(<CountBadge count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("caps the number at 9+", () => {
    render(<CountBadge count={14} />);
    expect(screen.getByTestId("count-badge")).toHaveTextContent("9+");
  });
});

describe("AppHeader", () => {
  beforeEach(() => {
    mockPathname = "/post";
    jest.clearAllMocks();
  });

  it("links the wordmark home", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "Quote.Vote home" })).toHaveAttribute("href", "/");
  });

  it("puts the unread counts in the button names", () => {
    renderHeader();
    expect(screen.getByRole("button", { name: "Messages, 3 unread" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Notifications, 9 or more new" })
    ).toBeInTheDocument();
  });

  it("uses plain names when nothing is unread", () => {
    renderHeader({ unreadMessages: 0, unreadNotifications: 0 });
    expect(screen.getByRole("button", { name: "Messages" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  });

  it("opens the panels and the composer", () => {
    const props = renderHeader();
    fireEvent.click(screen.getByRole("button", { name: "Create new quote" }));
    fireEvent.click(screen.getByTestId("desktop-messages-button"));
    fireEvent.click(screen.getByTestId("desktop-notifications-button"));
    expect(props.onCreate).toHaveBeenCalledTimes(1);
    expect(props.panels.onToggleChat).toHaveBeenCalledTimes(1);
    expect(props.panels.onToggleNotifications).toHaveBeenCalledTimes(1);
  });

  it("shows Sign in instead of the member buttons when signed out", () => {
    const onSignIn = jest.fn();
    render(
      <AppHeader
        user={null}
        counts={{ unreadMessages: 0, unreadNotifications: 0 }}
        panels={makePanels()}
        onCreate={jest.fn()}
        onSignIn={onSignIn}
        onLogout={jest.fn()}
      />
    );
    expect(screen.queryByTestId("desktop-messages-button")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSignIn).toHaveBeenCalled();
  });
});

describe("NavSearch", () => {
  beforeEach(() => {
    mockPathname = "/post";
  });

  it("focuses the search when / is pressed", () => {
    render(<NavSearch />);
    fireEvent.keyDown(window, { key: "/" });
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus();
  });

  it("leaves / alone while the user is typing somewhere else", () => {
    render(
      <>
        <textarea aria-label="Comment" />
        <NavSearch />
      </>
    );
    const comment = screen.getByRole("textbox", { name: "Comment" });
    comment.focus();
    fireEvent.keyDown(comment, { key: "/" });
    expect(comment).toHaveFocus();
  });

  it("is hidden on home, which has its own search", () => {
    mockPathname = "/";
    render(<NavSearch />);
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
  });
});

describe("MobileTopBar", () => {
  it("offers Search and Menu next to the wordmark", () => {
    const onSearch = jest.fn();
    render(
      <MobileTopBar
        isPostDetail={false}
        loggedIn
        onBack={jest.fn()}
        onShare={jest.fn()}
        onSearch={onSearch}
        onOpenMenu={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(onSearch).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("shows Back and Share on a post", () => {
    render(
      <MobileTopBar
        isPostDetail
        loggedIn={false}
        onBack={jest.fn()}
        onShare={jest.fn()}
        onSearch={jest.fn()}
        onOpenMenu={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open menu" })).not.toBeInTheDocument();
  });
});

describe("MobileTabBar", () => {
  function renderTabBar(overrides: { hidden?: boolean; homeActive?: boolean } = {}) {
    render(
      <MobileTabBar
        user={user}
        counts={{ unreadMessages: 2, unreadNotifications: 0 }}
        panels={makePanels()}
        homeActive={overrides.homeActive ?? true}
        profileActive={false}
        createActive={false}
        hidden={overrides.hidden ?? false}
        onHome={jest.fn()}
        onCreate={jest.fn()}
        onSignIn={jest.fn()}
      />
    );
  }

  it("marks the current tab", () => {
    renderTabBar();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Profile" })).not.toHaveAttribute("aria-current");
  });

  it("shows the unread message count", () => {
    renderTabBar();
    expect(screen.getByRole("button", { name: "Messages" })).toHaveTextContent("2");
  });

  it("hides while the phone discussion is open", () => {
    renderTabBar({ hidden: true });
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
  });
});
