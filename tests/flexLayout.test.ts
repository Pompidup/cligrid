import { describe, it, expect, beforeEach } from "vitest";
import { Component, RenderOutput, RenderLine } from "../src/entities/component.js";
import { Template } from "../src/entities/template.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

class MockComponent extends Component<{ text?: string }> {
  render(): RenderOutput {
    return this.props.text ?? "Mock";
  }
}

class MultiLineComponent extends Component<{ lines?: string[] }> {
  render(): RenderOutput {
    const lines = this.props.lines ?? ["Line 1", "Line 2"];
    return lines.map((text) => ({ text }));
  }
}

describe("Flex layout - row direction", () => {
  let template: Template;

  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 100, getHeight: () => 50 });
    template = new Template();
  });

  it("should position children horizontally in row layout", () => {
    const child1 = new MockComponent({
      id: "c1",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 0,
    });

    const child2 = new MockComponent({
      id: "c2",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 0,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 10,
      margin: 0,
      layout: "row",
      children: [child1, child2],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    expect(child1.absolutePosition!.x).toBe(0);
    expect(child2.absolutePosition!.x).toBe(10);
    expect(child1.absolutePosition!.y).toBe(0);
    expect(child2.absolutePosition!.y).toBe(0);
  });

  it("should account for margin in row layout", () => {
    const child1 = new MockComponent({
      id: "c1",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 1,
    });

    const child2 = new MockComponent({
      id: "c2",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 1,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 10,
      margin: 0,
      layout: "row",
      children: [child1, child2],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    // child1: x = 0 + 0 + margin(1) = 1, takes 10 + 2*margin = 12
    expect(child1.absolutePosition!.x).toBe(1);
    // child2: x = 0 + 12 + margin(1) = 13
    expect(child2.absolutePosition!.x).toBe(13);
  });

  it("should distribute space with flex in row layout", () => {
    const child1 = new MockComponent({
      id: "c1",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 0,
      flex: 1,
    });

    const child2 = new MockComponent({
      id: "c2",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 0,
      flex: 2,
    });

    const child3 = new MockComponent({
      id: "c3",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 0,
      flex: 1,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 10,
      margin: 0,
      layout: "row",
      children: [child1, child2, child3],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    // Total flex = 4, total space = 40
    // c1: 40 * 1/4 = 10, c2: 40 * 2/4 = 20, c3: 40 * 1/4 = 10
    expect(child1.absolutePosition!.width).toBe(10);
    expect(child2.absolutePosition!.width).toBe(20);
    expect(child3.absolutePosition!.width).toBe(10);

    expect(child1.absolutePosition!.x).toBe(0);
    expect(child2.absolutePosition!.x).toBe(10);
    expect(child3.absolutePosition!.x).toBe(30);
  });

  it("should mix fixed and flex children in row layout", () => {
    const fixed = new MockComponent({
      id: "fixed",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      margin: 0,
    });

    const flexChild = new MockComponent({
      id: "flex",
      position: { x: 0, y: 0 },
      width: 0,
      height: 5,
      margin: 0,
      flex: 1,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 10,
      margin: 0,
      layout: "row",
      children: [fixed, flexChild],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    // Fixed takes 10, flex takes remaining 30
    expect(fixed.absolutePosition!.width).toBe(10);
    expect(flexChild.absolutePosition!.width).toBe(30);
    expect(flexChild.absolutePosition!.x).toBe(10);
  });
});

describe("Flex layout - column direction", () => {
  let template: Template;

  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 100, getHeight: () => 50 });
    template = new Template();
  });

  it("should position children vertically in column layout", () => {
    const child1 = new MockComponent({
      id: "c1",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      margin: 0,
    });

    const child2 = new MockComponent({
      id: "c2",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      margin: 0,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      margin: 0,
      layout: "column",
      children: [child1, child2],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    expect(child1.absolutePosition!.y).toBe(0);
    expect(child2.absolutePosition!.y).toBe(5);
    expect(child1.absolutePosition!.x).toBe(0);
    expect(child2.absolutePosition!.x).toBe(0);
  });

  it("should distribute space with flex in column layout", () => {
    const child1 = new MockComponent({
      id: "c1",
      position: { x: 0, y: 0 },
      width: 20,
      height: 0,
      margin: 0,
      flex: 1,
    });

    const child2 = new MockComponent({
      id: "c2",
      position: { x: 0, y: 0 },
      width: 20,
      height: 0,
      margin: 0,
      flex: 3,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      margin: 0,
      layout: "column",
      children: [child1, child2],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    // Total flex = 4, total space = 20
    // c1: 20 * 1/4 = 5, c2: 20 * 3/4 = 15
    expect(child1.absolutePosition!.height).toBe(5);
    expect(child2.absolutePosition!.height).toBe(15);

    expect(child1.absolutePosition!.y).toBe(0);
    expect(child2.absolutePosition!.y).toBe(5);
  });

  it("should account for margin in column layout", () => {
    const child1 = new MockComponent({
      id: "c1",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      margin: 2,
    });

    const child2 = new MockComponent({
      id: "c2",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      margin: 2,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 30,
      margin: 0,
      layout: "column",
      children: [child1, child2],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    // child1: y = 0 + margin(2) = 2, takes 5 + 2*2 = 9
    expect(child1.absolutePosition!.y).toBe(2);
    // child2: y = 0 + 9 + margin(2) = 11
    expect(child2.absolutePosition!.y).toBe(11);
  });
});

describe("Auto-height", () => {
  let template: Template;

  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 100, getHeight: () => 50 });
    template = new Template();
  });

  it("should compute height from render output (string)", () => {
    class ThreeLineComponent extends Component {
      render(): string {
        return "Line 1\nLine 2\nLine 3";
      }
    }

    const comp = new ThreeLineComponent({
      id: "auto",
      position: { x: 0, y: 0 },
      width: 20,
      height: "auto",
      margin: 0,
    });

    template.addComponent(comp);
    template.updateLayout(100, 50);

    expect(comp.absolutePosition!.height).toBe(3);
  });

  it("should compute height from render output (RenderLine[])", () => {
    const comp = new MultiLineComponent({
      id: "auto",
      position: { x: 0, y: 0 },
      width: 20,
      height: "auto",
      margin: 0,
      props: { lines: ["a", "b", "c", "d"] },
    });

    template.addComponent(comp);
    template.updateLayout(100, 50);

    expect(comp.absolutePosition!.height).toBe(4);
  });

  it("should include border insets in auto-height", () => {
    const comp = new MultiLineComponent({
      id: "auto",
      position: { x: 0, y: 0 },
      width: 20,
      height: "auto",
      margin: 0,
      style: { border: { style: "single" } },
      props: { lines: ["a", "b"] },
    });

    template.addComponent(comp);
    template.updateLayout(100, 50);

    // 2 lines + border top (1) + border bottom (1) = 4
    expect(comp.absolutePosition!.height).toBe(4);
  });

  it("should work as a child with auto-height", () => {
    const child = new MultiLineComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 20,
      height: "auto",
      margin: 0,
      props: { lines: ["one", "two", "three"] },
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

    expect(child.absolutePosition!.height).toBe(3);
  });

  it("should recalculate auto-height when props change and layout updates", () => {
    const comp = new MultiLineComponent({
      id: "auto",
      position: { x: 0, y: 0 },
      width: 20,
      height: "auto",
      margin: 0,
      props: { lines: ["a", "b"] },
    });

    template.addComponent(comp);
    template.updateLayout(100, 50);
    expect(comp.absolutePosition!.height).toBe(2);

    comp.setProps({ lines: ["a", "b", "c", "d", "e"] });
    template.updateLayout(100, 50);
    expect(comp.absolutePosition!.height).toBe(5);
  });
});

describe("Flex layout with auto-height in column", () => {
  let template: Template;

  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 100, getHeight: () => 50 });
    template = new Template();
  });

  it("should use auto-height child as fixed in flex column", () => {
    const autoChild = new MultiLineComponent({
      id: "header",
      position: { x: 0, y: 0 },
      width: 40,
      height: "auto",
      margin: 0,
      props: { lines: ["Title", "Subtitle"] },
    });

    const flexChild = new MockComponent({
      id: "body",
      position: { x: 0, y: 0 },
      width: 40,
      height: 0,
      margin: 0,
      flex: 1,
    });

    const parent = new MockComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      margin: 0,
      layout: "column",
      children: [autoChild, flexChild],
    });

    template.addComponent(parent);
    template.updateLayout(100, 50);

    // autoChild height = 2, flexChild takes remaining 20 - 2 = 18
    expect(autoChild.absolutePosition!.height).toBe(2);
    expect(flexChild.absolutePosition!.height).toBe(18);
    expect(flexChild.absolutePosition!.y).toBe(2);
  });
});
