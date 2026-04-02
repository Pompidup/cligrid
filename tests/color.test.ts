import { describe, it, expect } from "vitest";
import { parseHex, hexToRgb, rgbToHex, lighten, darken, mix, gradient } from "../src/utils/color.js";

describe("parseHex", () => {
  it("parses 6-char hex", () => {
    expect(parseHex("#ff0000")).toEqual([255, 0, 0]);
    expect(parseHex("#00ff00")).toEqual([0, 255, 0]);
    expect(parseHex("#0000ff")).toEqual([0, 0, 255]);
  });

  it("parses 3-char shorthand", () => {
    expect(parseHex("#f00")).toEqual([255, 0, 0]);
    expect(parseHex("#0f0")).toEqual([0, 255, 0]);
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
  });

  it("is case-insensitive", () => {
    expect(parseHex("#FF0000")).toEqual([255, 0, 0]);
    expect(parseHex("#aaBBcc")).toEqual([170, 187, 204]);
  });

  it("throws on invalid input", () => {
    expect(() => parseHex("invalid")).toThrow();
    expect(() => parseHex("#gggggg")).toThrow();
    expect(() => parseHex("#12345")).toThrow();
  });
});

describe("hexToRgb", () => {
  it("returns object with r, g, b", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("rgbToHex", () => {
  it("converts rgb to hex", () => {
    expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
    expect(rgbToHex(0, 255, 0)).toBe("#00ff00");
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
    expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
  });

  it("clamps out-of-range values", () => {
    expect(rgbToHex(300, -10, 128)).toBe("#ff0080");
  });

  it("roundtrips with hexToRgb", () => {
    const hex = "#ab12cd";
    const { r, g, b } = hexToRgb(hex);
    expect(rgbToHex(r, g, b)).toBe(hex);
  });
});

describe("lighten", () => {
  it("returns same color at amount 0", () => {
    expect(lighten("#808080", 0)).toBe("#808080");
  });

  it("returns white at amount 1", () => {
    expect(lighten("#000000", 1)).toBe("#ffffff");
    expect(lighten("#ff0000", 1)).toBe("#ffffff");
  });

  it("lightens a mid color", () => {
    const result = hexToRgb(lighten("#000000", 0.5));
    expect(result.r).toBeGreaterThan(60);
    expect(result.g).toBeGreaterThan(60);
    expect(result.b).toBeGreaterThan(60);
  });
});

describe("darken", () => {
  it("returns same color at amount 0", () => {
    expect(darken("#808080", 0)).toBe("#808080");
  });

  it("returns black at amount 1", () => {
    expect(darken("#ffffff", 1)).toBe("#000000");
    expect(darken("#ff0000", 1)).toBe("#000000");
  });

  it("darkens a mid color", () => {
    const original = hexToRgb("#808080");
    const darkened = hexToRgb(darken("#808080", 0.5));
    expect(darkened.r).toBeLessThan(original.r);
    expect(darkened.g).toBeLessThan(original.g);
  });
});

describe("mix", () => {
  it("returns colorA at ratio 0", () => {
    expect(mix("#ff0000", "#0000ff", 0)).toBe("#ff0000");
  });

  it("returns colorB at ratio 1", () => {
    expect(mix("#ff0000", "#0000ff", 1)).toBe("#0000ff");
  });

  it("blends at ratio 0.5", () => {
    const result = mix("#ff0000", "#0000ff", 0.5);
    const rgb = hexToRgb(result);
    expect(rgb.r).toBe(128);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(128);
  });

  it("mixes black and white", () => {
    const result = mix("#000000", "#ffffff", 0.5);
    const rgb = hexToRgb(result);
    expect(rgb.r).toBe(128);
    expect(rgb.g).toBe(128);
    expect(rgb.b).toBe(128);
  });
});

describe("gradient", () => {
  it("returns empty array for steps < 1", () => {
    expect(gradient("#000000", "#ffffff", 0)).toEqual([]);
  });

  it("returns start color for steps = 1", () => {
    expect(gradient("#ff0000", "#0000ff", 1)).toEqual(["#ff0000"]);
  });

  it("returns correct number of steps", () => {
    const result = gradient("#000000", "#ffffff", 5);
    expect(result).toHaveLength(5);
  });

  it("starts and ends with given colors", () => {
    const result = gradient("#000000", "#ffffff", 5);
    expect(result[0]).toBe("#000000");
    expect(result[4]).toBe("#ffffff");
  });

  it("produces evenly distributed colors", () => {
    const result = gradient("#000000", "#ffffff", 3);
    expect(result[0]).toBe("#000000");
    expect(result[1]).toBe("#808080");
    expect(result[2]).toBe("#ffffff");
  });
});
