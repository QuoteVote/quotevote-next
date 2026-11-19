/**
 * Change Password in Settings (#595 review): the password-change behaviour the
 * old Settings form had (at least 8 characters, sent through `updateUser`),
 * now as its own option under Account.
 */
import { render, screen, fireEvent, waitFor } from "@/__tests__/utils/test-utils";
import ChangePasswordDialog from "@/components/settings/ChangePasswordDialog";
import { UPDATE_USER } from "@/graphql/mutations";
import { toast } from "sonner";

jest.mock("sonner", () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }),
}));

const updatedUser = {
  _id: "user-1",
  username: "testuser",
  email: "test@example.com",
  name: "Test User",
  avatar: null,
  admin: false,
  accountStatus: "active",
  themePreference: "light",
  contributorBadge: false,
};

const passwordMock = (password: string) => ({
  request: { query: UPDATE_USER, variables: { user: { _id: "user-1", password } } },
  result: { data: { updateUser: updatedUser } },
});

const open = () => {
  fireEvent.click(screen.getByRole("button", { name: "Change password" }));
};

const fill = (password: string, confirm = password) => {
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: confirm } });
};

const submit = () => {
  fireEvent.click(
    screen.getByRole("dialog").querySelector('button[type="submit"]') as HTMLButtonElement
  );
};

describe("ChangePasswordDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens a labelled dialog with new and confirm fields", () => {
    render(<ChangePasswordDialog userId="user-1" username="testuser" />);
    open();
    expect(screen.getByRole("dialog", { name: "Change password" })).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("New password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
  });

  it("keeps the 8-character minimum", async () => {
    render(<ChangePasswordDialog userId="user-1" username="testuser" />);
    open();
    fill("short");
    submit();
    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveAttribute("aria-invalid", "true");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("needs both entries to match", async () => {
    render(<ChangePasswordDialog userId="user-1" username="testuser" />);
    open();
    fill("long-enough-1", "long-enough-2");
    submit();
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute("aria-invalid", "true");
  });

  it("sends only the user id and the new password, then closes", async () => {
    render(<ChangePasswordDialog userId="user-1" username="testuser" />, {
      mocks: [passwordMock("brand-new-pass")],
    });
    open();
    fill("brand-new-pass");
    submit();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Password changed"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a server error on the field and stays open", async () => {
    render(<ChangePasswordDialog userId="user-1" username="testuser" />, {
      mocks: [
        {
          request: {
            query: UPDATE_USER,
            variables: { user: { _id: "user-1", password: "brand-new-pass" } },
          },
          result: { errors: [{ message: "Something went wrong" }] },
        },
      ],
    });
    open();
    fill("brand-new-pass");
    submit();
    await waitFor(() =>
      expect(screen.getByLabelText("New password")).toHaveAttribute("aria-invalid", "true")
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows and hides both passwords with one toggle", () => {
    render(<ChangePasswordDialog userId="user-1" username="testuser" />);
    open();
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("New password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("returns focus to Change password when it closes", async () => {
    render(<ChangePasswordDialog userId="user-1" username="testuser" />);
    open();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Change password" })).toHaveFocus()
    );
  });

  it("is unavailable until the account is loaded", () => {
    render(<ChangePasswordDialog userId="" username="" />);
    expect(screen.getByRole("button", { name: "Change password" })).toBeDisabled();
  });

  it("clears what was typed when cancelled", () => {
    render(<ChangePasswordDialog userId="user-1" username="testuser" />);
    open();
    fill("half-typed-pass");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    open();
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
  });
});
