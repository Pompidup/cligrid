import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createComponent } from "../src/entities/createComponent.js";
import { Component } from "../src/entities/component.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";
import type { RenderContext } from "../src/entities/component.js";

describe("createComponent", () => {
  it("should create a functional component that renders", () => {
    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      render: () => "Hello",
    });

    expect(comp.id).toBe("test");
    expect(comp.render()).toBe("Hello");
  });

  it("should pass props to render function", () => {
    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { name: "World" },
      render: (props) => `Hello ${props.name}`,
    });

    expect(comp.render()).toBe("Hello World");
  });

  it("should support setProps and re-render with new values", () => {
    const comp = createComponent({
      id: "counter",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { count: 0 },
      render: (props) => `Count: ${props.count}`,
    });

    expect(comp.render()).toBe("Count: 0");

    comp.setProps({ count: 42 });
    expect(comp.render()).toBe("Count: 42");
  });

  it("should emit propsChanged on setProps", () => {
    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { value: "a" },
      render: (props) => props.value,
    });

    const spy = vi.fn();
    comp.on("propsChanged", spy);

    comp.setProps({ value: "b" });
    expect(spy).toHaveBeenCalledOnce();
  });

  it("should support style, margin, layout, flex options", () => {
    const comp = createComponent({
      id: "styled",
      position: { x: 0, y: 0 },
      width: "50%",
      height: "auto",
      margin: 2,
      layout: "row",
      flex: 1,
      style: { border: { style: "rounded" }, fg: "cyan" },
      render: () => "Styled",
    });

    expect(comp.margin).toBe(2);
    expect(comp.layout).toBe("row");
    expect(comp.flex).toBe(1);
    expect(comp.style?.fg).toBe("cyan");
    expect(comp.width).toEqual({ value: 50, unit: "%" });
    expect(comp.height).toEqual({ value: 0, unit: "auto" });
  });

  it("should support children", () => {
    const child = createComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      render: () => "Child",
    });

    const parent = createComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      children: [child],
      render: () => "Parent",
    });

    expect(parent.children).toHaveLength(1);
    expect(child.parent).toBe(parent);
  });

  it("should support RenderLine[] output", () => {
    const comp = createComponent({
      id: "multi",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      render: () => [
        { text: "Title", style: { bold: true } },
        { text: "Body" },
      ],
    });

    const output = comp.render();
    expect(Array.isArray(output)).toBe(true);
    expect((output as any)[0].text).toBe("Title");
  });

  it("should register onMount and onDestroy lifecycle hooks", () => {
    const mountSpy = vi.fn();
    const destroySpy = vi.fn();

    const comp = createComponent({
      id: "lifecycle",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      render: () => "test",
      onMount: mountSpy,
      onDestroy: destroySpy,
    });

    comp.emit("mount");
    expect(mountSpy).toHaveBeenCalledOnce();

    comp.emit("destroy");
    expect(destroySpy).toHaveBeenCalledOnce();
  });
});

describe("RenderContext", () => {
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

  it("should pass RenderContext to component render()", () => {
    let capturedCtx: RenderContext | undefined;

    const comp = createComponent({
      id: "ctx-test",
      position: { x: 0, y: 0 },
      width: 40,
      height: 10,
      margin: 0,
      render: (_props, ctx) => {
        capturedCtx = ctx;
        return "test";
      },
    });

    template.addComponent(comp);
    renderer.render();

    expect(capturedCtx).toBeDefined();
    expect(capturedCtx!.width).toBe(40);
    expect(capturedCtx!.height).toBe(10);
    expect(capturedCtx!.terminalWidth).toBe(80);
    expect(capturedCtx!.terminalHeight).toBe(24);
  });

  it("should account for border+padding in context dimensions", () => {
    let capturedCtx: RenderContext | undefined;

    const comp = createComponent({
      id: "insets-test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 10,
      margin: 0,
      style: {
        border: { style: "single" },
        padding: { top: 1, right: 2, bottom: 1, left: 2 },
      },
      render: (_props, ctx) => {
        capturedCtx = ctx;
        return "test";
      },
    });

    template.addComponent(comp);
    renderer.render();

    // width=20, border=1+1=2, padding.left+right=4 => contentWidth = 20-6 = 14
    // height=10, border=1+1=2, padding.top+bottom=2 => contentHeight = 10-4 = 6
    expect(capturedCtx!.width).toBe(14);
    expect(capturedCtx!.height).toBe(6);
  });

  it("should still work with class-based components (context optional)", () => {
    class ClassComp extends Component {
      render(): string {
        return "ClassBased";
      }
    }

    const comp = new ClassComp({
      id: "class-test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      margin: 0,
    });

    template.addComponent(comp);
    expect(() => renderer.render()).not.toThrow();
  });
});
