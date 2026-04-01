import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TextBox } from "../src/components/textBox.js";
import { SelectList } from "../src/components/selectList.js";
import { ProgressBar } from "../src/components/progressBar.js";
import { InputField } from "../src/components/inputField.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";
import type { RenderLine } from "../src/entities/component.js";

describe("TextBox", () => {
  it("should render text content", () => {
    const box = new TextBox({
      id: "text",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { text: "Hello World" },
    });

    expect(box.render()).toBe("Hello World");
  });

  it("should update text via setProps", () => {
    const box = new TextBox({
      id: "text",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { text: "Before" },
    });

    box.setProps({ text: "After" });
    expect(box.render()).toBe("After");
  });

  it("should support multiline text", () => {
    const box = new TextBox({
      id: "text",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { text: "Line 1\nLine 2\nLine 3" },
    });

    expect(box.render()).toBe("Line 1\nLine 2\nLine 3");
  });
});

describe("SelectList", () => {
  it("should render items with selection marker", () => {
    const list = new SelectList({
      id: "menu",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { items: ["A", "B", "C"], selectedIndex: 0 },
    });

    const output = list.render() as RenderLine[];
    expect(output[0]!.text).toBe("▸ A");
    expect(output[1]!.text).toBe("  B");
    expect(output[2]!.text).toBe("  C");
  });

  it("should bold the selected item", () => {
    const list = new SelectList({
      id: "menu",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { items: ["A", "B"], selectedIndex: 1 },
    });

    const output = list.render() as RenderLine[];
    expect(output[0]!.style).toBeUndefined();
    expect(output[1]!.style).toEqual({ bold: true });
  });

  it("should navigate down on arrow key", () => {
    const list = new SelectList({
      id: "menu",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { items: ["A", "B", "C"], selectedIndex: 0 },
    });

    list.emit("keypress", { key: "down", ctrl: false, shift: false, meta: false });
    expect(list.props.selectedIndex).toBe(1);
  });

  it("should navigate up on arrow key", () => {
    const list = new SelectList({
      id: "menu",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { items: ["A", "B", "C"], selectedIndex: 2 },
    });

    list.emit("keypress", { key: "up", ctrl: false, shift: false, meta: false });
    expect(list.props.selectedIndex).toBe(1);
  });

  it("should not go below 0 or above items.length - 1", () => {
    const list = new SelectList({
      id: "menu",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { items: ["A", "B"], selectedIndex: 0 },
    });

    list.emit("keypress", { key: "up", ctrl: false, shift: false, meta: false });
    expect(list.props.selectedIndex).toBe(0);

    list.setProps({ selectedIndex: 1 });
    list.emit("keypress", { key: "down", ctrl: false, shift: false, meta: false });
    expect(list.props.selectedIndex).toBe(1);
  });

  it("should call onSelect on enter", () => {
    const onSelect = vi.fn();
    const list = new SelectList({
      id: "menu",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      props: { items: ["A", "B", "C"], selectedIndex: 1 },
      onSelect,
    });

    list.emit("keypress", { key: "enter", ctrl: false, shift: false, meta: false });
    expect(onSelect).toHaveBeenCalledWith(1, "B");
  });
});

describe("ProgressBar", () => {
  it("should render progress at 0%", () => {
    const bar = new ProgressBar({
      id: "progress",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: 0 },
    });

    const output = bar.render({ width: 20, height: 1, focused: false, terminalWidth: 80, terminalHeight: 24 }) as string;
    expect(output).toContain("0%");
    expect(output).toContain("[");
    expect(output).toContain("]");
    expect(output).not.toContain("█");
  });

  it("should render progress at 50%", () => {
    const bar = new ProgressBar({
      id: "progress",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: 0.5 },
    });

    const output = bar.render({ width: 20, height: 1, focused: false, terminalWidth: 80, terminalHeight: 24 }) as string;
    expect(output).toContain("50%");
    expect(output).toContain("█");
    expect(output).toContain("░");
  });

  it("should render progress at 100%", () => {
    const bar = new ProgressBar({
      id: "progress",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: 1 },
    });

    const output = bar.render({ width: 20, height: 1, focused: false, terminalWidth: 80, terminalHeight: 24 }) as string;
    expect(output).toContain("100%");
    expect(output).not.toContain("░");
  });

  it("should include label if provided", () => {
    const bar = new ProgressBar({
      id: "progress",
      position: { x: 0, y: 0 },
      width: 30,
      height: 1,
      props: { value: 0.5, label: "Loading" },
    });

    const output = bar.render({ width: 30, height: 1, focused: false, terminalWidth: 80, terminalHeight: 24 }) as string;
    expect(output).toContain("Loading");
  });

  it("should clamp values outside 0-1", () => {
    const bar = new ProgressBar({
      id: "progress",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: 1.5 },
    });

    const output = bar.render({ width: 20, height: 1, focused: false, terminalWidth: 80, terminalHeight: 24 }) as string;
    expect(output).toContain("100%");
  });
});

