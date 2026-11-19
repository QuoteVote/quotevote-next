import { render, screen } from "@/__tests__/utils/test-utils";
import { ComicStrip, Scene } from "@/components/Public/Scene";

describe("Scene (updated design illustrations)", () => {
  it("shows a board with plain up and down votes, bubbles and people", () => {
    const { container } = render(
      <Scene
        label="Neighbors discussing a quote"
        background="#fff"
        size="hero"
        board={{
          title: "Downtown parking plan",
          left: "7%",
          top: "9%",
          width: "52%",
          rows: [{ text: "Money for bus lanes", up: 41, down: 6 }],
        }}
        bubbles={[
          { text: "Where is the source?", left: "66%", top: "44%", width: "27%", tail: "right" },
        ]}
        people={[{ name: "k-think", left: "66%", bottom: "-4%", width: "26%", flip: true }]}
      />
    );
    const scene = screen.getByRole("img", { name: "Neighbors discussing a quote" });
    expect(scene).toHaveTextContent("Downtown parking plan");
    expect(scene).toHaveTextContent("↑ 41");
    expect(scene).toHaveTextContent("↓ 6");
    expect(scene).toHaveTextContent("Where is the source?");
    const person = container.querySelector("img") as HTMLImageElement;
    expect(person).toHaveAttribute("src", "/assets/redesign/av/k-think.webp");
    expect(person).toHaveAttribute("alt", "");
    expect(person.style.transform).toBe("scaleX(-1)");
  });

  it("is hidden from screen readers without a label", () => {
    const { container } = render(<Scene background="#fff" size="card" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders a comic strip with four captioned panels", () => {
    render(
      <ComicStrip
        episode={6}
        caption="Parents. Together, we make daycare better."
        panels={["1 · The challenge", "2 · The idea", "3 · The vote", "4 · The result"].map(
          (panel) => ({ panel, background: "#fff" })
        )}
      />
    );
    expect(screen.getByRole("figure")).toHaveTextContent("Episode 6");
    expect(screen.getByText("4 · The result")).toBeInTheDocument();
    expect(screen.getByText("Parents. Together, we make daycare better.")).toBeInTheDocument();
  });
});
