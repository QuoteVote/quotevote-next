import { render, screen } from "@testing-library/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardError from "@/app/(dashboard)/error";
import { reportError } from "@/lib/errorTracking/client";

jest.mock("@/lib/errorTracking/client", () => ({ reportError: jest.fn() }));

const Crash = (): never => {
  throw new Error("render failed");
};

describe("error reporting from the error screens (#183)", () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("the error boundary reports the error it caught and still shows its fallback", () => {
    render(
      <ErrorBoundary>
        <Crash />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "render failed" }),
      { source: "error-boundary" }
    );
  });

  it("the dashboard error page reports its error once, with the digest", () => {
    const error = Object.assign(new Error("server render failed"), { digest: "4242" });
    const { rerender } = render(<DashboardError error={error} reset={jest.fn()} />);
    rerender(<DashboardError error={error} reset={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(error, { source: "error-page", digest: "4242" });
  });
});
