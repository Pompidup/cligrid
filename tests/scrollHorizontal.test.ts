import { describe, it, expect, afterEach } from "vitest";
import { Component } from "../src/entities/component.js";
import type { RenderContext } from "../src/entities/component.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { FocusManager } from "../src/entities/focusManager.js";

class WideComponent extends Component<{ text: string }> {
  render(_context?: RenderContext) {
    return this.props.text;
  }
}

describe("Horizontal Scroll", () => {
  let renderer: Renderer;

  afterEach(() => {
    renderer?.destroy();
  });

  it("should have scrollXOffset default to 0", () => {
    const comp = new WideComponent({
      id: "c1",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      scrollable: true,
      props: { text: "Hello World This Is A Long Text" },
    });

    expect(comp.scrollXOffset).toBe(0);
  });

  it("should scrollToX and clamp to valid range", () => {
    const comp = new WideComponent({
      id: "c2",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      scrollable: true,
      props: { text: "Hello" },
    });
    comp.setAbsolutePosition({ x: 0, y: 0, width: 10, height: 3 });
    comp.setTotalColumns(30);

    comp.scrollToX(5);
    expect(comp.scrollXOffset).toBe(5);

    // Clamp to max
    comp.scrollToX(100);
    expect(comp.scrollXOffset).toBe(20); // 30 - 10 = 20

    // Clamp to 0
    comp.scrollToX(-5);
    expect(comp.scrollXOffset).toBe(0);
  });

  it("should scrollByX relative to current offset", () => {
    const comp = new WideComponent({
      id: "c3",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      scrollable: true,
      props: { text: "Hello" },
    });
    comp.setAbsolutePosition({ x: 0, y: 0, width: 10, height: 3 });
    comp.setTotalColumns(30);

    comp.scrollByX(3);
    expect(comp.scrollXOffset).toBe(3);

    comp.scrollByX(2);
    expect(comp.scrollXOffset).toBe(5);

    comp.scrollByX(-1);
    expect(comp.scrollXOffset).toBe(4);
  });

  it("should track totalColumns", () => {
    const comp = new WideComponent({
      id: "c4",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      props: { text: "Hello" },
    });

    expect(comp.totalColumns).toBe(0);
    comp.setTotalColumns(25);
    expect(comp.totalColumns).toBe(25);
  });

  it("should emit scroll event on scrollToX", () => {
    const comp = new WideComponent({
      id: "c5",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      scrollable: true,
      props: { text: "Hello" },
    });
    comp.setAbsolutePosition({ x: 0, y: 0, width: 10, height: 3 });
    comp.setTotalColumns(30);

    const events: number[] = [];
    comp.on("scroll", (offset: number) => events.push(offset));

    comp.scrollToX(5);
    expect(events).toContain(5);
  });

  it("should mark dirty on scrollToX", () => {
    const comp = new WideComponent({
      id: "c6",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      scrollable: true,
      props: { text: "Hello" },
    });
    comp.setAbsolutePosition({ x: 0, y: 0, width: 10, height: 3 });
    comp.setTotalColumns(30);
    comp.markClean();

    comp.scrollToX(3);
    expect(comp.needsRender()).toBe(true);
  });

  it("should render without crashing with horizontal scroll", () => {
    const dims = { getWidth: () => 40, getHeight: () => 10 };
    setTerminalDimensions(dims);
    const template = new Template(dims);
    renderer = new Renderer(template, dims);

    const comp = new WideComponent({
      id: "wide",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      scrollable: true,
      props: { text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
    });

    template.addComponent(comp);
    expect(() => renderer.render()).not.toThrow();
  });

  describe("FocusManager horizontal scroll", () => {
    it("should scroll left/right on scrollable focused components", () => {
      const fm = new FocusManager();
      const comp = new WideComponent({
        id: "scroll-h",
        position: { x: 0, y: 0 },
        width: 10,
        height: 3,
        scrollable: true,
        props: { text: "Hello" },
      });
      comp.setAbsolutePosition({ x: 0, y: 0, width: 10, height: 3 });
      comp.setTotalColumns(100);

      fm.register(comp);

      const rightEvent = { key: "right", ctrl: false, shift: false, meta: false, raw: Buffer.from("") };
      fm.handleKeyEvent(rightEvent);
      expect(comp.scrollXOffset).toBe(5);

      fm.handleKeyEvent(rightEvent);
      expect(comp.scrollXOffset).toBe(10);

      const leftEvent = { key: "left", ctrl: false, shift: false, meta: false, raw: Buffer.from("") };
      fm.handleKeyEvent(leftEvent);
      expect(comp.scrollXOffset).toBe(5);

      fm.destroy();
    });
  });
});
