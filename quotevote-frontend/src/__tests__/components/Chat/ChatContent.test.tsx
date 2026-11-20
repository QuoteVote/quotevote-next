/**
 * ChatContent Component Tests
 *
 * Tests for the ChatContent component including:
 * - Tab switching (chats, groups, buddies)
 * - Room selection and display
 * - Search functionality
 * - Add Buddy panel, separate from the search (#531)
 * - Status editor
 */

import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import ChatContent from "@/components/Chat/ChatContent";
import { useAppStore } from "@/store";
import { GET_BUDDY_REQUESTS } from "@/graphql/queries";

// Mock useQuery from Apollo Client
const mockUseQuery = jest.fn();
jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

// Mock Zustand store
jest.mock("@/store", () => ({
  useAppStore: jest.fn(),
}));

// Mock usePresenceHeartbeat
jest.mock("@/hooks/usePresenceHeartbeat", () => ({
  usePresenceHeartbeat: jest.fn(),
}));

// Mock Button component
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    "aria-label": ariaLabel,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
}));

// Mock child components
jest.mock("@/components/Chat/ChatSearchInput", () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input
      data-testid="chat-search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search..."
    />
  ),
}));

jest.mock("@/components/Chat/ChatTabs", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    requestCount,
  }: {
    value: string;
    onChange: (event: unknown, newValue: string) => void;
    requestCount?: number;
  }) => (
    <div data-testid="chat-tabs" data-request-count={requestCount}>
      <button onClick={(e) => onChange(e, "chats")} data-active={value === "chats"}>
        Chats
      </button>
      <button onClick={(e) => onChange(e, "groups")} data-active={value === "groups"}>
        Groups
      </button>
      <button onClick={(e) => onChange(e, "buddies")} data-active={value === "buddies"}>
        Buddies
      </button>
    </div>
  ),
}));

jest.mock("@/components/Chat/ChatList", () => ({
  __esModule: true,
  default: ({
    search,
    filterType,
    onSearchChange,
  }: {
    search: string;
    filterType: string;
    onSearchChange?: (value: string) => void;
  }) => (
    <div data-testid="chat-list" data-search={search} data-filter={filterType}>
      Chat List ({filterType})
      <button onClick={() => onSearchChange?.("#Climate")}>tag Climate</button>
    </div>
  ),
}));

jest.mock("@/components/Chat/MessageBox", () => ({
  __esModule: true,
  default: () => <div data-testid="message-box">Message Box</div>,
}));

jest.mock("@/components/BuddyList/BuddyListWithPresence", () => ({
  __esModule: true,
  default: ({ search }: { search: string }) => (
    <div data-testid="buddy-list-with-presence" data-search={search}>
      Buddy List
    </div>
  ),
}));

jest.mock("@/components/Chat/AddBuddyPanel", () => ({
  __esModule: true,
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="add-buddy-panel">
      <button onClick={onBack}>Back to buddies</button>
    </div>
  ),
}));