describe("InputField", () => {
  it("should render placeholder when empty", () => {
    const input = new InputField({
      id: "input",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: "", placeholder: "Type here..." },
    });

    const output = input.render({ width: 20, height: 1, focused: false, terminalWidth: 80, terminalHeight: 24 });
    expect((output as RenderLine).text).toBe("Type here...");
    expect((output as RenderLine).style).toEqual({ dim: true });
  });

  it("should render current value", () => {
    const input = new InputField({
      id: "input",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: "Hello" },
    });

    const output = input.render() as RenderLine[];
    expect(output[0]!.text).toContain("Hello");
  });

  it("should insert characters on keypress", () => {
    const onChange = vi.fn();
    const input = new InputField({
      id: "input",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: "", cursorPos: 0 },
      onChange,
    });

    input.emit("keypress", { key: "H", ctrl: false, shift: false, meta: false });
    expect(input.props.value).toBe("H");
    expect(onChange).toHaveBeenCalledWith("H");

    input.emit("keypress", { key: "i", ctrl: false, shift: false, meta: false });
    expect(input.props.value).toBe("Hi");
    expect(onChange).toHaveBeenCalledWith("Hi");
  });

  it("should handle backspace", () => {
    const input = new InputField({
      id: "input",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: "Hello", cursorPos: 5 },
    });

    input.emit("keypress", { key: "backspace", ctrl: false, shift: false, meta: false });
    expect(input.props.value).toBe("Hell");
    expect(input.props.cursorPos).toBe(4);
  });

  it("should handle left/right arrow keys", () => {
    const input = new InputField({
      id: "input",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: "ABC", cursorPos: 2 },
    });

    input.emit("keypress", { key: "left", ctrl: false, shift: false, meta: false });
    expect(input.props.cursorPos).toBe(1);

    input.emit("keypress", { key: "right", ctrl: false, shift: false, meta: false });
    expect(input.props.cursorPos).toBe(2);
  });

  it("should call onSubmit on enter", () => {
    const onSubmit = vi.fn();
    const input = new InputField({
      id: "input",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: "test" },
      onSubmit,
    });

    input.emit("keypress", { key: "enter", ctrl: false, shift: false, meta: false });
    expect(onSubmit).toHaveBeenCalledWith("test");
  });

  it("should handle delete key", () => {
    const input = new InputField({
      id: "input",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: "ABC", cursorPos: 1 },
    });

    input.emit("keypress", { key: "delete", ctrl: false, shift: false, meta: false });
    expect(input.props.value).toBe("AC");
    expect(input.props.cursorPos).toBe(1);
  });
});

describe("Built-in components in Renderer", () => {
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

  it("should render TextBox with wrap overflow", () => {
    const box = new TextBox({
      id: "text",
      position: { x: 0, y: 0 },
      width: 10,
      height: 3,
      margin: 0,
      style: { overflow: "wrap-word" },
      props: { text: "Hello beautiful World" },
    });

    template.addComponent(box);
    renderer.render();

    const buf = renderer["backBuffer"];
    expect(buf.getCell(0, 0)?.char).toBe("H");
  });

  it("should render SelectList in buffer", () => {
    const list = new SelectList({
      id: "menu",
      position: { x: 0, y: 0 },
      width: 20,
      height: 3,
      margin: 0,
      props: { items: ["A", "B", "C"], selectedIndex: 0 },
    });

    template.addComponent(list);
    renderer.render();

    const buf = renderer["backBuffer"];
    // "▸ A" - first char is "▸"
    expect(buf.getCell(0, 0)?.char).toBe("▸");
  });

  it("should render ProgressBar in buffer", () => {
    const bar = new ProgressBar({
      id: "bar",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      margin: 0,
      props: { value: 0.5 },
    });

    template.addComponent(bar);
    renderer.render();

    const buf = renderer["backBuffer"];
    expect(buf.getCell(0, 0)?.char).toBe("[");
  });
});
