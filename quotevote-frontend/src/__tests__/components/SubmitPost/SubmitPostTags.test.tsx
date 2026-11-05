/**
 * Posting on the new backend's Tag contract (#539): the composer lists tags,
 * creates a new one with createTag, and sends the post's tag as tagId.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useMutation, useQuery } from "@apollo/client/react";
import { SubmitPost } from "@/components/SubmitPost/SubmitPost";
import { SubmitPostForm } from "@/components/SubmitPost/SubmitPostForm";
import { CREATE_TAG, SUBMIT_POST } from "@/graphql/mutations";
import { TAGS_QUERY } from "@/graphql/queries";
import { getSubmitPostDraftKey } from "@/lib/utils/submitPostDraft";
import type { Tag } from "@/types/components";

jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useApolloClient: () => ({ cache: { evict: jest.fn(), gc: jest.fn() } }),
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/hooks/useResponsive", () => ({ useResponsive: () => ({ isMobile: false }) }));
jest.mock("@/store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { data: { _id: "user-1", username: "member" } },
      setSelectedPost: jest.fn(),
    }),
}));

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;

const user = { _id: "user-1" };
const climate: Tag = { _id: "tag-1", title: "Climate", privacy: "public" };

// jest.setup.js replaces sessionStorage with mocks, so the saved draft is served from getItem.
const saveDraft = (tag: { _id?: string; title: string }) => {
  const draft = JSON.stringify({
    title: "A title",
    text: "Some quote text",
    citationUrl: "",
    attribution: "",
    tag,
  });
  (sessionStorage.getItem as jest.Mock).mockImplementation((key: string) =>
    key === getSubmitPostDraftKey(user._id) ? draft : null
  );
};

/** Submit once the restored draft has made the form valid. */
const submitWhenReady = async () => {
  const button = await screen.findByTestId("post-submit-button");
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
};

let createTag: jest.Mock;
let submitPost: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (sessionStorage.getItem as jest.Mock).mockReturnValue(null);
  createTag = jest.fn().mockResolvedValue({ data: { createTag: { _id: "tag-new" } } });
  submitPost = jest
    .fn()
    .mockResolvedValue({
      data: { addPost: { _id: "post-1", url: "/post/climate/a-title/post-1" } },
    });
  mockUseMutation.mockImplementation((doc: unknown) => [
    doc === CREATE_TAG ? createTag : submitPost,
    { loading: false },
  ]);
});

describe("SubmitPost tag list", () => {
  it("asks for every tag and offers public tags and private tags the member belongs to", () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: {
        tags: [
          climate,
          { _id: "tag-2", title: "Members", privacy: "private", allowedUserIds: ["user-1"] },
          { _id: "tag-3", title: "Hidden", privacy: "private", allowedUserIds: ["someone-else"] },
        ],
      },
    });

    render(<SubmitPost setOpen={jest.fn()} />);

    expect(mockUseQuery).toHaveBeenCalledWith(TAGS_QUERY, { skip: false });
    fireEvent.click(screen.getByTestId("post-tag-select"));
    expect(screen.getByText("Climate")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});

describe("SubmitPostForm posting with a tag", () => {
  it("sends an existing tag as tagId", async () => {
    saveDraft({ _id: climate._id, title: climate.title });
    render(<SubmitPostForm options={[climate]} user={user} setOpen={jest.fn()} />);

    await submitWhenReady();

    await waitFor(() => expect(submitPost).toHaveBeenCalled());
    expect(createTag).not.toHaveBeenCalled();
    const { post } = submitPost.mock.calls[0][0].variables;
    expect(post).toMatchObject({ tagId: "tag-1", title: "A title", text: "Some quote text" });
    expect(post).not.toHaveProperty("groupId");
  });

  it("creates a new tag with createTag, then posts with its id", async () => {
    saveDraft({ title: "Housing" });
    render(<SubmitPostForm options={[climate]} user={user} setOpen={jest.fn()} />);

    await submitWhenReady();

    await waitFor(() => expect(submitPost).toHaveBeenCalled());
    expect(createTag).toHaveBeenCalledWith({
      variables: {
        tag: {
          creatorId: "user-1",
          title: "Housing",
          description: "Description for: Housing tag",
          privacy: "public",
        },
      },
      refetchQueries: [{ query: TAGS_QUERY }],
    });
    expect(submitPost.mock.calls[0][0].variables.post.tagId).toBe("tag-new");
  });

  it("doesn't post when the new tag isn't created", async () => {
    createTag.mockResolvedValue({ data: { createTag: null } });
    saveDraft({ title: "Housing" });
    render(<SubmitPostForm options={[climate]} user={user} setOpen={jest.fn()} />);

    await submitWhenReady();

    expect(await screen.findByText("Tag was not created. Please try again.")).toBeInTheDocument();
    expect(submitPost).not.toHaveBeenCalled();
  });
});

it("uses the documents from the new backend", () => {
  expect(SUBMIT_POST.loc?.source.body).toContain("addPost(post: $post)");
  expect(CREATE_TAG.loc?.source.body).toContain("createTag(tag: $tag)");
  expect(TAGS_QUERY.loc?.source.body).toContain("tags(limit: $limit)");
});
