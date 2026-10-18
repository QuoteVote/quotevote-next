import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

let mockSearchParamsString = "";
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
  usePathname: () => "/settings/solid/callback",
}));

jest.mock("@apollo/client/react", () => {
  const actual = jest.requireActual("@apollo/client/react");
  return {
    ...actual,
    __esModule: true,
    useMutation: jest.fn(),
  };
});

import { useMutation } from "@apollo/client/react";
import SolidCallbackPage from "@/app/(dashboard)/settings/solid/callback/page";

const mockUseMutation = useMutation as unknown as jest.Mock;

const CODE = "auth-code-SECRET-123";
const STATE = "state-SECRET-456";
const EXPECTED_REDIRECT = "http://localhost/settings/solid/callback";

let finishMock: jest.Mock;

const ORIGINAL_SOLID_ENABLED = process.env.NEXT_PUBLIC_SOLID_ENABLED;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SOLID_ENABLED = "true";
  mockSearchParamsString = "";
  mockReplace.mockReset();
  finishMock = jest.fn().mockResolvedValue({
    data: {
      solidFinishConnect: {
        success: true,
        webId: "https://pod.example/profile/card#me",
        issuer: "https://solidcommunity.net",
        message: null,
      },
    },
  });
  mockUseMutation.mockImplementation(() => [finishMock, { loading: false }]);
});

afterAll(() => {
  if (ORIGINAL_SOLID_ENABLED === undefined) delete process.env.NEXT_PUBLIC_SOLID_ENABLED;
  else process.env.NEXT_PUBLIC_SOLID_ENABLED = ORIGINAL_SOLID_ENABLED;
});

describe("SolidCallbackPage", () => {
  it("shows a neutral unavailable message and never calls the API when the flag is off", async () => {
    process.env.NEXT_PUBLIC_SOLID_ENABLED = "false";
    mockSearchParamsString = `code=${CODE}&state=${STATE}`;

    const { container } = render(<SolidCallbackPage />);

    expect(await screen.findByText("Connecting a Pod is not available right now.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Settings" })).toHaveAttribute("href", "/settings");
    expect(finishMock).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(container.textContent ?? "").not.toContain(CODE);
  });

  it("finishes the connection once and redirects to Settings on success", async () => {
    mockSearchParamsString = `code=${CODE}&state=${STATE}`;

    render(
      <React.StrictMode>
        <SolidCallbackPage />
      </React.StrictMode>
    );

    expect(await screen.findByText(/Your Pod is connected/)).toBeInTheDocument();
    expect(finishMock).toHaveBeenCalledTimes(1);
    expect(finishMock).toHaveBeenCalledWith({
      variables: { code: CODE, state: STATE, redirectUri: EXPECTED_REDIRECT },
    });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/settings"), { timeout: 3000 });
  });

  it("never displays the code or state", async () => {
    mockSearchParamsString = `code=${CODE}&state=${STATE}`;

    const { container } = render(<SolidCallbackPage />);

    await screen.findByText(/Your Pod is connected/);
    expect(container.textContent ?? "").not.toContain(CODE);
    expect(container.textContent ?? "").not.toContain(STATE);
  });

  it("shows a friendly error and does not call the API when the provider reports an error", async () => {
    mockSearchParamsString = "error=access_denied&error_description=user+said+no";

    const { container } = render(<SolidCallbackPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your Pod provider did not finish the connection."
    );
    expect(finishMock).not.toHaveBeenCalled();
    expect(container.textContent ?? "").not.toContain("user said no");
    expect(screen.getByRole("link", { name: "Back to Settings" })).toHaveAttribute(
      "href",
      "/settings"
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows an error when the code or state is missing", async () => {
    mockSearchParamsString = `code=${CODE}`;

    render(<SolidCallbackPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This connection link is incomplete."
    );
    expect(finishMock).not.toHaveBeenCalled();
  });

  it("maps a backend failure to a friendly message", async () => {
    mockSearchParamsString = `code=${CODE}&state=${STATE}`;
    finishMock.mockRejectedValue({
      graphQLErrors: [{ message: "raw", extensions: { code: "SOLID_UNAVAILABLE" } }],
    });

    render(<SolidCallbackPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your Pod is temporarily unavailable"
    );
    expect(screen.getByRole("link", { name: "Back to Settings" })).toBeInTheDocument();
  });

  it("shows a generic error when the API reports the connection did not succeed", async () => {
    mockSearchParamsString = `code=${CODE}&state=${STATE}`;
    finishMock.mockResolvedValue({
      data: {
        solidFinishConnect: { success: false, webId: null, issuer: null, message: "internal" },
      },
    });

    render(<SolidCallbackPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not finish connecting your Pod."
    );
    expect(screen.queryByText("internal")).not.toBeInTheDocument();
  });
});
