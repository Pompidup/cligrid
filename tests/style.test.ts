import { describe, it, expect, afterEach } from "vitest";
import { Component } from "../src/entities/component.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";
import type { Style } from "../src/entities/style.js";

class StyledComponent extends Component<{ text: string }> {
  render(): string {
    return this.props.text;
  }
}

describe("Style & Box Model", () => {
  let renderer: Renderer;

  afterEach(() => {
    renderer?.destroy();
  });

  function setup(style: Style, width = 20, height = 5) {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });

    const comp = new StyledComponent(
      "styled", "Styled",
      { x: { position: 0 }, y: { position: 0 } },
      { value: width, unit: "px" },
      { value: height, unit: "px" },
      { text: "Hello" },
      0,
      style
    );

    const template = new Template();
    template.addComponent(comp);
    renderer = new Renderer(template);
    renderer.render();

    return { comp, buf: renderer["backBuffer"] };
  }

  it("should render single border around component", () => {
    const { buf } = setup({ border: { style: "single" } });

    // Top-left corner
    expect(buf.getCell(0, 0)?.char).toBe("┌");
    // Top-right corner
    expect(buf.getCell(19, 0)?.char).toBe("┐");
    // Bottom-left corner
    expect(buf.getCell(0, 4)?.char).toBe("└");
    // Bottom-right corner
    expect(buf.getCell(19, 4)?.char).toBe("┘");
    // Left side
    expect(buf.getCell(0, 2)?.char).toBe("│");
    // Right side
    expect(buf.getCell(19, 2)?.char).toBe("│");
    // Top horizontal
    expect(buf.getCell(1, 0)?.char).toBe("─");
  });

  it("should render double border", () => {
    const { buf } = setup({ border: { style: "double" } });

    expect(buf.getCell(0, 0)?.char).toBe("╔");
    expect(buf.getCell(19, 0)?.char).toBe("╗");
    expect(buf.getCell(0, 4)?.char).toBe("╚");
    expect(buf.getCell(19, 4)?.char).toBe("╝");
  });

  it("should render rounded border", () => {
    const { buf } = setup({ border: { style: "rounded" } });

    expect(buf.getCell(0, 0)?.char).toBe("╭");
    expect(buf.getCell(19, 0)?.char).toBe("╮");
    expect(buf.getCell(0, 4)?.char).toBe("╰");
    expect(buf.getCell(19, 4)?.char).toBe("╯");
  });

  it("should place content inside border", () => {
    const { buf } = setup({ border: { style: "single" } });

    // "Hello" starts at x=1 (after border), y=1 (after border)
    expect(buf.getCell(1, 1)?.char).toBe("H");
    expect(buf.getCell(2, 1)?.char).toBe("e");
    expect(buf.getCell(5, 1)?.char).toBe("o");
  });

  it("should place content inside border + padding", () => {
    const { buf } = setup({
      border: { style: "single" },
      padding: { top: 1, left: 2 },
    });

    // "Hello" starts at x=3 (border=1 + padding.left=2), y=2 (border=1 + padding.top=1)
    expect(buf.getCell(3, 2)?.char).toBe("H");
    expect(buf.getCell(4, 2)?.char).toBe("e");
  });

  it("should clip content that exceeds inner width", () => {
    const { buf } = setup(
      { border: { style: "single" } },
      10, // narrow component
      3
    );

    // Inner width = 10 - 2 (borders) = 8, "Hello" is 5 chars, fits
    expect(buf.getCell(1, 1)?.char).toBe("H");
    expect(buf.getCell(5, 1)?.char).toBe("o");
  });

  it("should apply fg style to content cells", () => {
    const { buf } = setup({ fg: "red" });

    const cell = buf.getCell(0, 0);
    expect(cell?.char).toBe("H");
    expect(cell?.fg).toBe("red");
  });

  it("should apply bg style to inner area", () => {
    const { buf } = setup({ bg: "blue", border: { style: "single" } });

    // Inner cell should have bg
    const innerCell = buf.getCell(5, 2);
    expect(innerCell?.bg).toBe("blue");

    // Border cell should NOT have bg
    const borderCell = buf.getCell(0, 0);
    expect(borderCell?.bg).toBeUndefined();
  });

  it("should apply border fg color", () => {
    const { buf } = setup({ border: { style: "single", fg: "cyan" } });

    expect(buf.getCell(0, 0)?.fg).toBe("cyan");
    expect(buf.getCell(1, 0)?.fg).toBe("cyan");
  });

  it("should render without style (backwards compatible)", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });

    const comp = new StyledComponent(
      "plain", "Plain",
      { x: { position: 0 }, y: { position: 0 } },
      { value: 20, unit: "px" },
      { value: 3, unit: "px" },
      { text: "NoStyle" },
      0
    );

    const template = new Template();
    template.addComponent(comp);
    renderer = new Renderer(template);
    renderer.render();

    const buf = renderer["backBuffer"];
    expect(buf.getCell(0, 0)?.char).toBe("N");
    expect(buf.getCell(6, 0)?.char).toBe("e");
  });
});
