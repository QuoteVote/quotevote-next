import { fireEvent, render, screen } from "@/__tests__/utils/test-utils";
import SelectedPassageSummary from "@/components/PostActions/SelectedPassageSummary";

describe("SelectedPassageSummary", () => {
  it("shows the passage with its votes and responses", () => {
    render(
      <SelectedPassageSummary
        summary={{ text: "raise money for bus lanes", agree: 4, disagree: 1, responses: 6 }}
        onClear={jest.fn()}
      />
    );
    const section = screen.getByRole("region", { name: "Selected passage" });
    expect(section).toHaveTextContent("raise money for bus lanes");
    expect(section).toHaveTextContent("↑ 4 agree");
    expect(section).toHaveTextContent("↓ 1 disagree");
    expect(section).toHaveTextContent("6 responses");
  });

  it("says 1 response and clears the selection", () => {
    const onClear = jest.fn();
    render(
      <SelectedPassageSummary
        summary={{ text: "a trial", agree: 0, disagree: 0, responses: 1 }}
        onClear={onClear}
      />
    );
    expect(screen.getByText("1 response")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all responses" }));
    expect(onClear).toHaveBeenCalled();
  });
});
