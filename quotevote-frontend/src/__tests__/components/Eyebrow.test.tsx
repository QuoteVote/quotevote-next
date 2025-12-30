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

describe("Eyebrow Component", () => {
  const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockUseAppStore.mockReturnValue(null);
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ status: "registered" }),
    });

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");

    await user.click(continueButton);

    // Check whether login options modal opens up
    await waitFor(() => {
      expect(screen.getByText(/We recognize this email./i)).toBeInTheDocument();
    });
  });

  it("displays feedback message when user is 'not_requested'", async () => {
    const user = userEvent.setup();

    render(<Eyebrow />);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ status: "not_requested" }),
    });

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");

    await user.click(continueButton);

    const feedbackMessages = await screen.findAllByText(
      "Your request has been received! You’ll be notified once approved."
    );

    expect(feedbackMessages.length).toBeGreaterThan(0);
  });

  it("displays feedback message when user is 'requested_pending'", async () => {
    const user = userEvent.setup();

    render(<Eyebrow />);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ status: "requested_pending" }),
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

  it("displays login options modal when user is 'approved_no_password'", async () => {
    const user = userEvent.setup();

    render(<Eyebrow />);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ status: "approved_no_password" }),
    });

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const continueButton = screen.getByRole("button", { name: /Continue/i });

    await user.type(emailInput, "testuser@email.com");

    await user.click(continueButton);

    // Check whether onboarding completion modal opens up
    await waitFor(() => {
      expect(screen.getByText(/Your invite is approved!/i)).toBeInTheDocument();
    });
  });
});
