/**
 * ProfileHeader "Report Bot" flow (#395)
 *
 * Drives the real "More options" menu and the confirm dialog. The older tests in
 * ProfileHeader.test.tsx mock `lucide-react` with four icons only, so the menu and dialog
 * fall into the error boundary there and never exercise reporting. This file does not.
 */

import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within, type MockedResponse } from "../../utils/test-utils";
import { ProfileHeader } from "../../../components/Profile/ProfileHeader";
import { useAppStore } from "@/store";
import type { ProfileUser } from "@/types/profile";
import { GET_CHAT_ROOM, GET_USER_BLOCK_STATUS } from "@/graphql/queries";
import { REPORT_BOT } from "@/graphql/mutations";
import { toast } from "sonner";
import { installMemoryStorage, restoreStorage } from "../../utils/memoryStorage";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/CustomButtons/FollowButton", () => ({
  FollowButton: () => <button type="button">Follow</button>,
}));

const ALREADY_REPORTED_MESSAGE = "You have already reported this user as a bot";

const profileUser = {
  _id: "user1",
  username: "testuser",
  name: "Test User",
  _followingId: [],
  _followersId: [],
} as unknown as ProfileUser;

const loggedInUser = { _id: "currentuser", username: "currentuser", name: "Current User" };

const baseMocks: MockedResponse[] = [
  {
    request: { query: GET_CHAT_ROOM, variables: { otherUserId: "user1" } },
    result: { data: { messageRoom: null } },
  },
  {
    request: { query: GET_USER_BLOCK_STATUS, variables: { userId: "user1" } },
    result: {
      data: { userBlockStatus: { userId: "user1", blockedByMe: false, blockedMe: false } },
    },
  },
];

const reportBotMock = (reportBot: { code: string; message: string }): MockedResponse => ({
  request: { query: REPORT_BOT, variables: { userId: "user1", reporterId: "currentuser" } },
  result: { data: { reportBot } },
});

async function renderAndOpenConfirmDialog(mocks: MockedResponse[]) {
  const user = userEvent.setup();
  render(<ProfileHeader profileUser={profileUser} />, { mocks: [...baseMocks, ...mocks] });

  await user.click(await screen.findByRole("button", { name: /more options/i }));
  await user.click(await screen.findByRole("menuitem", { name: /report bot/i }));
  const dialog = await screen.findByRole("dialog");
  return { user, dialog };
}

describe("ProfileHeader: Report Bot flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installMemoryStorage();
    useAppStore.setState({
      user: { loading: false, loginError: null, data: loggedInUser },
      setSelectedChatRoom: jest.fn(),
      setChatOpen: jest.fn(),
    });
  });

  afterEach(() => {
    restoreStorage();
  });

  it("shows a neutral message and closes the dialog when the user was already reported", async () => {
    const { user, dialog } = await renderAndOpenConfirmDialog([
      reportBotMock({ code: "ALREADY_REPORTED", message: ALREADY_REPORTED_MESSAGE }),
    ]);

    await user.click(within(dialog).getByRole("button", { name: /^report bot$/i }));

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith(ALREADY_REPORTED_MESSAGE));
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("confirms the report and closes the dialog on success", async () => {
    const { user, dialog } = await renderAndOpenConfirmDialog([
      reportBotMock({ code: "SUCCESS", message: "Bot report submitted successfully" }),
    ]);

    await user.click(within(dialog).getByRole("button", { name: /^report bot$/i }));

    // A short headline, with the thanks on its own line underneath.
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("User reported successfully!", {
        description: "Thank you for helping keep Quote.Vote safe.",
      })
    );
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows an error and keeps the dialog open when the request fails", async () => {
    const { user, dialog } = await renderAndOpenConfirmDialog([
      {
        request: { query: REPORT_BOT, variables: { userId: "user1", reporterId: "currentuser" } },
        error: new Error("Not authorized to report on behalf of another user"),
      },
    ]);

    await user.click(within(dialog).getByRole("button", { name: /^report bot$/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Not authorized to report on behalf of another user")
    );
    expect(toast.info).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
