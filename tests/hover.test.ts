import { describe, it, expect, vi, afterEach } from "vitest";
import { App } from "../src/entities/app.js";
import { Component } from "../src/entities/component.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";
import type { MouseEvent } from "../src/entities/inputManager.js";

class TestComponent extends Component<{ label: string }> {
  render() { return this.props.label; }
}

function createApp() {
  setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
  return new App({
    terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    mouse: true,
  });
}

function makeComponent(id: string, x: number, y: number, w: number, h: number, zIndex = 0): TestComponent {
  const comp = new TestComponent({
    id,
    position: { x, y },
    width: w,
    height: h,
    zIndex,
    props: { label: id },
  });
  comp.setAbsolutePosition({ x, y, width: w, height: h });
  return comp;
}

describe("Hit testing", () => {
  let app: App;

  afterEach(() => {
    app?.stop();
  });

  it("should find component under coordinates", () => {
    app = createApp();
    const comp = makeComponent("box", 5, 5, 10, 5);
    app.add(comp);

    expect(app.hitTest(7, 7)).toBe(comp);
  });

  it("should return null when no component at coordinates", () => {
    app = createApp();
    const comp = makeComponent("box", 5, 5, 10, 5);
    app.add(comp);

    expect(app.hitTest(0, 0)).toBeNull();
    expect(app.hitTest(20, 20)).toBeNull();
  });

  it("should prioritize higher z-index components", () => {
    app = createApp();
    const bottom = makeComponent("bottom", 0, 0, 20, 10, 0);
    const top = makeComponent("top", 5, 5, 10, 5, 10);
    app.add(bottom).add(top);

    // In overlapping area, top should win
    expect(app.hitTest(7, 7)).toBe(top);
    // Outside top but inside bottom
    expect(app.hitTest(1, 1)).toBe(bottom);
  });

  it("should test component boundaries correctly", () => {
    app = createApp();
    const comp = makeComponent("box", 10, 10, 5, 3);
    app.add(comp);

    // Top-left corner (inclusive)
    expect(app.hitTest(10, 10)).toBe(comp);
    // Bottom-right corner (exclusive)
    expect(app.hitTest(14, 12)).toBe(comp);
    // Just outside
    expect(app.hitTest(15, 10)).toBeNull();
    expect(app.hitTest(10, 13)).toBeNull();
  });
});

describe("Mouse events dispatch", () => {
  let app: App;

  afterEach(() => {
    app?.stop();
  });

  it("should emit click and mousedown on component", () => {
    app = createApp();
    const comp = makeComponent("btn", 0, 0, 10, 3);
    app.add(comp);

    const clickSpy = vi.fn();
    const mousedownSpy = vi.fn();
    comp.on("click", clickSpy);
    comp.on("mousedown", mousedownSpy);

    const inputManager = app["inputManager"];
    inputManager.emit("mouse", {
      x: 5, y: 1, button: "left", type: "click",
    } satisfies MouseEvent);

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(mousedownSpy).toHaveBeenCalledOnce();
  });

  it("should emit mouseup on release", () => {
    app = createApp();
    const comp = makeComponent("btn", 0, 0, 10, 3);
    app.add(comp);

    const mouseupSpy = vi.fn();
    comp.on("mouseup", mouseupSpy);

    const inputManager = app["inputManager"];
    inputManager.emit("mouse", {
      x: 5, y: 1, button: "left", type: "release",
    } satisfies MouseEvent);

    expect(mouseupSpy).toHaveBeenCalledOnce();
  });

  it("should emit scroll and auto-scroll scrollable components", () => {
    app = createApp();
    const comp = makeComponent("list", 0, 0, 10, 3);
    comp.scrollable = true;
    app.add(comp);

    const scrollSpy = vi.fn();
    comp.on("scroll", scrollSpy);

    const inputManager = app["inputManager"];
    inputManager.emit("mouse", {
      x: 5, y: 1, button: "none", type: "scroll-down",
    } satisfies MouseEvent);

    // scroll is emitted twice: once by App (with direction) and once by Component.scrollBy
    expect(scrollSpy).toHaveBeenCalledTimes(2);
    expect(scrollSpy.mock.calls[0]![0].direction).toBe(1);
  });

  it("should not crash when clicking on empty space", () => {
    app = createApp();
    const inputManager = app["inputManager"];

    expect(() => {
      inputManager.emit("mouse", {
        x: 50, y: 50, button: "left", type: "click",
      } satisfies MouseEvent);
    }).not.toThrow();
  });
});

