import { describe, it, expect } from "vitest";
import { darkTheme, lightTheme, resolveThemeColor } from "../src/entities/theme.js";
import type { Theme } from "../src/entities/theme.js";

describe("Theme", () => {
  describe("resolveThemeColor", () => {
    it("should resolve a theme token to its color value", () => {
      expect(resolveThemeColor("primary", darkTheme)).toBe("#5B9BD5");
      expect(resolveThemeColor("danger", darkTheme)).toBe("#FF3B30");
      expect(resolveThemeColor("success", darkTheme)).toBe("#34C759");
    });

    it("should return the color as-is if not a theme token", () => {
      expect(resolveThemeColor("#FF0000", darkTheme)).toBe("#FF0000");
      expect(resolveThemeColor("red", darkTheme)).toBe("red");
    });

    it("should return the color as-is if no theme is set", () => {
      expect(resolveThemeColor("primary", null)).toBe("primary");
      expect(resolveThemeColor("#FF0000", null)).toBe("#FF0000");
    });

    it("should return undefined for undefined color", () => {
      expect(resolveThemeColor(undefined, darkTheme)).toBeUndefined();
      expect(resolveThemeColor(undefined, null)).toBeUndefined();
    });

    it("should resolve tokens from light theme differently", () => {
      expect(resolveThemeColor("primary", lightTheme)).toBe("#007AFF");
      expect(resolveThemeColor("surface", lightTheme)).toBe("#F2F2F7");
    });
  });

  describe("darkTheme", () => {
    it("should have all standard tokens", () => {
      const tokens = ["primary", "secondary", "danger", "success", "warning", "surface", "text", "border", "muted", "accent"];
      for (const token of tokens) {
        expect(darkTheme[token]).toBeDefined();
      }
    });
  });

  describe("lightTheme", () => {
    it("should have all standard tokens", () => {
      const tokens = ["primary", "secondary", "danger", "success", "warning", "surface", "text", "border", "muted", "accent"];
      for (const token of tokens) {
        expect(lightTheme[token]).toBeDefined();
      }
    });

    it("should differ from dark theme on surface and text", () => {
      expect(lightTheme.surface).not.toBe(darkTheme.surface);
      expect(lightTheme.text).not.toBe(darkTheme.text);
    });
  });

  describe("custom theme", () => {
    it("should work with custom tokens", () => {
      const custom: Theme = {
        primary: "#123456",
        myCustomColor: "#ABCDEF",
      };

      expect(resolveThemeColor("primary", custom)).toBe("#123456");
      expect(resolveThemeColor("myCustomColor", custom)).toBe("#ABCDEF");
      expect(resolveThemeColor("unknown", custom)).toBe("unknown");
    });
  });
});
