import { render, screen, within } from "@/__tests__/utils/test-utils";
import { NoticeCard, NoticePage } from "@/components/Public/Notice";

describe("Notice", () => {
  it.each([
    ["invalidInvite", "Invalid Invite", "Request a new invite", "/auths/request-access"],
    ["linkExpired", "Link Expired", "Request a new link", "/auths/forgot-password"],
    ["linkIncomplete", "Invalid Link", "Request a new link", "/auths/forgot-password"],
    ["sessionExpired", "Your session has expired", "Sign In", "/auths/login"],
    ["emailSent", "Email Sent", "Go to Login", "/auths/login"],
    ["inTouch", "We Will Be in Touch!", "Back to Home", "/"],
  ] as const)("%s shows its title and button", (kind, title, button, href) => {
    render(<NoticeCard kind={kind} />);
    expect(screen.getByRole("heading", { name: title })).toHaveFocus();
    expect(screen.getByRole("link", { name: button })).toHaveAttribute("href", href);
  });

  it("can name the address in the message", () => {
    render(
      <NoticeCard
        kind="emailSent"
        message="Check ana@example.org for a link to reset your password."
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Check ana@example.org");
  });

  it("signing out has no buttons", () => {
    render(<NoticeCard kind="signingOut" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("sits on its own page with a way home", () => {
    render(<NoticePage kind="invalidLink" />);
    expect(within(screen.getByRole("banner")).getByRole("link", { name: "Go to Home" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "Request New Invite" })).toHaveAttribute(
      "href",
      "/auths/request-access"
    );
  });
});
