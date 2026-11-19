import { render, screen, within } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { LandingPage } from "@/app/components/Landing/LandingPage";
import { GET_TAG, GET_TOP_POSTS, TAGS_QUERY } from "@/graphql/queries";
import { createGraphQLVariables } from "@/lib/utils/pagination";

let mockSearch = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

const post = (id: string, title: string, upvotes: number, downvotes: number) => ({
  _id: id,
  userId: "u1",
  tagId: "t1",
  title,
  text: `Body of ${title}`,
  upvotes,
  downvotes,
  comments: id === "p1" ? [{ _id: "c1" }, { _id: "c2" }] : [],
  bookmarkedBy: [],
  created: "2026-11-18T10:00:00.000Z",
  url: `/post/housing/${id}/${id}`,
  citationUrl: id === "p1" ? "https://planning.gov/report" : null,
  attribution: null,
  rejectedBy: [],
  approvedBy: [],
  enable_voting: true,
  featuredSlot: null,
  creator: { _id: "u1", name: "Sam Brooks", username: "sambrooks", avatar: null },
});

const postsMock = (searchKey: string, entities: unknown[]) => ({
  request: {
    query: GET_TOP_POSTS,
    variables: createGraphQLVariables({
      page: 1,
      pageSize: 20,
      searchKey,
      sortOrder: "desc",
      interactions: false,
    }),
  },
  variableMatcher: () => true,
  result: {
    data: {
      posts: { entities, pagination: { total_count: entities.length, limit: 20, offset: 0 } },
    },
  },
});

const mocks = (searchKey = "") => [
  {
    request: { query: TAGS_QUERY, variables: { limit: 5 } },
    result: {
      data: {
        tags: [
          {
            _id: "t1",
            creatorId: "u1",
            adminIds: [],
            allowedUserIds: [],
            privacy: "public",
            title: "Housing",
            url: "/housing",
            description: "",
          },
        ],
      },
    },
  },
  postsMock(searchKey, [
    post("p1", "Turning empty offices into homes", 46, 13),
    post("p2", "Four-day school weeks", 0, 0),
  ]),
  {
    request: { query: GET_TAG },
    variableMatcher: () => true,
    result: { data: { tag: { _id: "t1", title: "Housing" } } },
  },
  {
    request: { query: GET_TAG },
    variableMatcher: () => true,
    result: { data: { tag: { _id: "t1", title: "Housing" } } },
  },
];

describe("Landing page (guests at /)", () => {
  beforeEach(() => {
    mockSearch = "";
  });

  it("leads with the headline and the two ways in", () => {
    render(<LandingPage />, { mocks: mocks() });
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /better conversations build stronger communities/i,
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^request invite$/i })[0]).toHaveAttribute(
      "href",
      "/auths/request-access"
    );
    expect(screen.getAllByRole("link", { name: /explore discussions/i })[0]).toHaveAttribute(
      "href",
      "#feed"
    );
  });

  it("has every section of the design, with anchors the header links to", () => {
    const { container } = render(<LandingPage />, { mocks: mocks() });
    for (const name of [
      /quote\. discuss\./i,
      /vote on the words, not the person/i,
      /built for every community/i,
      /different views/i,
      /latest quotes/i,
      /good to know/i,
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    for (const id of ["how", "communities", "feed", "faq"])
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    expect(screen.getByRole("contentinfo", { name: /site footer/i })).toBeInTheDocument();
  });

  it("puts Latest quotes right under the hero (updated design)", () => {
    render(<LandingPage />, { mocks: mocks() });
    const sections = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(sections[0]).toMatch(/latest quotes/i);
    expect(screen.getAllByRole("link", { name: /request an invite/i })[0]).toHaveAttribute(
      "href",
      "/auths/request-access"
    );
  });

  it("shows plain up and down votes and the new labels, no agree bars", () => {
    render(<LandingPage />, { mocks: mocks() });
    expect(screen.getAllByText("No engagement algorithms")).toHaveLength(2);
    expect(screen.queryByText("No algorithms")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Teams & Enterprise" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Government" })).toBeInTheDocument();
    expect(screen.queryByText(/% agree/i)).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("img", { name: "Neighbors discussing a quote on a shared board" })
    ).toHaveLength(2);
    expect(screen.getAllByText("QUOTE.VOTE COMIC")).toHaveLength(2);
  });

  it("lists the latest posts with their votes, comments and source", async () => {
    render(<LandingPage />, { mocks: mocks() });
    const first = (
      await screen.findByRole("link", { name: "Turning empty offices into homes" })
    ).closest("article") as HTMLElement;
    expect(first).toHaveClass("qv-postcard");
    expect(first).toHaveTextContent("Up votes:46");
    expect(first).toHaveTextContent("Down votes:13");
    expect(first).toHaveTextContent("2 comments");
    expect(within(first).getByRole("link", { name: /source: planning\.gov/i })).toHaveAttribute(
      "href",
      "https://planning.gov/report"
    );
    const second = (await screen.findByRole("link", { name: "Four-day school weeks" })).closest(
      "article"
    ) as HTMLElement;
    expect(second).toHaveTextContent("Up votes:0");
    expect(second).toHaveTextContent("0 comments");
  });

  it("starts the search from ?q=, as the 404 search sends it", () => {
    mockSearch = "q=transit";
    render(<LandingPage />, { mocks: mocks("transit") });
    expect(screen.getByLabelText(/search quotes, topics and sources/i)).toHaveValue("transit");
  });

  it("opens the phone menu with the section links and Log in", async () => {
    const user = userEvent.setup();
    render(<LandingPage />, { mocks: mocks() });
    await user.click(screen.getByRole("button", { name: /open menu/i }));
    const menu = screen.getByRole("navigation", { name: "Menu" });
    expect(within(menu).getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/auths/login"
    );
    expect(within(menu).getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  });
});
