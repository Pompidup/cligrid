import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applySegmentOverflow, segmentsWidth } from "../src/utils/text.js";
import type { SegmentLine } from "../src/utils/text.js";
import type { StyledSegment } from "../src/entities/component.js";
import { createComponent } from "../src/entities/createComponent.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

// --- segmentsWidth ---

describe("segmentsWidth", () => {
  it("should return 0 for empty segments", () => {
    expect(segmentsWidth([])).toBe(0);
  });

  it("should sum text lengths", () => {
    const segs: StyledSegment[] = [
      { text: "Hello" },
      { text: " " },
      { text: "World" },
    ];
    expect(segmentsWidth(segs)).toBe(11);
  });
});

// --- applySegmentOverflow: hidden ---

describe("applySegmentOverflow - hidden", () => {
  it("should truncate segments that exceed width", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "Hello World" }] },
    ];
    const result = applySegmentOverflow(lines, 5, "hidden");
    expect(result).toHaveLength(1);
    expect(result[0]!.segments).toEqual([{ text: "Hello" }]);
  });

  it("should truncate across segment boundaries", () => {
    const lines: SegmentLine[] = [
      {
        segments: [
          { text: "ABC", style: { fg: "red" } },
          { text: "DEF", style: { fg: "blue" } },
        ],
      },
    ];
    const result = applySegmentOverflow(lines, 4, "hidden");
    expect(result[0]!.segments).toEqual([
      { text: "ABC", style: { fg: "red" } },
      { text: "D", style: { fg: "blue" } },
    ]);
  });

  it("should not modify segments that fit", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "Hi" }] },
    ];
    const result = applySegmentOverflow(lines, 10, "hidden");
    expect(result[0]!.segments).toEqual([{ text: "Hi" }]);
  });

  it("should preserve alignment", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "Hello" }], align: "center" },
    ];
    const result = applySegmentOverflow(lines, 10, "hidden");
    expect(result[0]!.align).toBe("center");
  });
});

// --- applySegmentOverflow: ellipsis ---

describe("applySegmentOverflow - ellipsis", () => {
  it("should add ellipsis when segments exceed width", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "Hello World" }] },
    ];
    const result = applySegmentOverflow(lines, 8, "ellipsis");
    expect(result[0]!.segments).toEqual([
      { text: "Hello" },
      { text: "...", style: undefined },
    ]);
  });

  it("should add ellipsis across segment boundaries", () => {
    const lines: SegmentLine[] = [
      {
        segments: [
          { text: "ABCD", style: { fg: "red" } },
          { text: "EFGH", style: { fg: "blue" } },
        ],
      },
    ];
    // width=6: truncate to 3 chars + "..."
    const result = applySegmentOverflow(lines, 6, "ellipsis");
    expect(result[0]!.segments).toEqual([
      { text: "ABC", style: { fg: "red" } },
      { text: "...", style: { fg: "red" } },
    ]);
  });

  it("should not add ellipsis when segments fit", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "Hi" }] },
    ];
    const result = applySegmentOverflow(lines, 10, "ellipsis");
    expect(result[0]!.segments).toEqual([{ text: "Hi" }]);
  });

  it("should handle very small width", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "Hello" }] },
    ];
    const result = applySegmentOverflow(lines, 3, "ellipsis");
    expect(result[0]!.segments).toEqual([{ text: "Hel" }]);
  });
});

// --- applySegmentOverflow: wrap ---

