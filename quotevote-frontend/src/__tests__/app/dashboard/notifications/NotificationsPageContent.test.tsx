import { renderToString } from "react-dom/server.node";
import { fireEvent, render, screen } from "@testing-library/react";

const mockRefetch = jest.fn();
let mockLoading = false;
let mockData: Record<string, unknown> | null = null;
let mockError: Error | null = null;
let mockHasMounted = true;

jest.mock("@apollo/client/react", () => ({
  useQuery: () => ({
    loading: mockLoading,
    data: mockData,
    refetch: mockRefetch,
    error: mockError,
  }),
  useSubscription: () => ({ data: null }),
  useMutation: () => [jest.fn(), { loading: false }],
  useApolloClient: () => ({
    writeQuery: jest.fn(),
    readQuery: jest.fn(),
  }),
}));

const mockUserId = "user-123";
jest.mock("@/store", () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      user: { data: { id: mockUserId, _id: mockUserId, username: "testuser" } },
      ui: { selectedPost: null },
      setSelectedPost: jest.fn(),
    }),
}));

jest.mock("@/hooks/useGuestGuard", () => ({
  __esModule: true,
  default: () => () => true,
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useHasMounted: () => mockHasMounted,
  useMediaQuery: () => false,
}));

jest.mock("@/hooks/useResponsive", () => ({
  useResponsive: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

import { NotificationsPageContent } from "@/app/(dashboard)/notifications/NotificationsPageContent";

const mockNotifications = [
  {
    _id: "notif-1",
    userId: mockUserId,
    userIdBy: "user-456",
    userBy: {
      _id: "user-456",
      name: "John Doe",
      username: "johndoe",
      avatar: null,
      contributorBadge: false,
    },
    label: "started following you",
    status: "new",
    created: new Date().toISOString(),
    notificationType: "FOLLOW",
  },
];

describe("NotificationsPageContent", () => {
  beforeEach(() => {
    mockRefetch.mockClear();
    mockLoading = false;
    mockData = null;
    mockError = null;
    mockHasMounted = true;
  });

  it("renders the title and inbox controls", () => {
    mockData = { notifications: [] };
    render(<NotificationsPageContent />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByTestId("notifications-inbox")).toBeInTheDocument();
    expect(screen.getByTestId("notification-history-tab")).toBeInTheDocument();
  });

  it("renders loading skeletons when loading", () => {
    mockLoading = true;
    mockData = null;
    const { container } = render(<NotificationsPageContent />);
    const skeletons = container.querySelectorAll(
      '[class*="animate-pulse"], [data-slot="skeleton"]'
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders notification items when data is loaded", () => {
    mockData = { notifications: mockNotifications };
    render(<NotificationsPageContent />);
    expect(screen.getByText(/started following you/)).toBeInTheDocument();
    expect(screen.getByTestId("clear-all-notifications")).toBeInTheDocument();
  });

  it("renders empty state when no notifications", () => {
    mockData = { notifications: [] };
    render(<NotificationsPageContent />);
    expect(screen.getByText(/you're all caught up/i)).toBeInTheDocument();
  });

  // #605: the server doesn't know who is signed in, so its HTML must match the
  // browser's first render whatever the query result is.
  it("renders the loading state on the server even when notifications are cached", () => {
    mockHasMounted = false;
    mockData = { notifications: mockNotifications };
    const html = renderToString(<NotificationsPageContent />);
    expect(html).toContain("Loading notifications");
    expect(html).not.toContain("started following you");
    expect(html).not.toMatch(/all caught up/i);
  });

  it("keeps loading until the first fetch is back, instead of flashing the empty state", () => {
    mockData = null;
    render(<NotificationsPageContent />);
    expect(screen.getByTestId("notifications-loading")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(/you're all caught up/i)).not.toBeInTheDocument();
  });

  it('shows an error with Try again instead of "all caught up" when loading fails', () => {
    mockError = new Error("Network error");
    render(<NotificationsPageContent />);
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load your notifications.");
    expect(screen.queryByText(/you're all caught up/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mockRefetch).toHaveBeenCalledWith();
  });
});
