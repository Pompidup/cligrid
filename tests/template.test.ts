import { describe, it, expect, beforeEach } from "vitest";
import { Template } from "../src/entities/template.js";
import { Component } from "../src/entities/component.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

class MockComponent extends Component {
  render(): string {
    return "Mock Component";
  }
}

describe("Template", () => {
  let template: Template;
  beforeEach(() => {
    setTerminalDimensions({ getWidth: () => 100, getHeight: () => 50 });
    template = new Template();
  });

  it("should initialize with correct terminal dimensions", () => {
    expect(template["terminalWidth"]).toBe(100);
    expect(template["terminalHeight"]).toBe(50);
  });

  it("should add components correctly", () => {
    const mockComponent = new MockComponent(
      "comp1",
      "Component 1",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    template.addComponent(mockComponent);
    expect(template.components).toContain(mockComponent);
  });

  it("should calculate absolute position for components positioned absolutely", () => {
    const mockComponent = new MockComponent(
      "comp1",
      "Component 1",
      { x: { position: 10 }, y: { position: 20 } },
      { value: 50, unit: "%" },
      { value: 50, unit: "%" },
      {}
    );

    template.addComponent(mockComponent);
    template.updateLayout(100, 50);

    const { absolutePosition } = mockComponent;
    expect(absolutePosition?.width).toBe(50);
    expect(absolutePosition?.height).toBe(25);
    expect(absolutePosition?.x).toBe(11); // 10 + default margin
    expect(absolutePosition?.y).toBe(21); // 20 + default margin
  });

  it("should calculate positions relative to other components correctly", () => {
    const parentComponent = new MockComponent(
      "parent",
      "Parent Component",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 50, unit: "%" },
      { value: 50, unit: "%" },
      {}
    );

    const childComponent = new MockComponent(
      "child",
      "Child Component",
      { x: { position: "right", relativeTo: "parent" }, y: { position: 0 } },
      { value: 25, unit: "%" },
      { value: 25, unit: "%" },
      {}
    );

    template.addComponent(parentComponent);
    template.addComponent(childComponent);
    template.updateLayout(100, 50);

    const { absolutePosition } = childComponent;
    expect(absolutePosition?.x).toBe(51); // Right of parent means start from parent's width + default margin
    expect(absolutePosition?.y).toBe(1); // 1 + default margin
  });

  it("should calculate relative Y position (bottom) consistently with X (right)", () => {
    const parentComponent = new MockComponent(
      "parent",
      "Parent Component",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 50, unit: "%" },
      { value: 50, unit: "%" },
      {}
    );

    const childBottom = new MockComponent(
      "childBottom",
      "Child Bottom",
      { x: { position: 0 }, y: { position: "bottom", relativeTo: "parent" } },
      { value: 25, unit: "%" },
      { value: 25, unit: "%" },
      {}
    );

    template.addComponent(parentComponent);
    template.addComponent(childBottom);
    template.updateLayout(100, 50);

    // Parent: x=1, y=1, width=50, height=25 (margin=1)
    // Bottom child should be at y = parentY - parentMargin + parentHeight + childMargin = 1 - 1 + 25 + 1 = 26
    expect(childBottom.absolutePosition?.y).toBe(26);
  });

  it("should throw error for circular relative positioning", () => {
    const compA = new MockComponent(
      "a",
      "A",
      { x: { position: "right", relativeTo: "b" }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    const compB = new MockComponent(
      "b",
      "B",
      { x: { position: "right", relativeTo: "a" }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    template.addComponent(compA);
    template.addComponent(compB);

    expect(() => template.updateLayout(100, 50)).toThrow(/circular/i);
  });

  it("should throw error when relativeTo references a non-existent component", () => {
    const comp = new MockComponent(
      "comp",
      "Component",
      { x: { position: "right", relativeTo: "nonexistent" }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    template.addComponent(comp);

    expect(() => template.updateLayout(100, 50)).toThrow(/not found/i);
  });

  it("should handle long chain without cycle (A -> B -> C)", () => {
    const compA = new MockComponent(
      "a", "A",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );
    const compB = new MockComponent(
      "b", "B",
      { x: { position: "right", relativeTo: "a" }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );
    const compC = new MockComponent(
      "c", "C",
      { x: { position: "right", relativeTo: "b" }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    template.addComponent(compA);
    template.addComponent(compB);
    template.addComponent(compC);

    expect(() => template.updateLayout(100, 50)).not.toThrow();

    // A: x=1, B: x=1-1+10+1=11, C: x=11-1+10+1=21
    expect(compC.absolutePosition?.x).toBe(21);
  });

  it("should remove a component", () => {
    const comp = new MockComponent(
      "comp1", "Comp",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    template.addComponent(comp);
    expect(template.components).toHaveLength(1);

    template.removeComponent("comp1");
    expect(template.components).toHaveLength(0);
  });

  it("should throw when removing a component that others depend on", () => {
    const parent = new MockComponent(
      "parent", "Parent",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );
    const child = new MockComponent(
      "child", "Child",
      { x: { position: "right", relativeTo: "parent" }, y: { position: 0 } },
      { value: 10, unit: "px" },
      { value: 5, unit: "px" },
      {}
    );

    template.addComponent(parent);
    template.addComponent(child);

    expect(() => template.removeComponent("parent")).toThrow(/depend/i);
  });

  it("should throw when removing a non-existent component", () => {
    expect(() => template.removeComponent("nope")).toThrow(/not found/i);
  });
});
