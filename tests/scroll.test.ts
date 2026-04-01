import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createComponent } from "../src/entities/createComponent.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { FocusManager } from "../src/entities/focusManager.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

describe("Scroll offset", () => {
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

  it("should display first lines when scrollOffset is 0", () => {
    const comp = createComponent({
      id: "scroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      margin: 0,
      scrollable: true,
      render: () => "Line0\nLine1\nLine2\nLine3\nLine4",
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    expect(buf.getCell(0, 0)?.char).toBe("L");
    expect(buf.getCell(4, 0)?.char).toBe("0");
    expect(buf.getCell(4, 2)?.char).toBe("2");
  });

  it("should skip lines based on scrollOffset", () => {
    const comp = createComponent({
      id: "scroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      margin: 0,
      scrollable: true,
      render: () => "Line0\nLine1\nLine2\nLine3\nLine4",
    });

    template.addComponent(comp);
    renderer.render();

    comp.scrollTo(2);
    // After scrollTo, partialRender should be triggered via propsChanged
    // Let's just re-render manually to check buffer
    renderer.render();

    const buf = renderer["backBuffer"];
    // Now line 2 should be at y=0
    expect(buf.getCell(4, 0)?.char).toBe("2");
    expect(buf.getCell(4, 1)?.char).toBe("3");
    expect(buf.getCell(4, 2)?.char).toBe("4");
  });

  it("should clamp scrollOffset to valid range", () => {
    const comp = createComponent({
      id: "scroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      margin: 0,
      scrollable: true,
      render: () => "Line0\nLine1\nLine2\nLine3\nLine4",
    });

    template.addComponent(comp);
    renderer.render();

    // 5 total lines, 3 visible => max offset = 2
    comp.scrollTo(100);
    expect(comp.scrollOffset).toBe(2);

    comp.scrollTo(-5);
    expect(comp.scrollOffset).toBe(0);
  });

  it("should support scrollBy", () => {
    const comp = createComponent({
      id: "scroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      margin: 0,
      scrollable: true,
      render: () => "L0\nL1\nL2\nL3\nL4",
    });

    template.addComponent(comp);
    renderer.render();

    comp.scrollBy(1);
    expect(comp.scrollOffset).toBe(1);

    comp.scrollBy(1);
    expect(comp.scrollOffset).toBe(2);

    comp.scrollBy(-1);
    expect(comp.scrollOffset).toBe(1);
  });

  it("should emit scroll event", () => {
    const comp = createComponent({
      id: "scroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      margin: 0,
      scrollable: true,
      render: () => "L0\nL1\nL2\nL3",
    });

    template.addComponent(comp);
    renderer.render();

    const spy = vi.fn();
    comp.on("scroll", spy);

    comp.scrollTo(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  it("should not scroll when not scrollable", () => {
    const comp = createComponent({
      id: "noscroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 2,
      margin: 0,
      scrollable: false,
      render: () => "L0\nL1\nL2\nL3",
    });

    template.addComponent(comp);
    renderer.render();

    // Non-scrollable: scrollOffset stays 0
    const buf = renderer["backBuffer"];
    expect(buf.getCell(1, 0)?.char).toBe("0");
    expect(buf.getCell(1, 1)?.char).toBe("1");
  });

  it("should trigger partialRender on scrollTo", () => {
    const comp = createComponent({
      id: "scroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      margin: 0,
      scrollable: true,
      render: () => "L0\nL1\nL2\nL3",
    });

    template.addComponent(comp);
    renderer.render();

    const partialSpy = vi.spyOn(renderer, "partialRender");
    comp.scrollTo(1);
    expect(partialSpy).toHaveBeenCalled();
  });
});

describe("Scroll indicator", () => {
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

  it("should draw scroll indicator when content overflows", () => {
    const comp = createComponent({
      id: "scroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 4,
      margin: 0,
      scrollable: true,
      render: () => "L0\nL1\nL2\nL3\nL4\nL5\nL6\nL7",
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    // Scroll indicator should be at x=9 (width-1), in the content area
    // Check that we have scroll indicator chars
    const chars = [];
    for (let row = 0; row < 4; row++) {
      chars.push(buf.getCell(9, row)?.char);
    }
    // Should contain "█" and "░" characters
    expect(chars.some((c) => c === "█")).toBe(true);
    expect(chars.some((c) => c === "░")).toBe(true);
  });

  it("should not draw scroll indicator when content fits", () => {
    const comp = createComponent({
      id: "nooverflow",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 0,
      scrollable: true,
      render: () => "L0\nL1\nL2",
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    // No indicator should be drawn at x=9
    const chars = [];
    for (let row = 0; row < 5; row++) {
      chars.push(buf.getCell(9, row)?.char);
    }
    expect(chars.every((c) => c !== "█" && c !== "░")).toBe(true);
  });
});

describe("Scroll via keyboard", () => {
  it("should scroll on arrow keys when focused and scrollable", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
    const template = new Template();
    const renderer = new Renderer(template);

    const comp = createComponent({
      id: "scroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      margin: 0,
      scrollable: true,
      render: () => "L0\nL1\nL2\nL3\nL4",
    });

    template.addComponent(comp);
    renderer.render();

    const fm = new FocusManager();
    fm.register(comp);

    fm.handleKeyEvent({ key: "down", ctrl: false, shift: false, meta: false });
    expect(comp.scrollOffset).toBe(1);

    fm.handleKeyEvent({ key: "down", ctrl: false, shift: false, meta: false });
    expect(comp.scrollOffset).toBe(2);

    fm.handleKeyEvent({ key: "up", ctrl: false, shift: false, meta: false });
    expect(comp.scrollOffset).toBe(1);

    renderer.destroy();
    fm.destroy();
  });

  it("should not scroll on arrow keys when not scrollable", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });

    const comp = createComponent({
      id: "noscroll",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      margin: 0,
      render: () => "L0\nL1\nL2\nL3",
    });

    const keypressSpy = vi.fn();
    comp.on("keypress", keypressSpy);

    const fm = new FocusManager();
    fm.register(comp);

    fm.handleKeyEvent({ key: "down", ctrl: false, shift: false, meta: false });
    // Not scrollable => keypress event should be dispatched instead
    expect(keypressSpy).toHaveBeenCalled();
    expect(comp.scrollOffset).toBe(0);

    fm.destroy();
  });
});
