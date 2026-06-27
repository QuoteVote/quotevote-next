import { fireEvent, render, screen, waitFor } from "@/__tests__/utils/test-utils";
import ChatSearchInput from "@/components/Chat/ChatSearchInput";

describe("ChatSearchInput", () => {
  it("does not clear search immediately in normal search mode", () => {
    const setSearch = jest.fn();
    const onAddBuddyModeChange = jest.fn();

    render(
      <ChatSearchInput
        setSearch={setSearch}
        addBuddyMode={false}
        onAddBuddyModeChange={onAddBuddyModeChange}
      />
    );

    const input = screen.getByLabelText("search conversations");
    fireEvent.change(input, { target: { value: "test search" } });

    expect(input).toHaveValue("test search");
    expect(setSearch).toHaveBeenLastCalledWith("test search");
  });

  it("clears search when exiting add buddy mode", async () => {
    const setSearch = jest.fn();
    const onAddBuddyModeChange = jest.fn();

    const { rerender } = render(
      <ChatSearchInput
        setSearch={setSearch}
        addBuddyMode={true}
        onAddBuddyModeChange={onAddBuddyModeChange}
      />
    );

    const input = screen.getByLabelText("search users to add");
    fireEvent.change(input, { target: { value: "alice" } });
    expect(input).toHaveValue("alice");

    rerender(
      <ChatSearchInput
        setSearch={setSearch}
        addBuddyMode={false}
        onAddBuddyModeChange={onAddBuddyModeChange}
      />
    );

    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(setSearch).toHaveBeenLastCalledWith("");
    });
  });
});