describe("Hover detection", () => {
  let app: App;

  afterEach(() => {
    app?.stop();
  });

  it("should emit mouseenter when hovering a component", () => {
    app = createApp();
    const comp = makeComponent("box", 0, 0, 10, 5);
    app.add(comp);

    const enterSpy = vi.fn();
    comp.on("mouseenter", enterSpy);

    const inputManager = app["inputManager"];
    inputManager.emit("mouse", {
      x: 5, y: 2, button: "none", type: "move",
    } satisfies MouseEvent);

    expect(enterSpy).toHaveBeenCalledOnce();
    expect(comp.hovered).toBe(true);
  });

  it("should emit mouseleave when leaving a component", () => {
    app = createApp();
    const comp = makeComponent("box", 0, 0, 10, 5);
    app.add(comp);

    const leaveSpy = vi.fn();
    comp.on("mouseleave", leaveSpy);

    const inputManager = app["inputManager"];

    // Enter
    inputManager.emit("mouse", {
      x: 5, y: 2, button: "none", type: "move",
    } satisfies MouseEvent);

    // Leave (move to empty space)
    inputManager.emit("mouse", {
      x: 50, y: 50, button: "none", type: "move",
    } satisfies MouseEvent);

    expect(leaveSpy).toHaveBeenCalledOnce();
    expect(comp.hovered).toBe(false);
  });

  it("should emit mouseleave/mouseenter when changing component", () => {
    app = createApp();
    const compA = makeComponent("a", 0, 0, 10, 5);
    const compB = makeComponent("b", 20, 0, 10, 5);
    app.add(compA).add(compB);

    const leaveA = vi.fn();
    const enterB = vi.fn();
    compA.on("mouseleave", leaveA);
    compB.on("mouseenter", enterB);

    const inputManager = app["inputManager"];

    // Hover A
    inputManager.emit("mouse", {
      x: 5, y: 2, button: "none", type: "move",
    } satisfies MouseEvent);

    // Move to B
    inputManager.emit("mouse", {
      x: 25, y: 2, button: "none", type: "move",
    } satisfies MouseEvent);

    expect(leaveA).toHaveBeenCalledOnce();
    expect(enterB).toHaveBeenCalledOnce();
    expect(compA.hovered).toBe(false);
    expect(compB.hovered).toBe(true);
  });

  it("should not re-emit events when staying on same component", () => {
    app = createApp();
    const comp = makeComponent("box", 0, 0, 10, 5);
    app.add(comp);

    const enterSpy = vi.fn();
    comp.on("mouseenter", enterSpy);

    const inputManager = app["inputManager"];

    inputManager.emit("mouse", {
      x: 1, y: 1, button: "none", type: "move",
    } satisfies MouseEvent);

    inputManager.emit("mouse", {
      x: 2, y: 2, button: "none", type: "move",
    } satisfies MouseEvent);

    expect(enterSpy).toHaveBeenCalledOnce();
  });

  it("should track hovered component via app.hoveredComponent", () => {
    app = createApp();
    const comp = makeComponent("box", 0, 0, 10, 5);
    app.add(comp);

    expect(app.hoveredComponent).toBeNull();

    const inputManager = app["inputManager"];
    inputManager.emit("mouse", {
      x: 5, y: 2, button: "none", type: "move",
    } satisfies MouseEvent);

    expect(app.hoveredComponent).toBe(comp);

    inputManager.emit("mouse", {
      x: 50, y: 50, button: "none", type: "move",
    } satisfies MouseEvent);

    expect(app.hoveredComponent).toBeNull();
  });

  it("should set hovered in RenderContext", () => {
    app = createApp();
    const comp = makeComponent("box", 0, 0, 10, 5);
    app.add(comp);

    expect(comp.hovered).toBe(false);

    const inputManager = app["inputManager"];
    inputManager.emit("mouse", {
      x: 5, y: 2, button: "none", type: "move",
    } satisfies MouseEvent);

    expect(comp.hovered).toBe(true);
  });
});