describe("applySegmentOverflow - wrap", () => {
  it("should wrap long single segment", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "ABCDEFGH" }] },
    ];
    const result = applySegmentOverflow(lines, 3, "wrap");
    expect(result).toHaveLength(3);
    expect(result[0]!.segments).toEqual([{ text: "ABC" }]);
    expect(result[1]!.segments).toEqual([{ text: "DEF" }]);
    expect(result[2]!.segments).toEqual([{ text: "GH" }]);
  });

  it("should split segments at wrap boundary preserving styles", () => {
    const lines: SegmentLine[] = [
      {
        segments: [
          { text: "AABB", style: { fg: "red" } },
          { text: "CCDD", style: { fg: "blue" } },
        ],
      },
    ];
    const result = applySegmentOverflow(lines, 3, "wrap");
    // "AAB" | "BCC" | "DD"
    expect(result).toHaveLength(3);
    // First 3 chars: A,A,B — all from "AABB" (red)
    expect(result[0]!.segments).toEqual([
      { text: "AAB", style: { fg: "red" } },
    ]);
    // Next 3 chars: B (red), C,C (blue)
    expect(result[1]!.segments).toEqual([
      { text: "B", style: { fg: "red" } },
      { text: "CC", style: { fg: "blue" } },
    ]);
    // Last 2 chars: D,D (blue)
    expect(result[2]!.segments).toEqual([
      { text: "DD", style: { fg: "blue" } },
    ]);
  });

  it("should preserve alignment through wrapping", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "ABCDEF" }], align: "right" },
    ];
    const result = applySegmentOverflow(lines, 3, "wrap");
    expect(result[0]!.align).toBe("right");
    expect(result[1]!.align).toBe("right");
  });

  it("should handle empty segments", () => {
    const lines: SegmentLine[] = [
      { segments: [] },
    ];
    const result = applySegmentOverflow(lines, 5, "wrap");
    expect(result).toHaveLength(1);
    expect(result[0]!.segments).toEqual([]);
  });
});

// --- applySegmentOverflow: wrap-word ---

describe("applySegmentOverflow - wrap-word", () => {
  it("should wrap at word boundaries within a single segment", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "Hello beautiful World" }] },
    ];
    const result = applySegmentOverflow(lines, 13, "wrap-word");
    expect(result).toHaveLength(3);
    expect(segmentsText(result[0]!)).toBe("Hello");
    expect(segmentsText(result[1]!)).toBe("beautiful");
    expect(segmentsText(result[2]!)).toBe("World");
  });

  it("should break long words by character", () => {
    const lines: SegmentLine[] = [
      { segments: [{ text: "Superlongword ok" }] },
    ];
    const result = applySegmentOverflow(lines, 5, "wrap-word");
    expect(segmentsText(result[0]!)).toBe("Super");
    expect(segmentsText(result[1]!)).toBe("longw");
    expect(segmentsText(result[2]!)).toBe("ord");
    expect(segmentsText(result[3]!)).toBe("ok");
  });

  it("should preserve styles across word wrap", () => {
    const lines: SegmentLine[] = [
      {
        segments: [
          { text: "red ", style: { fg: "red" } },
          { text: "blue", style: { fg: "blue" } },
        ],
      },
    ];
    const result = applySegmentOverflow(lines, 5, "wrap-word");
    // "red" on line 1, "blue" on line 2
    expect(result).toHaveLength(2);
    expect(result[0]!.segments).toEqual([{ text: "red", style: { fg: "red" } }]);
    expect(result[1]!.segments).toEqual([{ text: "blue", style: { fg: "blue" } }]);
  });
});

// --- Renderer integration: segments ---

