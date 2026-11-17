import { fireEvent, render, screen } from "@/__tests__/utils/test-utils";
import SelectedPassageSummary from "@/components/PostActions/SelectedPassageSummary";

describe("SelectedPassageSummary", () => {
  it("shows the passage with its votes and responses", () => {
    render(
      <SelectedPassageSummary
        summary={{
          text: "raise money for bus lanes",
          votes: [
            { key: "#agree", label: "agree", count: 4, direction: "up" },
            { key: "#false", label: "false", count: 1, direction: "down" },
            { key: "#like", label: "like", count: 2, direction: "up" },
          ],
          responses: 7,
        }}
        onClear={jest.fn()}
      />
    );
    const section = screen.getByRole("region", { name: "Selected passage" });
    expect(section).toHaveTextContent("raise money for bus lanes");
    expect(section).toHaveTextContent("↑ 4 agree");
    expect(section).toHaveTextContent("↓ 1 false");
    expect(section).toHaveTextContent("↑ 2 like");
    expect(section).not.toHaveTextContent("disagree");
    expect(section).toHaveTextContent("7 responses");
  });

  it("says 1 response and clears the selection", () => {
    const onClear = jest.fn();
    render(
      <SelectedPassageSummary
        summary={{ text: "a trial", votes: [], responses: 1 }}
        onClear={onClear}
      />
    );
    expect(screen.getByText("1 response")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all responses" }));
    expect(onClear).toHaveBeenCalled();
  });
});