jest.mock("@/components/Chat/StatusEditor", () => ({
  __esModule: true,
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="status-editor">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
const mockSetChatOpen = jest.fn();

describe("ChatContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useQuery to return empty rooms by default
    mockUseQuery.mockReturnValue({
      data: { messageRooms: [] },
      loading: false,
      error: undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: {
            _id: "user1",
            name: "Test User",
            username: "testuser",
          },
        },
        chat: {
          selectedRoom: null,
          buddyList: [],
          presenceMap: {},
          userStatus: "online",
          userStatusMessage: "",
        },
        setChatOpen: mockSetChatOpen,
      };
      return selector(state as ReturnType<typeof useAppStore>);
    });
  });

  it("renders chat tabs and search input", () => {
    render(<ChatContent />);

    expect(screen.getByTestId("chat-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("chat-search-input")).toBeInTheDocument();
  });

  it("displays chat list when chats tab is active", () => {
    render(<ChatContent />);

    expect(screen.getByTestId("chat-list")).toBeInTheDocument();
    expect(screen.getByTestId("chat-list")).toHaveAttribute("data-filter", "chats");
  });

  it("switches to groups tab when groups button is clicked", () => {
    render(<ChatContent />);

    const groupsButton = screen.getByText("Groups");
    fireEvent.click(groupsButton);

    expect(screen.getByTestId("chat-list")).toHaveAttribute("data-filter", "groups");
  });

  it("switches to buddies tab when buddies button is clicked", () => {
    render(<ChatContent />);

    const buddiesButton = screen.getByText("Buddies");
    fireEvent.click(buddiesButton);

    expect(screen.getByTestId("buddy-list-with-presence")).toBeInTheDocument();
  });

  it("lays out the list and the conversation as two sections", () => {
    render(<ChatContent />);

    const page = screen.getByTestId("chat-page");
    expect(page).toHaveClass("qv-msg");
    expect(page).not.toHaveAttribute("data-open");
    expect(screen.getByRole("heading", { level: 2, name: "Messages" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Conversations" })).toContainElement(
      screen.getByTestId("chat-list")
    );
    expect(screen.getByRole("region", { name: "Conversation" })).toBeInTheDocument();
  });

  it("shows an empty state in the conversation section when no room is selected", () => {
    render(<ChatContent />);

    const convo = screen.getByRole("region", { name: "Conversation" });
    expect(convo).toHaveTextContent("Pick a conversation");
    expect(screen.queryByTestId("message-box")).not.toBeInTheDocument();
  });

  it("displays message box next to the list when room is selected", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: { data: { _id: "user1" } },
        setChatOpen: mockSetChatOpen,
        chat: {
          selectedRoom: "room1",
          buddyList: [],
          presenceMap: {},
          userStatus: "online",
          userStatusMessage: "",
        },
      };
      return selector(state as ReturnType<typeof useAppStore>);
    });

    render(<ChatContent />);

    expect(screen.getByTestId("message-box")).toBeInTheDocument();
    expect(screen.getByTestId("chat-page")).toHaveAttribute("data-open", "true");
    // The list stays beside the conversation; CSS decides what shows on small screens
    expect(screen.getByTestId("chat-list")).toBeInTheDocument();
    expect(screen.queryByText("Pick a conversation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /close chat/i })).not.toBeInTheDocument();
  });

  it("filters chat list by search query", () => {
    render(<ChatContent />);

    const searchInput = screen.getByTestId("chat-search-input");
    fireEvent.change(searchInput, { target: { value: "test search" } });

    expect(screen.getByTestId("chat-list")).toHaveAttribute("data-search", "test search");
  });

  it("opens Add Buddy as its own panel from the Buddies tab, without the search bar (#531)", () => {
    render(<ChatContent />);

    fireEvent.click(screen.getByText("Buddies"));
    fireEvent.click(screen.getByRole("button", { name: "Add buddy" }));

    expect(screen.getByTestId("add-buddy-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-search-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("buddy-list-with-presence")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Back to buddies"));
    expect(screen.getByTestId("buddy-list-with-presence")).toBeInTheDocument();
    expect(screen.getByTestId("chat-search-input")).toBeInTheDocument();
  });

  it("opens Add Buddy from the header on any tab (#531)", () => {
    render(<ChatContent />);

    fireEvent.click(screen.getByRole("button", { name: "Add buddy" }));

    expect(screen.getByTestId("add-buddy-panel")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back to buddies"));
    expect(screen.getByTestId("buddy-list-with-presence")).toBeInTheDocument();
  });

  it("keeps the search unchanged when switching tabs, and lets a tag set it (#531)", () => {
    render(<ChatContent />);

    fireEvent.click(screen.getByText("Groups"));
    fireEvent.click(screen.getByText("tag Climate"));

    expect(screen.getByTestId("chat-search-input")).toHaveValue("#Climate");
    expect(screen.getByTestId("chat-list")).toHaveAttribute("data-search", "#Climate");
  });

  it("opens status editor when status is clicked", () => {
    render(<ChatContent />);

    expect(screen.queryByTestId("status-editor")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Set status" }));

    // Status editor should open
    expect(screen.getByTestId("status-editor")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("status-editor")).not.toBeInTheDocument();
  });

  it('opens status editor from the "Your status" line', () => {
    render(<ChatContent />);

    fireEvent.click(screen.getByRole("button", { name: "Your status: Online" }));

    expect(screen.getByTestId("status-editor")).toBeInTheDocument();
  });

  it("displays user status and status message", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: {
            _id: "user1",
            name: "Test User",
            username: "testuser",
          },
        },
        chat: {
          selectedRoom: null,
          buddyList: [],
          presenceMap: {},
          userStatus: "away",
          userStatusMessage: "Away message",
        },
      };
      return selector(state as ReturnType<typeof useAppStore>);
    });

    render(<ChatContent />);

    expect(screen.getByText("Your status: Away · Away message")).toBeInTheDocument();
  });

  it.each([
    ["dnd", "Do Not Disturb"],
    ["invisible", "Invisible"],
  ])("labels the %s status", (userStatus, label) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) =>
      selector({
        user: { data: { _id: "user1" } },
        chat: { selectedRoom: null, userStatus, userStatusMessage: "" },
        setChatOpen: mockSetChatOpen,
      })
    );

    render(<ChatContent />);

    expect(screen.getByText(`Your status: ${label}`)).toBeInTheDocument();
  });

  it("badges Buddies with incoming pending requests only", () => {
    mockUseQuery.mockImplementation((query) =>
      query === GET_BUDDY_REQUESTS
        ? {
            data: {
              buddyRequests: [
                { _id: "r1", status: "pending", requester: { _id: "user2" } },
                { _id: "r2", status: "pending", requester: { _id: "user3" } },
                // Sent by me: not waiting for my answer
                { _id: "r3", status: "pending", requester: { _id: "user1" } },
                { _id: "r4", status: "accepted", requester: { _id: "user4" } },
              ],
            },
            loading: false,
          }
        : { data: { messageRooms: [] }, loading: false }
    );

    render(<ChatContent />);

    expect(screen.getByTestId("chat-tabs")).toHaveAttribute("data-request-count", "2");
  });

  it("shows no badge without buddy requests", () => {
    render(<ChatContent />);

    expect(screen.getByTestId("chat-tabs")).toHaveAttribute("data-request-count", "0");
  });

  it("renders close chat button and calls setChatOpen(false) when clicked", () => {
    render(<ChatContent />);

    const closeButton = screen.getByRole("button", { name: /close chat/i });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);

    expect(mockSetChatOpen).toHaveBeenCalledWith(false);
  });

  it("handles empty buddy list", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppStore.mockImplementation((selector: any) => {
      const state = {
        user: {
          data: {
            _id: "user1",
            name: "Test User",
            username: "testuser",
          },
        },
        chat: {
          selectedRoom: null,
          buddyList: [],
          presenceMap: {},
          userStatus: "online",
          userStatusMessage: "",
        },
      };
      return selector(state as ReturnType<typeof useAppStore>);
    });

    render(<ChatContent />);

    const buddiesButton = screen.getByText("Buddies");
    fireEvent.click(buddiesButton);

    expect(screen.getByTestId("buddy-list-with-presence")).toBeInTheDocument();
  });
});
