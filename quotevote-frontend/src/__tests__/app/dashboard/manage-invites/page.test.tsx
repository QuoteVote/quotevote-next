import { render, screen, waitFor, within } from "@/__tests__/utils/test-utils";
import { resetStore } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { USER_INVITE_REQUESTS, USER_SENT_INVITES } from "@/graphql/queries";
import { useAppStore } from "@/store/useAppStore";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/manage-invites",
  useSearchParams: () => new URLSearchParams(),
}));

let ManageInvitesClient: React.ComponentType;
beforeAll(async () => {
  const mod = await import("@/app/(dashboard)/manage-invites/ManageInvitesClient");
  ManageInvitesClient = mod.default;
});

const ADMIN_ID = "507f1f77bcf86cd799439011";
const MEMBER_ID = "507f1f77bcf86cd799439012";

const requestsMock = (userInviteRequests: unknown[]) => ({
  request: { query: USER_INVITE_REQUESTS },
  result: { data: { userInviteRequests } },
});

const sentMock = (userId: string, getUserInvites: unknown[]) => ({
  request: { query: USER_SENT_INVITES, variables: { userId } },
  result: { data: { getUserInvites } },
});

const REQUESTS = [
  {
    _id: "inv-1",
    email: "pending@example.com",
    joined: "2026-01-15",
    status: "1",
    signedUp: false,
  },
  {
    _id: "inv-2",
    email: "accepted@example.com",
    joined: "2026-02-20",
    status: "4",
    signedUp: false,
  },
  {
    _id: "inv-3",
    email: "declined@example.com",
    joined: "2026-03-01",
    status: "2",
    signedUp: false,
  },
  { _id: "inv-4", email: "member@example.com", joined: "2026-03-02", status: "4", signedUp: true },
];

const SENT = [
  {
    _id: "sent-1",
    email: "friend@example.org",
    status: "pending",
    joined: "2026-11-10T09:00:00.000Z",
    expiresAt: "2099-01-01T00:00:00.000Z",
  },
  {
    _id: "sent-2",
    email: "late@example.org",
    status: "pending",
    joined: "2026-10-01T09:00:00.000Z",
    expiresAt: "2026-10-08T09:00:00.000Z",
  },
];

function signIn(admin: boolean) {
  useAppStore
    .getState()
    .setUserData({ _id: admin ? ADMIN_ID : MEMBER_ID, username: admin ? "admin" : "alice", admin });
}

describe("Manage Invites Page", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("as an admin", () => {
    const mocks = () => [requestsMock(REQUESTS), sentMock(ADMIN_ID, SENT)];

    it("shows both tabs with their counts, starting on received requests", async () => {
      signIn(true);
      render(<ManageInvitesClient />, { mocks: mocks() });

      expect(screen.getByRole("heading", { name: "Manage Invites" })).toBeInTheDocument();
      const received = await screen.findByRole("tab", { name: /received requests 4/i });
      expect(received).toHaveAttribute("aria-selected", "true");
      expect(await screen.findByRole("tab", { name: /sent invites 2/i })).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });

    it("offers the actions that fit each request", async () => {
      signIn(true);
      render(<ManageInvitesClient />, { mocks: mocks() });

      const row = async (email: string) =>
        within((await screen.findByText(email)).closest("tr") as HTMLElement);

      const pending = await row("pending@example.com");
      expect(pending.getByText("Pending")).toBeInTheDocument();
      expect(pending.getByRole("button", { name: "Accept" })).toBeInTheDocument();
      expect(pending.getByRole("button", { name: "Decline" })).toBeInTheDocument();

      const accepted = await row("accepted@example.com");
      expect(accepted.getByRole("button", { name: "Resend" })).toBeInTheDocument();
      expect(accepted.getByRole("button", { name: "Reset" })).toBeInTheDocument();

      const declined = await row("declined@example.com");
      expect(declined.getByRole("button", { name: "Reset" })).toBeInTheDocument();
      expect(declined.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();

      // Signup is done, so nothing is left to resend or reset.
      const member = await row("member@example.com");
      expect(member.queryByRole("button")).not.toBeInTheDocument();
      expect(member.getByText("Signed up")).toBeInTheDocument();
    });

    it("counts requests in the overview", async () => {
      signIn(true);
      render(<ManageInvitesClient />, { mocks: mocks() });
      await screen.findByText("pending@example.com");

      const overview = screen.getByRole("complementary", { name: "Invite summary" });
      expect(within(overview).getByText("Pending").parentElement).toHaveTextContent("Pending1");
      expect(within(overview).getByText("Accepted").parentElement).toHaveTextContent("Accepted2");
      expect(within(overview).getByText("Declined").parentElement).toHaveTextContent("Declined1");
    });

    it("lists sent invites, with a lapsed link shown as expired", async () => {
      signIn(true);
      const user = userEvent.setup();
      render(<ManageInvitesClient />, { mocks: mocks() });

      await user.click(await screen.findByRole("tab", { name: /sent invites/i }));
      const friend = within(
        (await screen.findByText("friend@example.org")).closest("tr") as HTMLElement
      );
      expect(friend.getByText("Pending")).toBeInTheDocument();
      expect(friend.getByText("Nov 10, 2026")).toBeInTheDocument();
      const late = within(screen.getByText("late@example.org").closest("tr") as HTMLElement);
      expect(late.getByText("Expired")).toBeInTheDocument();
    });

    it("shows the empty state when there are no requests", async () => {
      signIn(true);
      render(<ManageInvitesClient />, { mocks: [requestsMock([]), sentMock(ADMIN_ID, [])] });
      expect(await screen.findByText("No invite requests")).toBeInTheDocument();
    });
  });

  describe("as a member", () => {
    it("shows only the invites they sent, without asking for access requests", async () => {
      signIn(false);
      render(<ManageInvitesClient />, { mocks: [sentMock(MEMBER_ID, SENT)] });

      expect(await screen.findByText("friend@example.org")).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: /received requests/i })).not.toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /sent invites 2/i })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("shows an empty state before they send any", async () => {
      signIn(false);
      render(<ManageInvitesClient />, { mocks: [sentMock(MEMBER_ID, [])] });
      await waitFor(() => expect(screen.getByText("No invites sent yet")).toBeInTheDocument());
    });
  });
});
