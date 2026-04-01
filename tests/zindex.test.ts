import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createComponent } from "../src/entities/createComponent.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { App } from "../src/entities/app.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

describe("Z-index rendering order", () => {
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

  it("should render higher zIndex components on top", () => {
    const bg = createComponent({
      id: "bg",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      zIndex: 0,
      render: () => "BACKGROUND",
    });

    const fg = createComponent({
      id: "fg",
      position: { x: 0, y: 0 },
      width: 5,
      height: 1,
      margin: 0,
      zIndex: 1,
      render: () => "FRONT",
    });

    template.addComponent(bg);
    template.addComponent(fg);
    renderer.render();

    const buf = renderer["backBuffer"];
    // fg (zIndex=1) should overwrite bg at same position
    expect(buf.getCell(0, 0)?.char).toBe("F");
    expect(buf.getCell(1, 0)?.char).toBe("R");
    // bg should still be visible past fg
    expect(buf.getCell(5, 0)?.char).toBe("R"); // "BACKGROUND"[5] = "R"
  });

  it("should render same zIndex in insertion order", () => {
    const first = createComponent({
      id: "first",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      render: () => "FIRST_COMP",
    });

    const second = createComponent({
      id: "second",
      position: { x: 0, y: 0 },
      width: 6,
      height: 1,
      margin: 0,
      render: () => "SECOND",
    });

    template.addComponent(first);
    template.addComponent(second);
    renderer.render();

    const buf = renderer["backBuffer"];
    // Both have zIndex=0, second added later should be on top
    expect(buf.getCell(0, 0)?.char).toBe("S");
  });

  it("should default zIndex to 0", () => {
    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      render: () => "test",
    });

    expect(comp.zIndex).toBe(0);
  });
});

describe("App overlay system", () => {
  it("should add overlay with high zIndex", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });

    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    const main = createComponent({
      id: "main",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      render: () => "Main",
    });

    const modal = createComponent({
      id: "modal",
      position: { x: 5, y: 5 },
      width: 20,
      height: 10,
      render: () => "Modal",
    });

    app.add(main);
    app.showOverlay(modal);

    expect(modal.zIndex).toBe(100);
    app.stop();
  });

  it("should remove overlay on hideOverlay", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });

    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    const modal = createComponent({
      id: "modal",
      position: { x: 5, y: 5 },
      width: 20,
      height: 10,
      render: () => "Modal",
    });

    app.showOverlay(modal);
    expect(() => app.hideOverlay(modal)).not.toThrow();
    app.stop();
  });

  it("should be chainable", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });

    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    const overlay = createComponent({
      id: "overlay",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      render: () => "test",
    });

    const result = app.showOverlay(overlay);
    expect(result).toBe(app);
    app.stop();
  });
});
