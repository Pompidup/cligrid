import { describe, it, expect } from "vitest";
import { fgCode, bgCode, stylize } from "../src/utils/ansi.js";

describe("ANSI utilities", () => {
  describe("fgCode", () => {
    it("should return correct code for named colors", () => {
      expect(fgCode("red")).toBe("\x1b[31m");
      expect(fgCode("green")).toBe("\x1b[32m");
      expect(fgCode("brightCyan")).toBe("\x1b[96m");
    });

    it("should return correct code for hex colors", () => {
      expect(fgCode("#ff0000")).toBe("\x1b[38;2;255;0;0m");
      expect(fgCode("#00ff00")).toBe("\x1b[38;2;0;255;0m");
    });

    it("should return empty string for unknown colors", () => {
      expect(fgCode("notacolor")).toBe("");
    });
  });

  describe("bgCode", () => {
    it("should return correct code for named colors", () => {
      expect(bgCode("red")).toBe("\x1b[41m");
      expect(bgCode("blue")).toBe("\x1b[44m");
    });

    it("should return correct code for hex colors", () => {
      expect(bgCode("#0000ff")).toBe("\x1b[48;2;0;0;255m");
    });
  });

  describe("stylize", () => {
    it("should return plain text when no style applied", () => {
      expect(stylize("hello", {})).toBe("hello");
    });

    it("should apply bold", () => {
      const result = stylize("hello", { bold: true });
      expect(result).toBe("\x1b[1mhello\x1b[0m");
    });

    it("should apply dim", () => {
      const result = stylize("hello", { dim: true });
      expect(result).toBe("\x1b[2mhello\x1b[0m");
    });

    it("should apply underline", () => {
      const result = stylize("hello", { underline: true });
      expect(result).toBe("\x1b[4mhello\x1b[0m");
    });

    it("should apply foreground color", () => {
      const result = stylize("hello", { fg: "red" });
      expect(result).toBe("\x1b[31mhello\x1b[0m");
    });

    it("should apply background color", () => {
      const result = stylize("hello", { bg: "blue" });
      expect(result).toBe("\x1b[44mhello\x1b[0m");
    });

    it("should apply italic", () => {
      const result = stylize("hello", { italic: true });
      expect(result).toBe("\x1b[3mhello\x1b[0m");
    });

    it("should apply strikethrough", () => {
      const result = stylize("hello", { strikethrough: true });
      expect(result).toBe("\x1b[9mhello\x1b[0m");
    });

    it("should apply inverse", () => {
      const result = stylize("hello", { inverse: true });
      expect(result).toBe("\x1b[7mhello\x1b[0m");
    });

    it("should combine multiple styles", () => {
      const result = stylize("hello", { bold: true, fg: "green", bg: "#ff0000" });
      expect(result).toBe("\x1b[1m\x1b[32m\x1b[48;2;255;0;0mhello\x1b[0m");
    });

    it("should combine all style attributes", () => {
      const result = stylize("hello", { bold: true, italic: true, strikethrough: true, inverse: true });
      expect(result).toBe("\x1b[1m\x1b[3m\x1b[7m\x1b[9mhello\x1b[0m");
    });
  });
});
