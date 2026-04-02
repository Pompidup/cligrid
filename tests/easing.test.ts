import { describe, it, expect } from "vitest";
import { linear, easeIn, easeOut, easeInOut, bounce, elastic } from "../src/utils/easing.js";

describe("easing functions", () => {
  const fns = { linear, easeIn, easeOut, easeInOut, bounce, elastic };

  for (const [name, fn] of Object.entries(fns)) {
    describe(name, () => {
      it("returns 0 at t=0", () => {
        expect(fn(0)).toBeCloseTo(0, 5);
      });

      it("returns 1 at t=1", () => {
        expect(fn(1)).toBeCloseTo(1, 5);
      });

      it("returns a number at t=0.5", () => {
        const result = fn(0.5);
        expect(typeof result).toBe("number");
        expect(Number.isFinite(result)).toBe(true);
      });
    });
  }

  it("linear(0.5) === 0.5", () => {
    expect(linear(0.5)).toBeCloseTo(0.5, 5);
  });

  it("easeIn(0.5) === 0.25", () => {
    expect(easeIn(0.5)).toBeCloseTo(0.25, 5);
  });

  it("easeOut(0.5) === 0.75", () => {
    expect(easeOut(0.5)).toBeCloseTo(0.75, 5);
  });

  it("easeInOut(0.5) === 0.5", () => {
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 5);
  });

  it("linear is monotonically increasing", () => {
    for (let t = 0; t < 1; t += 0.1) {
      expect(linear(t + 0.05)).toBeGreaterThanOrEqual(linear(t));
    }
  });

  it("easeIn is monotonically increasing", () => {
    for (let t = 0; t < 1; t += 0.1) {
      expect(easeIn(t + 0.05)).toBeGreaterThanOrEqual(easeIn(t));
    }
  });

  it("easeOut is monotonically increasing", () => {
    for (let t = 0; t <= 0.9; t += 0.1) {
      expect(easeOut(t + 0.05)).toBeGreaterThanOrEqual(easeOut(t) - 1e-10);
    }
  });
});
