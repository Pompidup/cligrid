import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Spinner, SPINNER_FRAMES } from "../src/components/spinner.js";
import type { RenderLine } from "../src/entities/component.js";

function renderText(spinner: Spinner): string {
  const output = spinner.render() as RenderLine;
  return output.text;
}

describe("Spinner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render the first frame by default (dots)", () => {
    const spinner = new Spinner({
      id: "s1",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
    });

    expect(renderText(spinner)).toBe("⠋");
  });

  it("should render with a label", () => {
    const spinner = new Spinner({
      id: "s2",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { label: "Loading..." },
    });

    expect(renderText(spinner)).toBe("⠋ Loading...");
  });

  it("should cycle frames with nextFrame()", () => {
    const spinner = new Spinner({
      id: "s3",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
    });

    expect(renderText(spinner)).toBe("⠋");
    spinner.nextFrame();
    expect(renderText(spinner)).toBe("⠙");
    spinner.nextFrame();
    expect(renderText(spinner)).toBe("⠹");
  });

  it("should wrap around to the first frame", () => {
    const spinner = new Spinner({
      id: "s4",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
    });

    const frames = SPINNER_FRAMES.dots;
    // Advance through all frames
    for (let i = 0; i < frames.length; i++) {
      spinner.nextFrame();
    }
    // Should be back to first frame
    expect(renderText(spinner)).toBe("⠋");
  });

  it("should render line style", () => {
    const spinner = new Spinner({
      id: "s5",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { style: "line" },
    });

    expect(renderText(spinner)).toBe("-");
    spinner.nextFrame();
    expect(renderText(spinner)).toBe("\\");
    spinner.nextFrame();
    expect(renderText(spinner)).toBe("|");
    spinner.nextFrame();
    expect(renderText(spinner)).toBe("/");
  });

  it("should render arc style", () => {
    const spinner = new Spinner({
      id: "s6",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { style: "arc" },
    });

    expect(renderText(spinner)).toBe("◜");
    spinner.nextFrame();
    expect(renderText(spinner)).toBe("◠");
  });

  it("should render bouncingBar style", () => {
    const spinner = new Spinner({
      id: "s7",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { style: "bouncingBar" },
    });

    expect(renderText(spinner)).toBe("[    ]");
    spinner.nextFrame();
    expect(renderText(spinner)).toBe("[=   ]");
  });

  it("should auto-advance frames on mount via setInterval", () => {
    const spinner = new Spinner({
      id: "s8",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
    });

    spinner.emit("mount");

    expect(renderText(spinner)).toBe("⠋");
    vi.advanceTimersByTime(80);
    expect(renderText(spinner)).toBe("⠙");
    vi.advanceTimersByTime(80);
    expect(renderText(spinner)).toBe("⠹");

    // Cleanup
    spinner.emit("destroy");
  });

  it("should stop auto-advance on destroy", () => {
    const spinner = new Spinner({
      id: "s9",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
    });

    spinner.emit("mount");
    vi.advanceTimersByTime(80);
    expect(renderText(spinner)).toBe("⠙");

    spinner.emit("destroy");
    vi.advanceTimersByTime(160);
    // Should still be at frame 1 (no more advances)
    expect(renderText(spinner)).toBe("⠙");
  });

  it("should render with a specific frameIndex", () => {
    const spinner = new Spinner({
      id: "s10",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { frameIndex: 5 },
    });

    expect(renderText(spinner)).toBe("⠴");
  });

  it("should expose frames via getFrames()", () => {
    const spinner = new Spinner({
      id: "s11",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { style: "line" },
    });

    expect(spinner.getFrames()).toEqual(["-", "\\", "|", "/"]);
  });
});
