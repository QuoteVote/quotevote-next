import { render, screen } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { AboutPageContent } from "@/app/components/AboutPage/AboutPageContent";
import { REQUEST_USER_ACCESS_MUTATION } from "@/graphql/mutations";

describe("About page", () => {
  it("leads with the mission and the two ways in", () => {
    render(<AboutPageContent />);
    expect(screen.getByTestId("about-page")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /better conversations start with specific ideas/i,
      })
    ).toBeInTheDocument();
    const requestLinks = screen.getAllByRole("link", { name: /^request invite$/i });
    for (const link of requestLinks) expect(link).toHaveAttribute("href", "/auths/request-access");
    expect(screen.getByRole("link", { name: /explore discussions/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /github repository/i })).toHaveAttribute(
      "href",
      "https://github.com/QuoteVote/quotevote-next"
    );
  });

  it("shows how voting on passages works, the values and the communities", () => {
    render(<AboutPageContent />);
    expect(
      screen.getByRole("heading", { name: /structured dialogue\. better decisions\./i })
    ).toBeInTheDocument();
    // Plain up and down votes, no agree bars or percentages (updated design).
    expect(screen.getByText("↑ 56")).toBeInTheDocument();
    expect(screen.getByText("↓ 41")).toBeInTheDocument();
    expect(screen.queryByText(/% agree/)).not.toBeInTheDocument();
    for (const value of ["No ads", "No engagement algorithms", "Open source", "Everyone welcome"]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: /built for every community/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Schools & universities" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Organizations & government" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Teams & Enterprise" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Students voting on a class trip" })
    ).toBeInTheDocument();
  });

  it("links donations and the footer to real pages", () => {
    render(<AboutPageContent />);
    expect(screen.getByRole("link", { name: /donate to quote\.vote today/i })).toHaveAttribute(
      "href",
      "https://opencollective.com/quotevote/donate"
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/#faq");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/contributing");
  });

  it("checks the email before sending it", async () => {
    const user = userEvent.setup();
    render(<AboutPageContent />);
    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /please enter a valid email address/i
    );
  });

  it("thanks the visitor once the address is recorded", async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: REQUEST_USER_ACCESS_MUTATION,
          variables: { requestUserAccessInput: { email: "ada@quote.vote" } },
        },
        result: { data: { requestUserAccess: { _id: "1", email: "ada@quote.vote" } } },
      },
    ];
    render(<AboutPageContent />, { mocks });
    await user.type(screen.getByLabelText(/email address/i), "ada@quote.vote");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(await screen.findByText(/we'll be in touch soon/i)).toBeInTheDocument();
  });
});
