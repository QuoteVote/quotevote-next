/**
 * Avatar editor (#656): picture tiles in four tabs, contextual controls, save with the
 * same 13-key format, and the unsaved-changes guard.
 */
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@/__tests__/utils/test-utils";
import { resetStore } from "@/__tests__/utils/test-utils";
import { installMemoryStorage, restoreStorage } from "@/__tests__/utils/memoryStorage";
import { UPDATE_USER_AVATAR } from "@/graphql/mutations";
import { GET_USER } from "@/graphql/queries";
import { completeDraft } from "@/lib/avatar";
import { useAppStore } from "@/store/useAppStore";

const mockPush = jest.fn();
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => mockToastError(...a),
    success: (...a: unknown[]) => mockToastSuccess(...a),
  },
  Toaster: () => null,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/profile/testuser/avatar",
  useSearchParams: () => new URLSearchParams(),
}));

let AvatarEditorPage: React.ComponentType;
beforeAll(async () => {
  AvatarEditorPage = (await import("@/app/(dashboard)/profile/[username]/avatar/page")).default;
});

const saved = completeDraft(
  {
    topType: "LongHairBun",
    accessoriesType: "Blank",
    hairColor: "BrownDark",
    facialHairType: "Blank",
    clotheType: "ShirtCrewNeck",
    clotheColor: "Gray01",
    eyeType: "Default",
    eyebrowType: "Default",
    mouthType: "Default",
    skinColor: "Brown",
  },
  "testuser"
);

const setUser = (avatar: string | Record<string, unknown>): void => {
  useAppStore.getState().setUserData({ _id: "user-1", id: "user-1", username: "testuser", avatar });
};

const userRefetch = {
  request: { query: GET_USER, variables: { username: "testuser" } },
  result: {
    data: {
      user: {
        _id: "user-1",
        name: "Test",
        username: "testuser",
        upvotes: 0,
        downvotes: 0,
        _followingId: [],
        _followersId: [],
        avatar: null,
        contributorBadge: false,
        reputation: null,
      },
    },
  },
};

const saveMock = (avatarQualities: Record<string, string>, error?: string) => ({
  request: { query: UPDATE_USER_AVATAR, variables: { user_id: "user-1", avatarQualities } },
  result: error
    ? { errors: [{ message: error }] }
    : {
        data: {
          updateUserAvatar: {
            _id: "user-1",
            username: "testuser",
            name: "Test",
            email: null,
            avatar: avatarQualities,
          },
        },
      },
});

describe("Avatar editor page (#656)", () => {
  beforeEach(() => {
    installMemoryStorage();
    resetStore();
    mockPush.mockClear();
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
    setUser(saved);
  });
  afterEach(() => restoreStorage());

  it("shows the editor with the saved avatar picked and no unsaved changes", () => {
    render(<AvatarEditorPage />);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toContain(
      "Customize your avatar"
    );
    expect(screen.getByRole("tab", { name: "Hair" })).toHaveAttribute("aria-selected", "true");
    const textured = screen.getByRole("radiogroup", { name: "Locs and textured hairstyles" });
    expect(within(textured).getByRole("radio", { name: "Dreadlocks" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Top bun" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument();
  });

  it("picks a tile, counts the change and filters hairstyles", async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    await user.click(screen.getByRole("radio", { name: "Dreadlocks" }));
    expect(screen.getByRole("radio", { name: "Dreadlocks" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByText(/1 change$/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Headwear/ }));
    expect(screen.queryByRole("radio", { name: "Dreadlocks" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Hijab" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^All/ }));
    await user.type(screen.getByRole("searchbox"), "afro");
    expect(screen.getByRole("radio", { name: "Afro" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Bob" })).not.toBeInTheDocument();
  });

  it("moves and picks with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    screen.getByRole("radio", { name: "Short flat" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Short round" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: "Short round" })).toHaveFocus();
  });

  it("shows facial hair color only once a beard is picked, and moods set the face", async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    await user.click(screen.getByRole("tab", { name: "Face" }));
    expect(screen.queryByRole("radiogroup", { name: "Facial hair color" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Beard" }));
    expect(screen.getByRole("radiogroup", { name: "Facial hair color" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Cheerful" }));
    const eyes = screen.getByRole("radiogroup", { name: "Eyes" });
    expect(within(eyes).getByRole("radio", { name: "Happy" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("shows the shirt graphic only for the graphic tee", async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    await user.click(screen.getByRole("tab", { name: "Clothing" }));
    expect(screen.queryByRole("radiogroup", { name: "Shirt graphic" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Graphic tee" }));
    expect(screen.getByRole("radiogroup", { name: "Shirt graphic" })).toBeInTheDocument();
  });

  it("saves all 13 qualities and goes to the profile", async () => {
    const user = userEvent.setup();
    const next = { ...saved, topType: "LongHairDreads" };
    render(<AvatarEditorPage />, { mocks: [saveMock(next), userRefetch] });
    await user.click(screen.getByRole("radio", { name: "Dreadlocks" }));
    await user.click(screen.getAllByRole("button", { name: "Save avatar" })[0]!);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/profile/testuser"));
    expect(mockToastSuccess).toHaveBeenCalledWith("Avatar saved");
    expect(useAppStore.getState().user.data.avatar).toEqual(next);
  });

  it("keeps the draft and shows the error when saving fails", async () => {
    const user = userEvent.setup();
    const next = { ...saved, topType: "LongHairDreads" };
    render(<AvatarEditorPage />, { mocks: [saveMock(next, "Too many requests")] });
    await user.click(screen.getByRole("radio", { name: "Dreadlocks" }));
    await user.click(screen.getAllByRole("button", { name: "Save avatar" })[0]!);
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Too many requests"));
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Dreadlocks" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("asks before leaving with unsaved changes, and leaves straight away without", async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    await user.click(screen.getAllByRole("button", { name: "Cancel" })[0]!);
    expect(mockPush).toHaveBeenCalledWith("/profile/testuser");
    mockPush.mockClear();

    await user.click(screen.getByRole("radio", { name: "Dreadlocks" }));
    await user.click(screen.getAllByRole("button", { name: "Cancel" })[0]!);
    expect(await screen.findByText("Leave without saving?")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(mockPush).toHaveBeenCalledWith("/profile/testuser");
  });

  it("undoes, redoes and resets", async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    await user.click(screen.getByRole("radio", { name: "Dreadlocks" }));
    await user.click(screen.getAllByRole("button", { name: "Undo" })[0]!);
    expect(screen.getByRole("radio", { name: "Top bun" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("button", { name: "Redo" }));
    expect(screen.getByRole("radio", { name: "Dreadlocks" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    await user.click(screen.getAllByRole("button", { name: "Reset to saved" })[0]!);
    expect(screen.getByRole("radio", { name: "Top bun" })).toHaveAttribute("aria-checked", "true");
  });

  it("explains that an image avatar stays until the member saves", () => {
    setUser("https://example.com/me.png");
    render(<AvatarEditorPage />);
    expect(screen.getByText(/shows a photo right now/i)).toBeInTheDocument();
  });
});
