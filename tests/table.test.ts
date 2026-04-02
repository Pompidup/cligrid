import { describe, it, expect } from "vitest";
import { Table } from "../src/components/table.js";
import type { RenderLine } from "../src/entities/component.js";

function renderLines(table: Table, width = 40): RenderLine[] {
  const output = table.render({ width, height: 10, focused: false, terminalWidth: 80, terminalHeight: 24 });
  return output as RenderLine[];
}

function lineText(line: RenderLine): string {
  if (line.segments) {
    return line.segments.map((s) => s.text).join("");
  }
  return line.text;
}

describe("Table", () => {
  it("should render header and rows", () => {
    const table = new Table({
      id: "t1",
      position: { x: 0, y: 0 },
      width: 40,
      height: 10,
      props: {
        columns: [
          { key: "name", label: "Name" },
          { key: "age", label: "Age" },
        ],
        rows: [
          { name: "Alice", age: "30" },
          { name: "Bob", age: "25" },
        ],
      },
    });

    const lines = renderLines(table);
    // header + separator + 2 rows = 4 lines
    expect(lines.length).toBe(4);

    // Header has bold+underline segments
    const header = lines[0]!;
    expect(header.segments).toBeDefined();
    const headerText = lineText(header);
    expect(headerText).toContain("Name");
    expect(headerText).toContain("Age");
    expect(header.segments!.some((s) => s.style?.bold && s.style?.underline)).toBe(true);

    // Separator has ─
    expect(lines[1]!.text).toContain("─");

    // Rows have data
    const row1Text = lineText(lines[2]!);
    expect(row1Text).toContain("Alice");
    expect(row1Text).toContain("30");

    const row2Text = lineText(lines[3]!);
    expect(row2Text).toContain("Bob");
    expect(row2Text).toContain("25");
  });

  it("should align columns right", () => {
    const table = new Table({
      id: "t2",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        columns: [
          { key: "item", label: "Item", width: 10 },
          { key: "price", label: "Price", width: 10, align: "right" },
        ],
        rows: [{ item: "Apple", price: "1.50" }],
      },
    });

    const lines = renderLines(table, 30);
    const row = lines[2]!;
    const priceSegment = row.segments!.find((s) => s.text.includes("1.50"));
    expect(priceSegment).toBeDefined();
    // Right-aligned: padding should be on the left
    expect(priceSegment!.text.startsWith(" ")).toBe(true);
  });

  it("should align columns center", () => {
    const table = new Table({
      id: "t3",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        columns: [{ key: "val", label: "Value", width: 10, align: "center" }],
        rows: [{ val: "Hi" }],
      },
    });

    const lines = renderLines(table, 30);
    const row = lines[2]!;
    const cellText = lineText(row);
    // "Hi" centered in 10 chars: "    Hi    "
    expect(cellText).toContain("Hi");
    const seg = row.segments!.find((s) => s.text.includes("Hi"));
    // Should have leading spaces for centering
    expect(seg!.text.length).toBe(10);
  });

  it("should use fixed column widths", () => {
    const table = new Table({
      id: "t4",
      position: { x: 0, y: 0 },
      width: 40,
      height: 10,
      props: {
        columns: [
          { key: "a", label: "A", width: 5 },
          { key: "b", label: "B", width: 15 },
        ],
        rows: [{ a: "X", b: "Y" }],
      },
    });

    const lines = renderLines(table);
    // Separator uses exact widths: 5 + "─┼─" + 15 = 23
    expect(lines[1]!.text).toBe("──────┼────────────────");
  });

  it("should handle empty rows", () => {
    const table = new Table({
      id: "t5",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        columns: [{ key: "name", label: "Name" }],
        rows: [],
      },
    });

    const lines = renderLines(table, 30);
    // header + separator only
    expect(lines.length).toBe(2);
  });

  it("should handle missing row keys gracefully", () => {
    const table = new Table({
      id: "t6",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        columns: [
          { key: "name", label: "Name", width: 10 },
          { key: "email", label: "Email", width: 10 },
        ],
        rows: [{ name: "Alice" }], // missing "email"
      },
    });

    const lines = renderLines(table, 30);
    const rowText = lineText(lines[2]!);
    expect(rowText).toContain("Alice");
    // Missing key renders as empty string padded
    expect(lines[2]!.segments!.length).toBeGreaterThan(0);
  });

  it("should truncate long cell values to column width", () => {
    const table = new Table({
      id: "t7",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        columns: [{ key: "name", label: "Name", width: 5 }],
        rows: [{ name: "Alexander" }],
      },
    });

    const lines = renderLines(table, 30);
    const rowText = lineText(lines[2]!);
    // "Alexander" truncated to 5 chars
    expect(rowText.length).toBeLessThanOrEqual(5);
  });

  it("should support scrollable via component config", () => {
    const table = new Table({
      id: "t8",
      position: { x: 0, y: 0 },
      width: 30,
      height: 5,
      scrollable: true,
      props: {
        columns: [{ key: "name", label: "Name" }],
        rows: [
          { name: "A" },
          { name: "B" },
          { name: "C" },
          { name: "D" },
          { name: "E" },
        ],
      },
    });

    expect(table.scrollable).toBe(true);
    // scrollTo/scrollBy are clamped by totalLines which is set by the renderer
    // Here we just verify the component accepts scrollable config
  });

  it("should render separator with multiple columns", () => {
    const table = new Table({
      id: "t9",
      position: { x: 0, y: 0 },
      width: 40,
      height: 10,
      props: {
        columns: [
          { key: "a", label: "A", width: 3 },
          { key: "b", label: "B", width: 3 },
          { key: "c", label: "C", width: 3 },
        ],
        rows: [],
      },
    });

    const lines = renderLines(table);
    // Separator: "───" + "─┼─" + "───" + "─┼─" + "───" = "────┼─────┼────"
    expect(lines[1]!.text).toBe("────┼─────┼────");
  });
});
