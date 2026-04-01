import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applyOverflow, wrapWord } from "../src/utils/text.js";
import { createComponent } from "../src/entities/createComponent.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

describe("applyOverflow - hidden", () => {
  it("should truncate lines longer than width", () => {
    const result = applyOverflow(["Hello World"], 5, "hidden");
    expect(result).toEqual(["Hello"]);
  });

  it("should not modify lines shorter than width", () => {
    const result = applyOverflow(["Hi"], 10, "hidden");
    expect(result).toEqual(["Hi"]);
  });

  it("should handle multiple lines", () => {
    const result = applyOverflow(["Hello World", "Foo"], 5, "hidden");
    expect(result).toEqual(["Hello", "Foo"]);
  });
});

describe("applyOverflow - ellipsis", () => {
  it("should add ... when line exceeds width", () => {
    const result = applyOverflow(["Hello World"], 8, "ellipsis");
    expect(result).toEqual(["Hello..."]);
  });

  it("should not add ... when line fits", () => {
    const result = applyOverflow(["Hello"], 10, "ellipsis");
    expect(result).toEqual(["Hello"]);
  });

  it("should handle very small width (<=3)", () => {
    const result = applyOverflow(["Hello"], 3, "ellipsis");
    expect(result).toEqual(["Hel"]);
  });

  it("should handle width of 4", () => {
    const result = applyOverflow(["Hello World"], 4, "ellipsis");
    expect(result).toEqual(["H..."]);
  });
});

describe("applyOverflow - wrap", () => {
  it("should wrap long lines by character", () => {
    const result = applyOverflow(["ABCDEFGHIJ"], 4, "wrap");
    expect(result).toEqual(["ABCD", "EFGH", "IJ"]);
  });

  it("should not wrap short lines", () => {
    const result = applyOverflow(["Hi"], 10, "wrap");
    expect(result).toEqual(["Hi"]);
  });

  it("should handle multiple input lines", () => {
    const result = applyOverflow(["ABCDEF", "XY"], 4, "wrap");
    expect(result).toEqual(["ABCD", "EF", "XY"]);
  });
});

describe("applyOverflow - wrap-word", () => {
  it("should wrap at word boundaries", () => {
    const result = applyOverflow(["Hello beautiful World"], 13, "wrap-word");
    expect(result).toEqual(["Hello", "beautiful", "World"]);
  });

  it("should break long words by character", () => {
    const result = applyOverflow(["Superlongword ok"], 5, "wrap-word");
    expect(result).toEqual(["Super", "longw", "ord", "ok"]);
  });

  it("should keep words that fit on the same line", () => {
    const result = applyOverflow(["aa bb cc dd"], 5, "wrap-word");
    expect(result).toEqual(["aa bb", "cc dd"]);
  });

  it("should handle empty lines", () => {
    const result = applyOverflow([""], 10, "wrap-word");
    expect(result).toEqual([""]);
  });

  it("should handle width of 0", () => {
    const result = applyOverflow(["Hello"], 0, "wrap-word");
    expect(result).toEqual([]);
  });
});

describe("Overflow in Renderer", () => {
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

  it("should apply ellipsis overflow in rendered component", () => {
    const comp = createComponent({
      id: "ellipsis",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      margin: 0,
      style: { overflow: "ellipsis" },
      render: () => "Hello World!",
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    // "Hello W..." = 10 chars
    let text = "";
    for (let i = 0; i < 10; i++) {
      text += buf.getCell(i, 0)?.char ?? "";
    }
    expect(text).toBe("Hello W...");
  });

  it("should apply wrap overflow producing multiple visible lines", () => {
    const comp = createComponent({
      id: "wrap",
      position: { x: 0, y: 0 },
      width: 5,
      height: 3,
      margin: 0,
      style: { overflow: "wrap" },
      render: () => "ABCDEFGHIJ",
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    // Line 0: ABCDE, Line 1: FGHIJ
    expect(buf.getCell(0, 0)?.char).toBe("A");
    expect(buf.getCell(4, 0)?.char).toBe("E");
    expect(buf.getCell(0, 1)?.char).toBe("F");
    expect(buf.getCell(4, 1)?.char).toBe("J");
  });

  it("should default to hidden overflow (backward compatible)", () => {
    const comp = createComponent({
      id: "default",
      position: { x: 0, y: 0 },
      width: 5,
      height: 1,
      margin: 0,
      render: () => "Hello World",
    });

    template.addComponent(comp);
    renderer.render();

    const buf = renderer["backBuffer"];
    let text = "";
    for (let i = 0; i < 5; i++) {
      text += buf.getCell(i, 0)?.char ?? "";
    }
    expect(text).toBe("Hello");
  });
});
