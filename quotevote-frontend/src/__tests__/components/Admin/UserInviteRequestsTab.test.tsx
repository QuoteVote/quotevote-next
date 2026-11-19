import { render, screen, waitFor, within } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import UserInviteRequestsTab from "@/components/Admin/UserInviteRequestsTab";
import { UPDATE_USER_INVITE_STATUS } from "@/graphql/mutations";
import type { InviteRequest } from "@/types/admin";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const invites: InviteRequest[] = Array.from({ length: 12 }, (_, i) => ({
  _id: `inv-${i}`,
  email: `person${String(i).padStart(2, "0")}@example.org`,
  joined: `2026-10-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
  status: i === 0 ? "1" : i === 1 ? "2" : "4",
  signedUp: false,
}));

const rows = () => screen.getAllByRole("row").slice(1);

describe("UserInviteRequestsTab", () => {
  it("shows the counts and the first page sorted by email", () => {
    render(<UserInviteRequestsTab data={invites} onRefresh={jest.fn()} />);
    expect(screen.getByRole("heading", { name: "Invitation Requests" })).toBeInTheDocument();
    expect(screen.getByText("Pending 1")).toBeInTheDocument();
    expect(screen.getByText("Accepted 10")).toBeInTheDocument();
    expect(screen.getByText("Declined 1")).toBeInTheDocument();
    expect(rows()).toHaveLength(10);
    expect(rows()[0]).toHaveTextContent("person00@example.org");
    expect(screen.getByRole("navigation", { name: "Invitation pages" })).toHaveTextContent(
      "Showing 1–10 of 12"
    );
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("pages through the requests", async () => {
    const user = userEvent.setup();
    render(<UserInviteRequestsTab data={invites} onRefresh={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(rows()).toHaveLength(2);
    expect(screen.getByRole("navigation", { name: "Invitation pages" })).toHaveTextContent(
      "Showing 11–12 of 12"
    );
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("searches by email and says when nothing matches", async () => {
    const user = userEvent.setup();
    render(<UserInviteRequestsTab data={invites} onRefresh={jest.fn()} />);
    await user.type(screen.getByLabelText("Search by email"), "person07");
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent("person07@example.org");
    await user.clear(screen.getByLabelText("Search by email"));
    await user.type(screen.getByLabelText("Search by email"), "nobody");
    expect(screen.getByText(/no requests match/i)).toBeInTheDocument();
  });

  it("sorts by a column and flips the order on a second click", async () => {
    const user = userEvent.setup();
    render(<UserInviteRequestsTab data={invites} onRefresh={jest.fn()} />);
    const joined = screen.getByRole("button", { name: /^joined/i });
    await user.click(joined);
    expect(joined.closest("th")).toHaveAttribute("aria-sort", "ascending");
    expect(rows()[0]).toHaveTextContent("Oct 1, 2026");
    await user.click(joined);
    expect(joined.closest("th")).toHaveAttribute("aria-sort", "descending");
    expect(rows()[0]).toHaveTextContent("Oct 12, 2026");
  });

  it("asks before declining, and sends the decline only after confirming", async () => {
    const user = userEvent.setup();
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const decline = {
      request: {
        query: UPDATE_USER_INVITE_STATUS,
        variables: { userId: "inv-0", inviteStatus: "2" },
      },
      result: jest.fn(() => ({ data: { sendUserInviteApproval: { code: "SUCCESS" } } })),
    };
    render(<UserInviteRequestsTab data={invites} onRefresh={onRefresh} />, { mocks: [decline] });

    const row = within(rows()[0]!);
    await user.click(row.getByRole("button", { name: "Decline" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(confirm).toHaveTextContent("person00@example.org won’t get an invite");
    await user.click(within(confirm).getByRole("button", { name: "Cancel" }));
    expect(decline.result).not.toHaveBeenCalled();

    await user.click(row.getByRole("button", { name: "Decline" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Decline" })
    );
    await waitFor(() => expect(decline.result).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  });
});
