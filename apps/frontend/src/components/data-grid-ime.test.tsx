import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InputTags, useDataGrid } from "@wealthfolio/ui";
import { describe, expect, it, vi } from "vitest";

interface TestRow {
  name: string | null;
}

function GridHarness() {
  const grid = useDataGrid<TestRow>({
    data: [{ name: null }, { name: null }],
    columns: [{ accessorKey: "name", meta: { cell: { variant: "short-text" } } }],
  });

  return (
    <>
      <button type="button" onClick={() => grid.tableMeta?.onCellEditingStart?.(0, "name")}>
        Edit cell
      </button>
      <div ref={grid.dataGridRef} data-testid="grid" />
      <output data-testid="editing">{grid.editingCell ? "editing" : "idle"}</output>
    </>
  );
}

describe("CJK IME composition", () => {
  it.each(["Enter", "Escape", "Tab"])("keeps the grid edit open for composing %s", async (key) => {
    render(<GridHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Edit cell" }));
    expect(screen.getByTestId("editing")).toHaveTextContent("editing");

    fireEvent.keyDown(screen.getByTestId("grid"), { key, isComposing: true });
    await act(() => Promise.resolve());
    expect(screen.getByTestId("editing")).toHaveTextContent("editing");

    fireEvent.keyDown(screen.getByTestId("grid"), { key });
    await waitFor(() => expect(screen.getByTestId("editing")).toHaveTextContent("idle"));
  });

  it("does not add a tag until composition has finished", () => {
    const onChange = vi.fn();
    render(<InputTags aria-label="Tags" value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Tags" });

    fireEvent.change(input, { target: { value: "候選" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["候選"]);
  });
});
