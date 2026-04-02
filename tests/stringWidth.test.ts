import { describe, it, expect } from "vitest";
import { stringWidth, graphemeSplit, graphemeSliceByWidth } from "../src/utils/stringWidth.js";

describe("stringWidth", () => {
  it("returns correct width for ASCII text", () => {
    expect(stringWidth("hello")).toBe(5);
    expect(stringWidth("")).toBe(0);
  });

  it("returns correct width for CJK characters", () => {
    expect(stringWidth("漢字")).toBe(4);
    expect(stringWidth("漢")).toBe(2);
  });

  it("returns correct width for emoji", () => {
    expect(stringWidth("👍")).toBe(2);
  });

  it("returns correct width for mixed ASCII and wide chars", () => {
    expect(stringWidth("hi漢字")).toBe(6);
    expect(stringWidth("a👍b")).toBe(4);
  });
});

describe("graphemeSplit", () => {
  it("splits ASCII text into individual characters", () => {
    expect(graphemeSplit("abc")).toEqual(["a", "b", "c"]);
  });

  it("splits CJK characters correctly", () => {
    expect(graphemeSplit("漢字")).toEqual(["漢", "字"]);
  });

  it("keeps emoji as single graphemes", () => {
    const result = graphemeSplit("👍");
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("👍");
  });

  it("handles empty string", () => {
    expect(graphemeSplit("")).toEqual([]);
  });
});

describe("graphemeSliceByWidth", () => {
  it("slices ASCII text by width", () => {
    expect(graphemeSliceByWidth("hello", 3)).toBe("hel");
    expect(graphemeSliceByWidth("hello", 10)).toBe("hello");
  });

  it("slices CJK text respecting double-width", () => {
    expect(graphemeSliceByWidth("漢字test", 4)).toBe("漢字");
    expect(graphemeSliceByWidth("漢字test", 5)).toBe("漢字t");
    // Width 3 can only fit one CJK char (width 2) + nothing more (next is also width 2)
    expect(graphemeSliceByWidth("漢字", 3)).toBe("漢");
  });

  it("slices mixed content correctly", () => {
    expect(graphemeSliceByWidth("a漢b", 3)).toBe("a漢");
    expect(graphemeSliceByWidth("a漢b", 4)).toBe("a漢b");
  });

  it("returns empty for width 0", () => {
    expect(graphemeSliceByWidth("hello", 0)).toBe("");
  });
});
