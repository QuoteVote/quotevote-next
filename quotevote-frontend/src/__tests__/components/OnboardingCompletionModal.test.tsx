/**
 * Tests for OnboardingCompletionModal Component
 */

import { render, screen, waitFor } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { OnboardingCompletionModal } from "@/app/components/Eyebrow/OnboardingCompletionModal";

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { toast } from "sonner";

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/",
  useSearchParams: () => ({
    toString: () => "",
  }),
}));

// Mock Apollo Client hooks
const mockMutation = jest.fn();
const mockUseMutation = jest.fn(() => [
  mockMutation,
  { loading: false, error: null },
]);

jest.mock("@apollo/client/react", () => {
  const actual = jest.requireActual("@apollo/client/react");
  return {
    ...actual,
    useMutation: () => mockUseMutation(),
  };
});

describe("OnboardingCompletionModal", () => {
  const defaultProps = {
    email: "approved@example.com",
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutation.mockResolvedValue({
      data: { sendMagicLink: true },
    });
  });

  it("renders modal with correct title and description", () => {
    render(<OnboardingCompletionModal {...defaultProps} />);

    expect(screen.getByText(/Your invite is approved!/i)).toBeInTheDocument();
    expect(screen.getByText(/finish setting up your account/i)).toBeInTheDocument();
  });

  it("renders both action buttons", () => {
    render(<OnboardingCompletionModal {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /Send me a link to finish onboarding/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Password now/i })
    ).toBeInTheDocument();
  });

  it("does not render when email is undefined", () => {
    const { container } = render(
      <OnboardingCompletionModal isOpen={true} onClose={jest.fn()} email={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when isOpen is false", () => {
    render(<OnboardingCompletionModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/Your invite is approved!/i)).not.toBeInTheDocument();
  });

  it("calls sendMagicLink mutation when onboarding link button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<OnboardingCompletionModal {...defaultProps} />);

    const onboardButton = screen.getByRole("button", {
      name: /Send me a link to finish onboarding/i,
    });
    await user.click(onboardButton);

    await waitFor(() => {
      expect(mockMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { email: "approved@example.com" },
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Onboarding link sent!");
    });
  });

  it("shows success text after sending onboarding link", async () => {
    const user = userEvent.setup({ delay: null });
    render(<OnboardingCompletionModal {...defaultProps} />);

    const onboardButton = screen.getByRole("button", {
      name: /Send me a link to finish onboarding/i,
    });
    await user.click(onboardButton);

    await waitFor(() => {
      expect(screen.getByText(/Onboarding link sent/i)).toBeInTheDocument();
    });
  });

  it("navigates to forgot-password page when 'Create Password now' is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<OnboardingCompletionModal {...defaultProps} />);

    const passwordButton = screen.getByRole("button", { name: /Create Password now/i });
    await user.click(passwordButton);

    expect(mockPush).toHaveBeenCalledWith(
      "/auths/forgot-password?email=approved%40example.com"
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows error message and toast when sendMagicLink fails", async () => {
    const user = userEvent.setup({ delay: null });
    const originalError = console.error;
    console.error = jest.fn();

    mockMutation.mockRejectedValueOnce(new Error("Network error"));

    render(<OnboardingCompletionModal {...defaultProps} />);

    const onboardButton = screen.getByRole("button", {
      name: /Send me a link to finish onboarding/i,
    });
    await user.click(onboardButton);

    await waitFor(() => {
      expect(
        screen.getByText(/There was an error sending the onboarding link/i)
      ).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith("Something went wrong");

    console.error = originalError;
  });

  it("disables button while onboarding link is being sent", async () => {
    const user = userEvent.setup({ delay: null });
    // Make the mutation hang
    mockMutation.mockReturnValue(new Promise(() => {}));

    render(<OnboardingCompletionModal {...defaultProps} />);

    const onboardButton = screen.getByRole("button", {
      name: /Send me a link to finish onboarding/i,
    });
    await user.click(onboardButton);

    await waitFor(() => {
      expect(onboardButton).toBeDisabled();
    });
  });
});
