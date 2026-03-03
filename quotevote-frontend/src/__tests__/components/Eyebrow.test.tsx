/**
 * Tests for Eyebrow Component
 */

import { render, screen, waitFor } from "@testing-library/react";
import { Eyebrow } from "@/app/components/Eyebrow/Eyebrow";
import userEvent from "@testing-library/user-event";
import { useAppStore } from "@/store/useAppStore";
import type { AppState } from "@/types/store";

// Mock the useAppStore hook
jest.mock("@/store/useAppStore", () => ({
  useAppStore: jest.fn(),
}));

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { toast } from "sonner";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => ({
    toString: () => "",
  }),
}));

// Mock Apollo Client hooks
const mockQuery = jest.fn();
const mockMutation = jest.fn();
const mockClient = {
  query: mockQuery,
};

const mockUseMutation = jest.fn(() => [
  mockMutation,
  { loading: false, error: null },
]);

jest.mock("@apollo/client/react", () => {
  const actual = jest.requireActual("@apollo/client/react");
  return {
    ...actual,
    useApolloClient: () => mockClient,
    useMutation: () => mockUseMutation(),
  };
});

describe("Eyebrow Component", () => {
  const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppStore.mockReturnValue(null);

    // Default mutation response
    mockMutation.mockResolvedValue({
      data: {
        requestUserAccess: {
          _id: "123",
          email: "test@example.com",
        },
      },
    });
  });

  it("renders all form fields", () => {
    render(<Eyebrow />);

    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue/i })).toBeInTheDocument();
  });

  it("isn't rendered when user is authenticated", () => {
    mockUseAppStore.mockReturnValue({
      id: "test-user",
    } as Partial<AppState["user"]["data"]>);

    const { container } = render(<Eyebrow />);
    expect(container).toBeEmptyDOMElement();
  });

  it("disables continue button when email is invalid", async () => {
    const user = userEvent.setup();
    render(<Eyebrow />);

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser");

    expect(continueButton).toBeDisabled();
  });

  it("displays login options modal when user is 'registered'", async () => {
    const user = userEvent.setup();

    render(<Eyebrow />);

    mockQuery.mockResolvedValueOnce({
      data: { checkEmailStatus: { status: "registered" } },
    });

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/We recognize this email./i)).toBeInTheDocument();
    });
  });

  it("displays feedback message when user is 'not_requested'", async () => {
    const user = userEvent.setup();

    render(<Eyebrow />);

    mockQuery.mockResolvedValueOnce({
      data: { checkEmailStatus: { status: "not_requested" } },
    });

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");
    await user.click(continueButton);

    const feedbackMessages = await waitFor(
      () => {
        return screen.findAllByText(
          /Your request has been received! You'll be notified once approved\./i
        );
      },
      { timeout: 3000 }
    );

    expect(feedbackMessages.length).toBeGreaterThan(0);
  });

  it("displays feedback message when user is 'requested_pending'", async () => {
    const user = userEvent.setup();

    render(<Eyebrow />);

    mockQuery.mockResolvedValueOnce({
      data: { checkEmailStatus: { status: "requested_pending" } },
    });

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");
    await user.click(continueButton);

    const feedbackMessages = await screen.findAllByText(
      "Your invite request is still waiting for approval."
    );

    expect(feedbackMessages.length).toBeGreaterThan(0);
  });

  it("displays onboarding modal when user is 'approved_no_password'", async () => {
    const user = userEvent.setup();

    render(<Eyebrow />);

    mockQuery.mockResolvedValueOnce({
      data: { checkEmailStatus: { status: "approved_no_password" } },
    });

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/Your invite is approved!/i)).toBeInTheDocument();
    });
  });

  it("calls CHECK_EMAIL_STATUS query with correct variables", async () => {
    const user = userEvent.setup();

    render(<Eyebrow />);

    mockQuery.mockResolvedValueOnce({
      data: { checkEmailStatus: { status: "not_requested" } },
    });

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");
    await user.click(continueButton);

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { email: "testuser@email.com" },
          fetchPolicy: "network-only",
        })
      );
    });
  });

  it("calls REQUEST_USER_ACCESS_MUTATION for 'not_requested' status", async () => {
    const user = userEvent.setup();

    render(<Eyebrow />);

    mockQuery.mockResolvedValueOnce({
      data: { checkEmailStatus: { status: "not_requested" } },
    });

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");
    await user.click(continueButton);

    await waitFor(() => {
      expect(mockMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            requestUserAccessInput: { email: "testuser@email.com" },
          },
        })
      );
    });
  });

  it("shows error feedback and toast on network error", async () => {
    const user = userEvent.setup();
    const originalError = console.error;
    console.error = jest.fn();

    render(<Eyebrow />);

    mockQuery.mockRejectedValueOnce(new Error("Network error"));

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");
    await user.click(continueButton);

    await waitFor(() => {
      expect(
        screen.getAllByText("Unable to connect. Please try again.").length
      ).toBeGreaterThan(0);
    });

    expect(toast.error).toHaveBeenCalledWith("Something went wrong");

    console.error = originalError;
  });
});
