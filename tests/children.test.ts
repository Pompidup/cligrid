import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Component, RenderOutput } from "../src/entities/component.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

class MockComponent extends Component<{ text?: string }> {
  render(): string {
    return this.props.text ?? "Mock";
  }
}

describe("Component children", () => {
  it("should add a child component", () => {
    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
    });

    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
    });

    parent.addChild(child);

    expect(parent.children).toHaveLength(1);
    expect(parent.children[0]!.id).toBe("child");
    expect(child.parent).toBe(parent);
  });

  it("should remove a child component", () => {
    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
    });

    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
    });

    parent.addChild(child);
    parent.removeChild("child");

    expect(parent.children).toHaveLength(0);
    expect(child.parent).toBeUndefined();
  });

  it("should throw when adding a child that already has a parent", () => {
    const parent1 = new MockComponent({
      id: "parent1",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
    });

    const parent2 = new MockComponent({
      id: "parent2",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
    });

    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
    });

    parent1.addChild(child);
    expect(() => parent2.addChild(child)).toThrow(/already has a parent/);
  });

  it("should throw when adding a duplicate child id", () => {
    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
    });

    const child1 = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
    });

    const child2 = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
    });

    parent.addChild(child1);
    expect(() => parent.addChild(child2)).toThrow(/already has a child/);
  });

  it("should throw when removing a non-existent child", () => {
    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
    });

    expect(() => parent.removeChild("nope")).toThrow(/has no child/);
  });

  it("should emit childAdded and childRemoved events", () => {
    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
    });

    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
    });

    const addedSpy = vi.fn();
    const removedSpy = vi.fn();
    parent.on("childAdded", addedSpy);
    parent.on("childRemoved", removedSpy);

    parent.addChild(child);
    expect(addedSpy).toHaveBeenCalledWith(child);

    parent.removeChild("child");
    expect(removedSpy).toHaveBeenCalledWith(child);
  });

  it("should support children via config constructor", () => {
    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      children: [child],
    });

    expect(parent.children).toHaveLength(1);
    expect(child.parent).toBe(parent);
  });
});

describe("Template children layout", () => {
  let template: Template;

  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 100, getHeight: () => 50 });
    template = new Template();
  });

  it("should calculate child positions relative to parent content area", () => {
    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 0,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 5, y: 5 },
      width: 40,
      height: 20,
      margin: 0,
      children: [child],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    // Parent at (5, 5), no border/padding/margin -> child at (5, 5)
    expect(child.absolutePosition).toEqual({
      x: 5,
      y: 5,
      width: 10,
      height: 5,
    });
  });

  it("should offset children by parent border and padding insets", () => {
    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 0,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      margin: 0,
      style: {
        border: { style: "single" },
        padding: { top: 1, right: 1, bottom: 1, left: 1 },
      },
      children: [child],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    // Parent at (0, 0), border=1 + padding=1 = inset 2
    expect(child.absolutePosition).toEqual({
      x: 2,
      y: 2,
      width: 10,
      height: 5,
    });
  });

  it("should clip children to parent content area", () => {
    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 50, // wider than parent
      height: 30, // taller than parent
      margin: 0,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 20,
      height: 10,
      margin: 0,
      children: [child],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    expect(child.absolutePosition!.width).toBe(20);
    expect(child.absolutePosition!.height).toBe(10);
  });

  it("should handle percentage-based child dimensions relative to parent content area", () => {
    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: "50%",
      height: "50%",
      margin: 0,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      margin: 0,
      children: [child],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    expect(child.absolutePosition!.width).toBe(20);
    expect(child.absolutePosition!.height).toBe(10);
  });

  it("should calculate positions for 3 levels of nesting", () => {
    const grandchild = new MockComponent({
      id: "grandchild",
      position: { x: 1, y: 1 },
      width: 5,
      height: 3,
      margin: 0,
    });

    const child = new MockComponent({
      id: "child",
      position: { x: 2, y: 2 },
      width: 20,
      height: 10,
      margin: 0,
      children: [grandchild],
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 5, y: 5 },
      width: 40,
      height: 20,
      margin: 0,
      children: [child],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    // Parent at (5,5), child at (5+2, 5+2) = (7,7), grandchild at (7+1, 7+1) = (8,8)
    expect(child.absolutePosition).toEqual({ x: 7, y: 7, width: 20, height: 10 });
    expect(grandchild.absolutePosition).toEqual({ x: 8, y: 8, width: 5, height: 3 });
  });
});

describe("Renderer children rendering", () => {
  let template: Template;
  let renderer: Renderer;

  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 100, getHeight: () => 50 });
    template = new Template();
    renderer = new Renderer(template);
  });

  afterEach(() => {
    renderer.destroy();
  });

  it("should render child components to the buffer", () => {
    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 2 },
      width: 10,
      height: 1,
      margin: 0,
      props: { text: "Child" },
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      margin: 0,
      props: { text: "Parent" },
      children: [child],
    });

    template.addComponent(parent);
    renderer.render();

    const buf = renderer["backBuffer"];
    // Parent text at row 0
    expect(buf.getCell(0, 0)?.char).toBe("P");
    // Child text at row 2 (offset y=2 inside parent)
    expect(buf.getCell(0, 2)?.char).toBe("C");
  });

  it("should trigger partialRender when child props change", () => {
    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      props: { text: "Before" },
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      margin: 0,
      children: [child],
    });

    template.addComponent(parent);
    renderer.render();

    const partialSpy = vi.spyOn(renderer, "partialRender");
    child.setProps({ text: "After" });

    expect(partialSpy).toHaveBeenCalledWith(child);
  });

  it("should render children inside parent with border", () => {
    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      props: { text: "Hello" },
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      margin: 0,
      style: { border: { style: "single" } },
      children: [child],
    });

    template.addComponent(parent);
    renderer.render();

    const buf = renderer["backBuffer"];
    // Border at (0,0) = "┌"
    expect(buf.getCell(0, 0)?.char).toBe("┌");
    // Child content inside border at (1, 1)
    expect(buf.getCell(1, 1)?.char).toBe("H");
    expect(buf.getCell(2, 1)?.char).toBe("e");
  });

  it("should mark all children clean after render", () => {
    const child = new MockComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      margin: 0,
      children: [child],
    });

    template.addComponent(parent);
    renderer.render();

    expect(parent.needsRender()).toBe(false);
    expect(child.needsRender()).toBe(false);
  });
});
