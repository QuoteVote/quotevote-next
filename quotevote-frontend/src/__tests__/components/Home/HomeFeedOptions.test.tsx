import { fireEvent, render, screen } from "@/__tests__/utils/test-utils";
import { HomeFeedOptions } from "@/components/Home/HomeFeedOptions";
import { TAGS_QUERY } from "@/graphql/queries";

let mockParams = new URLSearchParams();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  usePathname: () => "/",
  useSearchParams: () => mockParams,
}));

jest.mock("@/components/Profile/SendInviteDialog", () => ({
  SendInviteDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Send invite" /> : null,
}));

const tag = (id: string, title: string, privacy = "public") => ({
  _id: id,
  creatorId: "u",
  adminIds: [],
  allowedUserIds: [],
  privacy,
  title,
  url: `/${title}`,
  description: "",
});

const mocks = [
  {
    request: { query: TAGS_QUERY, variables: { limit: 100 } },
    result: {
      data: {
        tags: [
          tag("t1", "Transport"),
          tag("t2", "Housing"),
          tag("t3", "Secret", "private"),
          ...Array.from({ length: 6 }, (_, i) => tag(`x${i}`, `Topic ${i}`)),
        ],
      },
    },
  },
];

describe("HomeFeedOptions", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockParams = new URLSearchParams("q=bus&page=2");
  });

  it("switches the sort and keeps the search", () => {
    render(<HomeFeedOptions />, { mocks });
    fireEvent.click(screen.getByRole("button", { name: "Most popular" }));
    expect(mockReplace).toHaveBeenCalledWith("/?q=bus&interactions=true", { scroll: false });
  });

  it("turns on the following feed", () => {
    render(<HomeFeedOptions />, { mocks });
    fireEvent.click(screen.getByRole("switch", { name: "Only people I follow" }));
    expect(mockReplace).toHaveBeenCalledWith("/?q=bus&following=true", { scroll: false });
  });

  it("lists public topics only, a few at first", async () => {
    render(<HomeFeedOptions />, { mocks });
    fireEvent.click(await screen.findByRole("button", { name: "Transport" }));
    expect(mockReplace).toHaveBeenCalledWith("/?q=bus&tag=t1", { scroll: false });
    expect(screen.queryByRole("button", { name: /Secret/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Topic 5" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all 8 topics" }));
    expect(screen.getByRole("button", { name: "Topic 5" })).toBeInTheDocument();
  });

  it("marks the selected topic and Any topic clears it", async () => {
    mockParams = new URLSearchParams("tag=t2");
    render(<HomeFeedOptions />, { mocks });
    expect(await screen.findByRole("button", { name: "Housing" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    fireEvent.click(screen.getByRole("button", { name: "Any topic" }));
    expect(mockReplace).toHaveBeenCalledWith("/", { scroll: false });
  });

  it("clears every filter but keeps the search", () => {
    mockParams = new URLSearchParams("q=bus&tag=t1&interactions=true&from=2026-11-01");
    render(<HomeFeedOptions />, { mocks });
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(mockReplace).toHaveBeenCalledWith("/?q=bus", { scroll: false });
  });

  it("disables Clear filters when nothing is set", () => {
    render(<HomeFeedOptions />, { mocks });
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeDisabled();
  });

  it("sets a custom date range", () => {
    render(<HomeFeedOptions />, { mocks });
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-11-01" } });
    expect(mockReplace).toHaveBeenCalledWith("/?q=bus&from=2026-11-01", { scroll: false });
  });

  it("opens the invite dialog", () => {
    render(<HomeFeedOptions />, { mocks });
    fireEvent.click(screen.getByRole("button", { name: "Send an invite" }));
    expect(screen.getByRole("dialog", { name: "Send invite" })).toBeInTheDocument();
  });
});
