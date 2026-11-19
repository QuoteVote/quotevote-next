import { render, screen, within } from "@/__tests__/utils/test-utils";
import NotFound from "@/app/not-found";
import ContributingPage from "@/app/contributing/page";
import TermsPage from "@/app/terms/page";

beforeAll(() => {
  // jsdom has no IntersectionObserver; the contents list only needs it to highlight.
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
});

describe("Documents", () => {
  it("marks the current document and numbers its sections in the contents", () => {
    render(<ContributingPage />);
    expect(screen.getByRole("link", { name: "Contributing" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "1. Where the code lives" })
    ).toBeInTheDocument();
    const toc = screen.getByRole("complementary", { name: "On this page" });
    expect(within(toc).getByRole("link", { name: "1. Where the code lives" })).toHaveAttribute(
      "href",
      "#code"
    );
    expect(within(toc).getAllByRole("link")).toHaveLength(4);
  });

  it("shows no contents list while the Terms are being finalized", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "On this page" })).not.toBeInTheDocument();
  });
});

describe("404", () => {
  it("says the page wasn't found and offers search and three ways on", () => {
    render(<NotFound />);
    expect(screen.getByRole("img", { name: "404" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /we couldn’t find that page/i })
    ).toBeInTheDocument();
    const search = screen.getByRole("search");
    expect(search).toHaveAttribute("action", "/");
    expect(within(search).getByLabelText(/search quotes, people and topics/i)).toHaveAttribute(
      "name",
      "q"
    );
    expect(screen.getByRole("link", { name: /latest quotes/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /about quote\.vote/i })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(screen.getByRole("link", { name: /request an invite/i })).toHaveAttribute(
      "href",
      "/auths/request-access"
    );
  });
});
