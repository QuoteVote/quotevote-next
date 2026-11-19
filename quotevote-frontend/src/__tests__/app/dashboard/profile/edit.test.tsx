/**
 * Edit Profile (#536): photo, name, username, About and banner live here,
 * reached from the profile, not from Settings.
 */
import { render, screen, fireEvent, waitFor } from "@/__tests__/utils/test-utils";
import { resetStore } from "@/__tests__/utils/test-utils";
import { installMemoryStorage, restoreStorage } from "@/__tests__/utils/memoryStorage";
import { useAppStore } from "@/store/useAppStore";
import { UPDATE_USER } from "@/graphql/mutations";
import { GET_USER, GET_USER_BIO } from "@/graphql/queries";

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  usePathname: () => "/profile/testuser/edit",
  useSearchParams: () => new URLSearchParams(),
}));

let EditProfilePageClient: React.ComponentType<{ username: string }>;
beforeAll(async () => {
  const mod = await import("@/app/(dashboard)/profile/[username]/edit/EditProfilePageClient");
  EditProfilePageClient = mod.default;
});

const mockUser = {
  id: "user-1",
  _id: "user-1",
  username: "testuser",
  name: "Test User",
  email: "test@example.com",
  avatar: "https://example.com/avatar.png",
  admin: false,
};

const getUserBioMock = {
  request: { query: GET_USER_BIO, variables: { username: "testuser" } },
  result: { data: { user: { _id: "user-1", bio: "Thoughtful dialogue." } } },
};

const bioUnavailableMock = {
  request: { query: GET_USER_BIO, variables: { username: "testuser" } },
  result: { errors: [{ message: 'Cannot query field "bio" on type "User".' }] },
};

const updated = {
  _id: "user-1",
  username: "newname",
  email: "test@example.com",
  name: "New Name",
  avatar: "https://example.com/avatar.png",
  admin: false,
  accountStatus: "active",
  themePreference: "light",
  contributorBadge: false,
};

const saveProfileMock = {
  request: {
    query: UPDATE_USER,
    variables: {
      user: { _id: "user-1", name: "New Name", username: "newname", bio: "Thoughtful dialogue." },
    },
  },
  result: { data: { updateUser: updated } },
};

const refetchMocks = [
  {
    request: { query: GET_USER, variables: { username: "newname" } },
    result: {
      data: {
        user: {
          _id: "user-1",
          name: "New Name",
          username: "newname",
          upvotes: 0,
          downvotes: 0,
          _followingId: [],
          _followersId: [],
          avatar: "https://example.com/avatar.png",
          contributorBadge: false,
          reputation: null,
        },
      },
    },
  },
  {
    request: { query: GET_USER_BIO, variables: { username: "newname" } },
    result: { data: { user: { _id: "user-1", bio: "Thoughtful dialogue." } } },
  },
];

describe("Edit Profile page (#536)", () => {
  beforeEach(() => {
    installMemoryStorage();
    resetStore();
    mockPush.mockClear();
    mockReplace.mockClear();
    useAppStore.getState().setUserData(mockUser);
  });

  afterEach(() => {
    restoreStorage();
  });

  it("shows the profile fields with the saved values", async () => {
    render(<EditProfilePageClient username="testuser" />, { mocks: [getUserBioMock] });
    expect(screen.getByRole("heading", { level: 1, name: "Edit profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveValue("Test User");
    expect(screen.getByLabelText("Username")).toHaveValue("testuser");
    await waitFor(() => {
      expect(screen.getByLabelText("About")).toHaveValue("Thoughtful dialogue.");
    });
  });

  it("has Change photo, linking to the avatar editor", () => {
    render(<EditProfilePageClient username="testuser" />, { mocks: [getUserBioMock] });
    expect(screen.getByRole("link", { name: /change photo/i })).toHaveAttribute(
      "href",
      "/profile/testuser/avatar"
    );
  });

  it("has the banner picker, and Cancel and Back go to the profile", () => {
    render(<EditProfilePageClient username="testuser" />, { mocks: [getUserBioMock] });
    expect(screen.getByRole("img", { name: "Banner preview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/profile/testuser"
    );
    expect(screen.getByRole("link", { name: /back to profile/i })).toHaveAttribute(
      "href",
      "/profile/testuser"
    );
  });

  it("has no account settings or Sign out", () => {
    render(<EditProfilePageClient username="testuser" />, { mocks: [getUserBioMock] });
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });

  it("hides About when the API has no User.bio", async () => {
    render(<EditProfilePageClient username="testuser" />, { mocks: [bioUnavailableMock] });
    await waitFor(() => {
      expect(screen.queryByLabelText("About")).not.toBeInTheDocument();
    });
  });

  it("sends someone else’s edit URL to your own", async () => {
    render(<EditProfilePageClient username="alice" />, { mocks: [getUserBioMock] });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/profile/testuser/edit");
    });
    expect(screen.queryByLabelText("Display name")).not.toBeInTheDocument();
  });

  it("keeps Save disabled until something changes, and validates the username", async () => {
    render(<EditProfilePageClient username="testuser" />, { mocks: [getUserBioMock] });
    const save = screen.getByRole("button", { name: /save changes/i });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "ab" } });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);
    expect(await screen.findByText("Username must be at least 4 characters")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps a validation error when the saved About arrives after Save", async () => {
    render(<EditProfilePageClient username="testuser" />, {
      mocks: [{ ...getUserBioMock, delay: 300 }],
    });
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "ab" } });
    const save = screen.getByRole("button", { name: /save changes/i });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);
    expect(await screen.findByText("Username must be at least 4 characters")).toBeInTheDocument();

    // The bio response lands now and refreshes the form's saved values.
    await waitFor(() => expect(screen.getByLabelText("About")).toHaveValue("Thoughtful dialogue."));
    expect(screen.getByText("Username must be at least 4 characters")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveValue("ab");
  });

  it("accepts an existing username shorter than 4 characters when it is unchanged", async () => {
    useAppStore.getState().setUserData({ ...mockUser, username: "bob" });
    render(<EditProfilePageClient username="bob" />, {
      mocks: [
        { ...getUserBioMock, request: { query: GET_USER_BIO, variables: { username: "bob" } } },
      ],
    });
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Bobby" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByLabelText("Username")).not.toHaveAttribute("aria-invalid", "true");
    });
    expect(screen.queryByText("Username must be at least 4 characters")).not.toBeInTheDocument();
  });

  it("previews a banner change and only stores it on Save", async () => {
    render(<EditProfilePageClient username="testuser" />, { mocks: [getUserBioMock] });
    fireEvent.click(screen.getByRole("button", { name: "Stripes" }));
    expect(screen.getByRole("button", { name: "Stripes" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("profileBgPattern")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(localStorage.getItem("profileBgPattern")).toBe("stripes");
    });
    expect(mockPush).toHaveBeenCalledWith("/profile/testuser");
  });

  it("saves name, username and About, then opens the new profile address", async () => {
    render(<EditProfilePageClient username="testuser" />, {
      mocks: [getUserBioMock, saveProfileMock, ...refetchMocks],
    });
    await waitFor(() => {
      expect(screen.getByLabelText("About")).toHaveValue("Thoughtful dialogue.");
    });
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "New Name" } });
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "newname" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/profile/newname");
    });
    expect(useAppStore.getState().user.data?.username).toBe("newname");
    expect(useAppStore.getState().user.data?.email).toBe("test@example.com");
  });
});
