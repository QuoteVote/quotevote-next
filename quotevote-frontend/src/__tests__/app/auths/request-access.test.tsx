/**
 * Request Access Page Tests
 */

import { renderToString } from "react-dom/server.node";
import { GraphQLError } from "graphql";
import { ApolloProvider } from "@apollo/client/react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, createMockApolloClient } from "../../utils/test-utils";
import { RequestAccessPageContent } from "@/app/auths/request-access/PageContent";
import { REQUEST_USER_ACCESS_MUTATION } from "@/graphql/mutations";
import { GET_CHECK_DUPLICATE_EMAIL } from "@/graphql/queries";
import type { MockedResponse } from "../../utils/test-utils";

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useSearchParams: jest.fn(),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import { useSearchParams } from "next/navigation";

const EMAIL = "new.person@example.com";

const duplicateCheck = (existing: unknown[] = []): MockedResponse => ({
  request: { query: GET_CHECK_DUPLICATE_EMAIL, variables: { email: EMAIL } },
  result: { data: { checkDuplicateEmail: existing } },
});

const requestAccessOk = (onCall: () => void = () => {}): MockedResponse => ({
  request: {
    query: REQUEST_USER_ACCESS_MUTATION,
    variables: { requestUserAccessInput: { email: EMAIL } },
  },
  result: () => {
    onCall();
    return { data: { requestUserAccess: { _id: "r1", email: EMAIL, __typename: "User" } } };
  },
});

async function submit(mocks: MockedResponse[]) {
  const user = userEvent.setup();
  render(<RequestAccessPageContent />, { mocks });
  await user.type(screen.getByLabelText("Email address"), `${EMAIL}{Enter}`);
  return user;
}

describe("RequestAccessPageContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue({ get: () => null });
  });

  describe("Email request form", () => {
    it("labels the email field and explains that access is by invite", () => {
      render(<RequestAccessPageContent />);
      const input = screen.getByLabelText("Email address");
      expect(input).toHaveAttribute("type", "email");
      expect(input).toHaveAttribute("autocomplete", "email");
      expect(input).toHaveAccessibleDescription(/invite-only/i);
      expect(screen.getByRole("button", { name: "Request Invite" })).toBeInTheDocument();
    });

    it("shows the sign-in reason when the visitor was redirected here", () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === "from" ? "/post/1" : null),
      });
      render(<RequestAccessPageContent />);
      expect(screen.getByText(/you need an account to contribute/i)).toBeInTheDocument();
    });

    it("flags an invalid email on the field without sending anything", async () => {
      const user = userEvent.setup();
      render(<RequestAccessPageContent />);
      await user.type(screen.getByLabelText("Email address"), "not-an-email{Enter}");
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.getByLabelText("Email address")).toHaveAttribute("aria-invalid", "true");
    });

    it("sends one request when Enter is pressed, not two", async () => {
      const calls = jest.fn();
      await submit([duplicateCheck(), requestAccessOk(calls), requestAccessOk(calls)]);
      expect(await screen.findByRole("heading", { name: "Request received" })).toBeInTheDocument();
      expect(calls).toHaveBeenCalledTimes(1);
    });

    it("points an existing account to sign in and password reset", async () => {
      await submit([duplicateCheck([{ _id: "u1", email: EMAIL }])]);
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("This email already exists.");
      expect(screen.getByRole("link", { name: "sign in" })).toHaveAttribute("href", "/auths/login");
      expect(screen.getByRole("link", { name: "reset your password" })).toHaveAttribute(
        "href",
        "/auths/forgot-password"
      );
    });

    it("says the request could not be sent when the server fails", async () => {
      await submit([
        duplicateCheck(),
        {
          request: {
            query: REQUEST_USER_ACCESS_MUTATION,
            variables: { requestUserAccessInput: { email: EMAIL } },
          },
          error: new Error("Network down"),
        },
      ]);
      expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t send your request/i);
      expect(screen.queryByRole("heading", { name: "Request received" })).not.toBeInTheDocument();
    });
  });

  describe("When an invite to the address is still open (#691)", () => {
    it("tells the person to check their inbox instead of confirming a request", async () => {
      await submit([
        duplicateCheck(),
        {
          request: {
            query: REQUEST_USER_ACCESS_MUTATION,
            variables: { requestUserAccessInput: { email: EMAIL } },
          },
          result: {
            errors: [
              new GraphQLError(
                "An invite was already sent to this email. Check your inbox for the signup link.",
                { extensions: { code: "BAD_USER_INPUT" } }
              ),
            ],
          },
        },
      ]);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "An invite was already sent to this email. Check your inbox for the signup link."
      );
      expect(screen.queryByRole("heading", { name: "Request received" })).not.toBeInTheDocument();
    });
  });

  describe("After the request goes through", () => {
    it("confirms the request with next steps, without any plan content", async () => {
      await submit([duplicateCheck(), requestAccessOk()]);
      const heading = await screen.findByRole("heading", { name: "Request received" });
      await waitFor(() => expect(heading).toHaveFocus());
      expect(screen.getByText(EMAIL)).toBeInTheDocument();
      expect(screen.getByText(/link to set your password/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute(
        "href",
        "/auths/login"
      );
      expect(screen.getByRole("link", { name: "Explore Quote.Vote" })).toHaveAttribute("href", "/");
      expect(screen.queryByText(/plan/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("img", { name: /plan/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
    });

    it("keeps the header so the visitor can go back or log in", async () => {
      await submit([duplicateCheck(), requestAccessOk()]);
      await screen.findByRole("heading", { name: "Request received" });
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Go back" }));
      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/auths/login");
    });
  });

  it("renders without a background image on the server, so hydration matches", () => {
    const html = renderToString(
      <ApolloProvider client={createMockApolloClient()}>
        <RequestAccessPageContent />
      </ApolloProvider>
    );
    expect(html).not.toContain("/assets/bg/");
    expect(html).toContain("Email address");
  });
});
