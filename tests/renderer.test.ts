import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Renderer } from "../src/entities/renderer.js";
import { Template } from "../src/entities/template.js";
import { Component } from "../src/entities/component.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

class MockComponent extends Component {
  render(): string {
    return "Mock Component";
  }
}

describe("Renderer", () => {
  let renderer: Renderer;
  let template: Template;

  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 100, getHeight: () => 50 });
    template = new Template();
    renderer = new Renderer(template);
  });

  afterEach(() => {
    renderer.destroy();
  });

  it("should initialize terminal dimensions correctly", () => {
    expect(renderer["terminalWidth"]).toBe(100);
    expect(renderer["terminalHeight"]).toBe(50);
  });

  it("should call render method on resize event", () => {
    const renderSpy = vi.spyOn(renderer, "render");
    process.stdout.emit("resize");
    expect(renderSpy).toHaveBeenCalled();
  });

  it("should render components by writing to buffer", () => {
    const mockComponent = new MockComponent(
      "id", "name",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 20, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );
    const drawSpy = vi.spyOn(renderer as any, "drawComponentToBuffer");

    template.addComponent(mockComponent);
    renderer.render();

    expect(drawSpy).toHaveBeenCalledWith(mockComponent);
  });

  it("should mark components clean after render", () => {
    const mockComponent = new MockComponent(
      "id", "name",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    template.addComponent(mockComponent);
    renderer.render();

    expect(mockComponent.needsRender()).toBe(false);
  });

  it("should listen for component prop changes and partially render", () => {
    const mockComponent = new MockComponent(
      "id", "name",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    const template = new Template();
    template.addComponent(mockComponent);
    const renderer = new Renderer(template);

    const partialRenderSpy = vi.spyOn(renderer, "partialRender");
    renderer.render();

    mockComponent.setProps({ newProp: "value" });
    expect(partialRenderSpy).toHaveBeenCalledWith(mockComponent);
    renderer.destroy();
  });

  it("should not crash when setProps is called before render (no absolutePosition)", () => {
    const mockComponent = new MockComponent(
      "id", "name",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    const template = new Template();
    template.addComponent(mockComponent);
    const renderer = new Renderer(template);

    expect(() => {
      mockComponent.setProps({ newProp: "value" });
    }).not.toThrow();
    renderer.destroy();
  });

  it("should write multi-line component content to buffer", () => {
    class MultiLineComponent extends Component {
      render(): string {
        return "Line 1\nLine 2\nLine 3";
      }
    }

    const mockComponent = new MultiLineComponent(
      "id", "name",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 3, unit: "px" },
      {}
    );

    const template = new Template();
    template.addComponent(mockComponent);
    const renderer = new Renderer(template);
    renderer.render();

    const backBuffer = renderer["backBuffer"];
    expect(backBuffer.getCell(1, 1)?.char).toBe("L");
    expect(backBuffer.getCell(1, 2)?.char).toBe("L");
    expect(backBuffer.getCell(1, 3)?.char).toBe("L");
    renderer.destroy();
  });

  it("should not trigger partialRender after destroy", () => {
    const mockComponent = new MockComponent(
      "id", "name",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    const template = new Template();
    template.addComponent(mockComponent);
    const renderer = new Renderer(template);
    renderer.render();

    const partialRenderSpy = vi.spyOn(renderer, "partialRender");
    renderer.destroy();

    mockComponent.setProps({ newProp: "value" });
    expect(partialRenderSpy).not.toHaveBeenCalled();
  });

  it("should not trigger render on resize after destroy", () => {
    const template = new Template();
    const renderer = new Renderer(template);

    const renderSpy = vi.spyOn(renderer, "render");
    renderer.destroy();

    process.stdout.emit("resize");
    expect(renderSpy).not.toHaveBeenCalled();
  });

  it("should attach listeners to components added after Renderer creation", () => {
    const template = new Template();
    const renderer = new Renderer(template);

    const mockComponent = new MockComponent(
      "late", "Late Component",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    template.addComponent(mockComponent);
    renderer.render();

    const partialRenderSpy = vi.spyOn(renderer, "partialRender");
    mockComponent.setProps({ newProp: "value" });

    expect(partialRenderSpy).toHaveBeenCalledWith(mockComponent);
    renderer.destroy();
  });

  it("should render a multi-line component correctly via buffer", () => {
    class MultiLineComponent extends Component {
      render(): string {
        return "Line A\nLine B";
      }
    }

    const comp = new MultiLineComponent(
      "ml", "MultiLine",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 2, unit: "px" },
      {}
    );

    const template = new Template();
    template.addComponent(comp);
    const renderer = new Renderer(template);
    renderer.render();

    const buf = renderer["backBuffer"];
    // position is (1, 1) due to margin=1, "Line A" starts at x=1
    expect(buf.getCell(1, 1)?.char).toBe("L");
    expect(buf.getCell(6, 1)?.char).toBe("A");
    expect(buf.getCell(6, 2)?.char).toBe("B");
    renderer.destroy();
  });

  it("should handle tiny terminal without crashing", () => {
    setTerminalDimensions({ getWidth: () => 5, getHeight: () => 3 });

    const comp = new MockComponent(
      "tiny", "Tiny",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 50, unit: "%" },
      { value: 50, unit: "%" },
      {}
    );

    const template = new Template();
    template.addComponent(comp);
    const renderer = new Renderer(template);

    expect(() => renderer.render()).not.toThrow();
    expect(comp.absolutePosition?.width).toBe(3);
    expect(comp.absolutePosition?.height).toBe(2);
    renderer.destroy();
  });

  it("should handle full integration workflow: render -> setProps -> partialRender", () => {
    class CounterComponent extends Component<{ count: number }> {
      render(): string {
        return `Count: ${this.props.count}`;
      }
    }

    const comp = new CounterComponent(
      "counter", "Counter",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 20, unit: "px" },
      { value: 1, unit: "px" },
      { count: 0 }
    );

    const template = new Template();
    template.addComponent(comp);
    const renderer = new Renderer(template);

    renderer.render();
    expect(comp.needsRender()).toBe(false);

    comp.setProps({ count: 1 });
    expect(comp.props.count).toBe(1);
    expect(comp.needsRender()).toBe(false);
    renderer.destroy();
  });

  it("should handle multiple components with mixed positioning", () => {
    const abs = new MockComponent(
      "abs", "Absolute",
      { x: { position: 5 }, y: { position: 5 } },
      { value: 20, unit: "px" },
      { value: 10, unit: "px" },
      {}
    );

    const rel = new MockComponent(
      "rel", "Relative",
      { x: { position: "right", relativeTo: "abs" }, y: { position: "bottom", relativeTo: "abs" } },
      { value: 15, unit: "px" },
      { value: 8, unit: "px" },
      {}
    );

    const template = new Template();
    template.addComponent(abs);
    template.addComponent(rel);
    const renderer = new Renderer(template);

    renderer.render();

    expect(abs.absolutePosition).toEqual({ x: 6, y: 6, width: 20, height: 10 });
    expect(rel.absolutePosition?.x).toBe(26);
    expect(rel.absolutePosition?.y).toBe(16);
    renderer.destroy();
  });

  it("should not render removed component", () => {
    const comp = new MockComponent(
      "removable", "Removable",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    const template = new Template();
    template.addComponent(comp);
    const renderer = new Renderer(template);
    renderer.render();

    template.removeComponent("removable");
    const drawSpy = vi.spyOn(renderer as any, "drawComponentToBuffer");
    renderer.render();

    expect(drawSpy).not.toHaveBeenCalled();
    renderer.destroy();
  });

  it("should only write changed cells to stdout via flush", () => {
    const writeSpy = vi.spyOn(process.stdout, "write");

    const comp = new MockComponent(
      "test", "Test",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 20, unit: "px" },
      { value: 1, unit: "px" },
      {}
    );

    const template = new Template();
    template.addComponent(comp);
    const renderer = new Renderer(template);

    renderer.render();
    writeSpy.mockClear();

    // Second render with same content should not write anything
    renderer.render();
    expect(writeSpy).not.toHaveBeenCalled();

    renderer.destroy();
    writeSpy.mockRestore();
  });
});