describe("Renderer with segments", () => {
  let template: Template;
  let renderer: Renderer;

  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
    template = new Template();
    renderer = new Renderer(template);
  });

  afterEach(() => {
    renderer.destroy();
  });

  it("should render segments with individual styles", () => {
    const comp = createComponent({
      id: "seg",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      render: () => [
        {
          text: "",
          segments: [
            { text: "AB", style: { fg: "red" } },
            { text: "CD", style: { fg: "blue" } },
          ],
        },
      ],
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    expect(buf.getCell(0, 0)?.char).toBe("A");
    expect(buf.getCell(0, 0)?.fg).toBe("red");
    expect(buf.getCell(1, 0)?.char).toBe("B");
    expect(buf.getCell(1, 0)?.fg).toBe("red");
    expect(buf.getCell(2, 0)?.char).toBe("C");
    expect(buf.getCell(2, 0)?.fg).toBe("blue");
    expect(buf.getCell(3, 0)?.char).toBe("D");
    expect(buf.getCell(3, 0)?.fg).toBe("blue");
  });

  it("should merge line-level style with segment styles", () => {
    const comp = createComponent({
      id: "merge",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      render: () => [
        {
          text: "",
          style: { bg: "black" },
          segments: [
            { text: "A", style: { fg: "red" } },
            { text: "B" },
          ],
        },
      ],
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    // Segment A: fg=red, bg=black (line style merged)
    expect(buf.getCell(0, 0)?.fg).toBe("red");
    expect(buf.getCell(0, 0)?.bg).toBe("black");
    // Segment B: no fg, bg=black (line style as base)
    expect(buf.getCell(1, 0)?.fg).toBeUndefined();
    expect(buf.getCell(1, 0)?.bg).toBe("black");
  });

  it("should truncate segments with hidden overflow", () => {
    const comp = createComponent({
      id: "trunc",
      position: { x: 0, y: 0 },
      width: 4,
      height: 1,
      margin: 0,
      style: { overflow: "hidden" },
      render: () => [
        {
          text: "",
          segments: [
            { text: "AB", style: { fg: "red" } },
            { text: "CDEF", style: { fg: "blue" } },
          ],
        },
      ],
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    expect(buf.getCell(0, 0)?.char).toBe("A");
    expect(buf.getCell(1, 0)?.char).toBe("B");
    expect(buf.getCell(2, 0)?.char).toBe("C");
    expect(buf.getCell(3, 0)?.char).toBe("D");
    // E and F should not be written
    expect(buf.getCell(4, 0)?.char).toBe(" ");
  });

  it("should fallback to text when no segments provided (backward compat)", () => {
    const comp = createComponent({
      id: "compat",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      margin: 0,
      render: () => "Hello World",
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    let text = "";
    for (let i = 0; i < 11; i++) {
      text += buf.getCell(i, 0)?.char ?? "";
    }
    expect(text).toBe("Hello World");
  });
});

// --- Renderer integration: alignment ---

describe("Renderer with alignment", () => {
  let template: Template;
  let renderer: Renderer;

  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
    template = new Template();
    renderer = new Renderer(template);
  });

  afterEach(() => {
    renderer.destroy();
  });

  it("should center-align text", () => {
    const comp = createComponent({
      id: "center",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      render: () => [{ text: "Hi", align: "center" as const }],
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    // "Hi" is 2 chars, width=10, offset = floor((10-2)/2) = 4
    expect(buf.getCell(3, 0)?.char).toBe(" ");
    expect(buf.getCell(4, 0)?.char).toBe("H");
    expect(buf.getCell(5, 0)?.char).toBe("i");
    expect(buf.getCell(6, 0)?.char).toBe(" ");
  });

  it("should right-align text", () => {
    const comp = createComponent({
      id: "right",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      render: () => [{ text: "Hi", align: "right" as const }],
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    // "Hi" is 2 chars, width=10, offset = 10-2 = 8
    expect(buf.getCell(7, 0)?.char).toBe(" ");
    expect(buf.getCell(8, 0)?.char).toBe("H");
    expect(buf.getCell(9, 0)?.char).toBe("i");
  });

  it("should left-align text by default", () => {
    const comp = createComponent({
      id: "left",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      render: () => [{ text: "Hi", align: "left" as const }],
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    expect(buf.getCell(0, 0)?.char).toBe("H");
    expect(buf.getCell(1, 0)?.char).toBe("i");
  });

  it("should center-align segments", () => {
    const comp = createComponent({
      id: "center-seg",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      render: () => [
        {
          text: "",
          align: "center" as const,
          segments: [
            { text: "A", style: { fg: "red" } },
            { text: "B", style: { fg: "blue" } },
          ],
        },
      ],
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    // "AB" = 2 chars, width=10, offset = 4
    expect(buf.getCell(4, 0)?.char).toBe("A");
    expect(buf.getCell(4, 0)?.fg).toBe("red");
    expect(buf.getCell(5, 0)?.char).toBe("B");
    expect(buf.getCell(5, 0)?.fg).toBe("blue");
  });
});

// --- Helper ---

function segmentsText(line: SegmentLine): string {
  return line.segments.map((s) => s.text).join("");
}
