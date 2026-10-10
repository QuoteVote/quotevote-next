import { render, screen, fireEvent, waitFor, type MockedResponse } from "../../utils/test-utils";
import ForgotPasswordPageContent from "@/app/auths/(split)/forgot-password/PageContent";
import { SEND_PASSWORD_RESET_EMAIL } from "@/graphql/mutations";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

describe("ForgotPasswordPageContent", () => {
  it("renders email form initially", () => {
    render(<ForgotPasswordPageContent />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^send$/i })).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    const { container } = render(<ForgotPasswordPageContent />);
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: "notanemail" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it("shows email sent view after successful mutation", async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: SEND_PASSWORD_RESET_EMAIL,
          variables: { email: "test@example.com" },
        },
        result: { data: { sendPasswordResetEmail: true } },
      },
    ];
    render(<ForgotPasswordPageContent />, { mocks });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    await waitFor(() => {
      expect(screen.getByText(/email sent/i)).toBeInTheDocument();
    });
  });

  it("renders back to login link", () => {
    render(<ForgotPasswordPageContent />);
    expect(screen.getByRole("link", { name: /^login$/i })).toBeInTheDocument();
  });
});
