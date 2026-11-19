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

const post = (id: string, title: string, approved: number, rejected: number) => ({
  _id: id,
  userId: "u1",
  tagId: "t1",
  title,
  text: `Body of ${title}`,
  upvotes: 0,
  downvotes: 0,
  bookmarkedBy: [],
  created: "2026-11-18T10:00:00.000Z",
  url: `/post/housing/${id}/${id}`,
  citationUrl: id === "p1" ? "https://planning.gov/report" : null,
  attribution: null,
  rejectedBy: Array.from({ length: rejected }, (_, i) => `r${i}`),
  approvedBy: Array.from({ length: approved }, (_, i) => `a${i}`),
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
    post("p1", "Turning empty offices into homes", 7, 2),
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

  it("lists the latest posts with their approval and source", async () => {
    render(<LandingPage />, { mocks: mocks() });
    const first = (
      await screen.findByRole("link", { name: "Turning empty offices into homes" })
    ).closest("article") as HTMLElement;
    expect(within(first).getByText("78%")).toBeInTheDocument();
    expect(within(first).getByRole("link", { name: /source: planning\.gov/i })).toHaveAttribute(
      "href",
      "https://planning.gov/report"
    );
    const second = (await screen.findByRole("link", { name: "Four-day school weeks" })).closest(
      "article"
    ) as HTMLElement;
    expect(within(second).getByText("No votes yet")).toBeInTheDocument();
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
