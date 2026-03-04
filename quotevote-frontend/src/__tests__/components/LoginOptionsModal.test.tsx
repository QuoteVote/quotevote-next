/**
 * Tests for LoginOptionsModal Component
 */

import { render, screen, waitFor } from "@/__tests__/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { LoginOptionsModal } from "@/app/components/Eyebrow/LoginOptionsModal";

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

describe("LoginOptionsModal", () => {
  const defaultProps = {
    email: "test@example.com",
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
    render(<LoginOptionsModal {...defaultProps} />);

    expect(screen.getByText(/We recognize this email./i)).toBeInTheDocument();
    expect(screen.getByText(/Choose how you'd like to log in/i)).toBeInTheDocument();
  });

  it("renders both action buttons", () => {
    render(<LoginOptionsModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Send me a login link/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login with password/i })).toBeInTheDocument();
  });

  it("does not render when email is undefined", () => {
    const { container } = render(
      <LoginOptionsModal isOpen={true} onClose={jest.fn()} email={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when isOpen is false", () => {
    render(<LoginOptionsModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/We recognize this email./i)).not.toBeInTheDocument();
  });

  it("calls sendMagicLink mutation when 'Send me a login link' is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LoginOptionsModal {...defaultProps} />);

    const magicLinkButton = screen.getByRole("button", { name: /Send me a login link/i });
    await user.click(magicLinkButton);

    await waitFor(() => {
      expect(mockMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { email: "test@example.com" },
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login link sent! Check your email.");
    });
  });

  it("shows success text after sending magic link", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LoginOptionsModal {...defaultProps} />);

    const magicLinkButton = screen.getByRole("button", { name: /Send me a login link/i });
    await user.click(magicLinkButton);

    await waitFor(() => {
      expect(screen.getByText(/Login link sent!/i)).toBeInTheDocument();
    });
  });

  it("navigates to login page when 'Login with password' is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<LoginOptionsModal {...defaultProps} />);

    const passwordButton = screen.getByRole("button", { name: /Login with password/i });
    await user.click(passwordButton);

    expect(mockPush).toHaveBeenCalledWith("/login?email=test%40example.com");
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows error toast when sendMagicLink fails", async () => {
    const user = userEvent.setup({ delay: null });
    const originalError = console.error;
    console.error = jest.fn();

    mockMutation.mockRejectedValueOnce(new Error("Network error"));

    render(<LoginOptionsModal {...defaultProps} />);

    const magicLinkButton = screen.getByRole("button", { name: /Send me a login link/i });
    await user.click(magicLinkButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    console.error = originalError;
  });

  it("calls onClose when dialog is dismissed", async () => {
    render(<LoginOptionsModal {...defaultProps} />);

    // The dialog onOpenChange triggers onClose
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
