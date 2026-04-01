import { describe, it, expect, afterEach } from "vitest";
import { Component, parseSize, parsePosition } from "../src/entities/component.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";
import type { RenderOutput, RenderLine } from "../src/entities/component.js";

describe("Config API", () => {
  describe("parseSize", () => {
    it("should parse number as px", () => {
      expect(parseSize(10)).toEqual({ value: 10, unit: "px" });
    });

    it("should parse string percentage", () => {
      expect(parseSize("50%")).toEqual({ value: 50, unit: "%" });
    });

    it("should parse plain number string as px", () => {
      expect(parseSize("20")).toEqual({ value: 20, unit: "px" });
    });

    it("should pass through Size object as-is", () => {
      const size = { value: 30, unit: "px" as const };
      expect(parseSize(size)).toEqual(size);
    });
  });

  describe("parsePosition", () => {
    it("should parse short form { x, y } as absolute position", () => {
      const result = parsePosition({ x: 5, y: 10 });
      expect(result).toEqual({
        x: { position: 5 },
        y: { position: 10 },
      });
    });

    it("should pass through full Position as-is", () => {
      const full = {
        x: { position: "right" as const, relativeTo: "other" },
        y: { position: 0 },
      };
      expect(parsePosition(full)).toEqual(full);
    });
  });

  describe("Component with config constructor", () => {
    it("should create component from config object", () => {
      class TestComp extends Component<{ label: string }> {
        render() { return this.props.label; }
      }

      const comp = new TestComp({
        id: "test",
        position: { x: 0, y: 0 },
        width: "50%",
        height: 10,
        props: { label: "Hello" },
        margin: 2,
        style: { fg: "red" },
      });

      expect(comp.id).toBe("test");
      expect(comp.name).toBe("test"); // defaults to id
      expect(comp.width).toEqual({ value: 50, unit: "%" });
      expect(comp.height).toEqual({ value: 10, unit: "px" });
      expect(comp.margin).toBe(2);
      expect(comp.style?.fg).toBe("red");
      expect(comp.props.label).toBe("Hello");
    });

    it("should default name to id, margin to 1, props to {}", () => {
      class TestComp extends Component {
        render() { return "test"; }
      }

      const comp = new TestComp({
        id: "myId",
        position: { x: 0, y: 0 },
        width: 20,
        height: 5,
      });

      expect(comp.name).toBe("myId");
      expect(comp.margin).toBe(1);
    });

    it("should still work with old constructor", () => {
      class TestComp extends Component {
        render() { return "old"; }
      }

      const comp = new TestComp(
        "id", "name",
        { x: { position: 0 }, y: { position: 0 } },
        { value: 10, unit: "px" },
        { value: 5, unit: "px" },
        {}
      );

      expect(comp.id).toBe("id");
      expect(comp.name).toBe("name");
    });
  });

  describe("RenderOutput", () => {
    let renderer: Renderer;

    afterEach(() => {
      renderer?.destroy();
    });

    it("should handle string return (backwards compatible)", () => {
      class StringComp extends Component {
        render(): string { return "Hello World"; }
      }

      setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
      const comp = new StringComp({
        id: "str", position: { x: 0, y: 0 }, width: 20, height: 3,
      });

      const template = new Template();
      template.addComponent(comp);
      renderer = new Renderer(template);
      renderer.render();

      const buf = renderer["backBuffer"];
      expect(buf.getCell(1, 1)?.char).toBe("H");
    });

    it("should handle RenderLine array with per-line styles", () => {
      class RichComp extends Component {
        render(): RenderOutput {
          return [
            { text: "Title", style: { bold: true, fg: "yellow" } },
            { text: "Body text" },
          ];
        }
      }

      setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
      const comp = new RichComp({
        id: "rich", position: { x: 0, y: 0 }, width: 20, height: 5,
      });

      const template = new Template();
      template.addComponent(comp);
      renderer = new Renderer(template);
      renderer.render();

      const buf = renderer["backBuffer"];
      // Line 0: "Title" with bold + yellow
      expect(buf.getCell(1, 1)?.char).toBe("T");
      expect(buf.getCell(1, 1)?.bold).toBe(true);
      expect(buf.getCell(1, 1)?.fg).toBe("yellow");

      // Line 1: "Body text" without special style
      expect(buf.getCell(1, 2)?.char).toBe("B");
    });

    it("should handle single RenderLine", () => {
      class SingleLineComp extends Component {
        render(): RenderOutput {
          return { text: "Single", style: { underline: true } };
        }
      }

      setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
      const comp = new SingleLineComp({
        id: "single", position: { x: 0, y: 0 }, width: 20, height: 3,
      });

      const template = new Template();
      template.addComponent(comp);
      renderer = new Renderer(template);
      renderer.render();

      const buf = renderer["backBuffer"];
      expect(buf.getCell(1, 1)?.char).toBe("S");
      expect(buf.getCell(1, 1)?.underline).toBe(true);
    });
  });
});
