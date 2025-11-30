import React from "react";
import { render } from "@testing-library/react";
// Using Jest in this project; replace vitest's vi with jest
import { AuthModalProvider, useAuthModal } from "./AuthModalContext";

function TestComponent({ onRender }) {
  const authModal = useAuthModal();
  onRender(authModal);
  return null;
}

describe("AuthModalContext", () => {
  it("provides modal state and control functions", () => {
    let hookValue;

    render(
      <AuthModalProvider>
        <TestComponent
          onRender={(value) => {
            hookValue = value;
          }}
        />
      </AuthModalProvider>
    );

    expect(hookValue.isModalOpen).toBe(false);
    expect(typeof hookValue.openAuthModal).toBe("function");
    expect(typeof hookValue.closeAuthModal).toBe("function");
  });

  it("opens modal when openAuthModal is called", () => {
    let hookValue;

    const { rerender } = render(
      <AuthModalProvider>
        <TestComponent
          onRender={(value) => {
            hookValue = value;
          }}
        />
      </AuthModalProvider>
    );

    hookValue.openAuthModal();

    rerender(
      <AuthModalProvider>
        <TestComponent
          onRender={(value) => {
            hookValue = value;
          }}
        />
      </AuthModalProvider>
    );

    expect(hookValue.isModalOpen).toBe(true);
  });

  it("closes modal when closeAuthModal is called", () => {
    let hookValue;

    const { rerender } = render(
      <AuthModalProvider>
        <TestComponent
          onRender={(value) => {
            hookValue = value;
          }}
        />
      </AuthModalProvider>
    );

    // First open the modal
    hookValue.openAuthModal();
    rerender(
      <AuthModalProvider>
        <TestComponent
          onRender={(value) => {
            hookValue = value;
          }}
        />
      </AuthModalProvider>
    );
    expect(hookValue.isModalOpen).toBe(true);

    // Then close it
    hookValue.closeAuthModal();
    rerender(
      <AuthModalProvider>
        <TestComponent
          onRender={(value) => {
            hookValue = value;
          }}
        />
      </AuthModalProvider>
    );
    expect(hookValue.isModalOpen).toBe(false);
  });

  it("throws error when useAuthModal is used outside provider", () => {
    // Suppress console.error for this test
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent onRender={() => {}} />);
    }).toThrow("useAuthModal must be used within an AuthModalProvider");

    errorSpy.mockRestore();
  });
});
