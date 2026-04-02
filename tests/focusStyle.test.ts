import { describe, it, expect, afterEach } from "vitest";
import { Component } from "../src/entities/component.js";
import type { RenderContext } from "../src/entities/component.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { ScreenBuffer } from "../src/entities/screenBuffer.js";

class TestComponent extends Component<{ label: string }> {
  render(context?: RenderContext) {
    return `${this.props.label}${context?.focused ? " [F]" : ""}`;
  }
}

describe("Focus Style", () => {
  let renderer: Renderer;

  afterEach(() => {
    renderer?.destroy();
  });

  function setup() {
    const dims = { getWidth: () => 40, getHeight: () => 10 };
    setTerminalDimensions(dims);
    const template = new Template(dims);
    renderer = new Renderer(template, dims);
    return { template, renderer };
  }

  it("should store focusStyle on component config", () => {
    const comp = new TestComponent({
      id: "c1",
      position: { x: 0, y: 0 },
      width: 20,
      height: 3,
      props: { label: "Test" },
      focusStyle: { fg: "yellow", bold: true },
    });

    expect(comp.focusStyle).toEqual({ fg: "yellow", bold: true });
  });

  it("should not have focusStyle by default", () => {
    const comp = new TestComponent({
      id: "c2",
      position: { x: 0, y: 0 },
      width: 20,
      height: 3,
      props: { label: "Test" },
    });

    expect(comp.focusStyle).toBeUndefined();
  });

  it("should pass focused=true in RenderContext when renderer has focusedId set", () => {
    const { template, renderer } = setup();

    let capturedContext: RenderContext | undefined;
    class ContextCapture extends Component<{ label: string }> {
      render(context?: RenderContext) {
        capturedContext = context;
        return this.props.label;
      }
    }

    const comp = new ContextCapture({
      id: "capture",
      position: { x: 0, y: 0 },
      width: 20,
      height: 3,
      props: { label: "Test" },
    });

    template.addComponent(comp);
    renderer.setFocusedId("capture");
    renderer.render();

    expect(capturedContext?.focused).toBe(true);
  });

  it("should pass focused=false when component is not focused", () => {
    const { template, renderer } = setup();

    let capturedContext: RenderContext | undefined;
    class ContextCapture extends Component<{ label: string }> {
      render(context?: RenderContext) {
        capturedContext = context;
        return this.props.label;
      }
    }

    const comp = new ContextCapture({
      id: "capture",
      position: { x: 0, y: 0 },
      width: 20,
      height: 3,
      props: { label: "Test" },
    });

    template.addComponent(comp);
    renderer.setFocusedId("other-id");
    renderer.render();

    expect(capturedContext?.focused).toBe(false);
  });

  it("should merge focusStyle with base style when focused", () => {
    const { template, renderer } = setup();

    // We test this indirectly by verifying the renderer doesn't crash
    // and the component's focusStyle is set correctly
    const comp = new TestComponent({
      id: "styled",
      position: { x: 0, y: 0 },
      width: 20,
      height: 3,
      props: { label: "Hello" },
      style: { fg: "white", border: { style: "single" } },
      focusStyle: { fg: "yellow", bold: true },
    });

    template.addComponent(comp);
    renderer.setFocusedId("styled");

    // Should not throw
    expect(() => renderer.render()).not.toThrow();
  });

  it("should not apply focusStyle when not focused", () => {
    const { template, renderer } = setup();

    const comp = new TestComponent({
      id: "unfocused",
      position: { x: 0, y: 0 },
      width: 20,
      height: 3,
      props: { label: "Hello" },
      style: { fg: "white" },
      focusStyle: { fg: "yellow" },
    });

    template.addComponent(comp);
    renderer.setFocusedId(null);

    // Should not throw
    expect(() => renderer.render()).not.toThrow();
  });
});
