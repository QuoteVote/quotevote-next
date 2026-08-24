import { render, screen } from "../utils/test-utils";
import userEvent from "@testing-library/user-event";
import AboutPage from "@/app/about/page";
import { REQUEST_USER_ACCESS_MUTATION } from "@/graphql/mutations";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/about",
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt as string} src={props.src as string} />
  ),
}));

describe("AboutPage", () => {
  it("renders the about page landmark content", () => {
    render(<AboutPage />);
    expect(screen.getByTestId("about-page")).toBeInTheDocument();
  });

  it("renders the Zeplin hero heading", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /better conversations build stronger communities/i,
      })
    ).toBeInTheDocument();
  });

  it("links Request Invite to request access", () => {
    render(<AboutPage />);
    const inviteLinks = screen.getAllByRole("link", { name: /request an invite/i });
    expect(inviteLinks.length).toBeGreaterThan(0);
    expect(inviteLinks[0]).toHaveAttribute("href", "/auths/request-access");
  });

  it("links Explore Discussions to the public home directory", () => {
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: /explore discussions/i })).toHaveAttribute("href", "/");
  });

  it("renders a GitHub repository link", () => {
    render(<AboutPage />);
    const github = screen.getByRole("link", { name: /github repository/i });
    expect(github).toHaveAttribute("href", "https://github.com/QuoteVote/quotevote-next");
  });

  it("renders the vote explainer", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { name: /put specific ideas to a vote/i })
    ).toBeInTheDocument();
  });

  it("renders core values", () => {
    render(<AboutPage />);
    expect(screen.getByText("No ads")).toBeInTheDocument();
    expect(screen.getByText("No algorithms")).toBeInTheDocument();
    expect(screen.getByText("Open source")).toBeInTheDocument();
    expect(screen.getByText("Everyone welcome")).toBeInTheDocument();
  });

  it("renders community use cases", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { name: /classrooms to a global townsquare/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Schools & Universities")).toBeInTheDocument();
    expect(screen.getByText("Teams & Projects")).toBeInTheDocument();
  });

  it("renders Zeplin illustration crops", () => {
    render(<AboutPage />);
    const page = screen.getByTestId("about-page");
    expect(page.querySelector('img[src^="/assets/about/hero-mockup.png"]')).toBeInTheDocument();
    expect(page.querySelector('img[src^="/assets/about/vote-ui.png"]')).toBeInTheDocument();
    expect(
      page.querySelector('img[src^="/assets/about/discussions-vote-type.png"]')
    ).toBeInTheDocument();
    expect(page.querySelector('img[src^="/assets/about/messaging-ui.png"]')).toBeInTheDocument();
    expect(page.querySelector('img[src^="/assets/about/characters.png"]')).toBeInTheDocument();
    expect(
      page.querySelector('img[src^="/assets/about/community-schools.png"]')
    ).toBeInTheDocument();
  });

  it("renders private conversations copy", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { name: /private conversations/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /follow discussions/i })).toBeInTheDocument();
  });

  it("renders donate and subscribe CTAs", () => {
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: /donate to quote\.vote today/i })).toHaveAttribute(
      "href",
      "https://opencollective.com/quotevote/donate"
    );
    expect(screen.getByRole("form", { name: /be in touch email form/i })).toBeInTheDocument();
    expect(screen.getByText(/no spam, ever/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /join us in creating a truly open and equal community/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your donation supports development, moderation, and hosting/i)
    ).toBeInTheDocument();
  });

  it("renders placeholder Implementation Guide and donations actions", () => {
    render(<AboutPage />);
    expect(screen.getByRole("button", { name: /implementation guide/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /learn more about donations/i })).toBeInTheDocument();
  });

  it("shows an error when subscribe email is invalid", async () => {
    const user = userEvent.setup();
    render(<AboutPage />);
    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it("submits a valid subscribe email", async () => {
    const user = userEvent.setup();
    render(<AboutPage />, {
      mocks: [
        {
          request: {
            query: REQUEST_USER_ACCESS_MUTATION,
            variables: { requestUserAccessInput: { email: "ada@quote.vote" } },
          },
          result: { data: { requestUserAccess: { _id: "1", email: "ada@quote.vote" } } },
        },
      ],
    });
    await user.type(screen.getByLabelText(/email address/i), "ada@quote.vote");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(await screen.findByText(/we'll be in touch soon/i)).toBeInTheDocument();
  });

  it("renders footer platform links", () => {
    render(<AboutPage />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "How it Works" })).toHaveAttribute(
      "href",
      "#how-it-works"
    );
    expect(
      screen.getByText(/quote\.vote a neutral public square\. powered by people\./i)
    ).toBeInTheDocument();
  });
});
