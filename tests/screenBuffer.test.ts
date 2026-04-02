import { describe, it, expect, beforeEach } from "vitest";
import { ScreenBuffer } from "../src/entities/screenBuffer.js";

describe("ScreenBuffer", () => {
  let buffer: ScreenBuffer;

  beforeEach(() => {
    buffer = new ScreenBuffer(10, 5);
  });

  it("should initialize with correct dimensions", () => {
    expect(buffer.width).toBe(10);
    expect(buffer.height).toBe(5);
  });

  it("should initialize all cells as empty spaces", () => {
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 10; x++) {
        expect(buffer.getCell(x, y)?.char).toBe(" ");
      }
    }
  });

  it("should write text at a position", () => {
    buffer.write(2, 1, "Hello");

    expect(buffer.getCell(2, 1)?.char).toBe("H");
    expect(buffer.getCell(3, 1)?.char).toBe("e");
    expect(buffer.getCell(4, 1)?.char).toBe("l");
    expect(buffer.getCell(5, 1)?.char).toBe("l");
    expect(buffer.getCell(6, 1)?.char).toBe("o");
  });

  it("should write text with style", () => {
    buffer.write(0, 0, "Hi", { fg: "red", bold: true });

    const cell = buffer.getCell(0, 0);
    expect(cell?.char).toBe("H");
    expect(cell?.fg).toBe("red");
    expect(cell?.bold).toBe(true);
  });

  it("should clip text that exceeds buffer width", () => {
    buffer.write(8, 0, "Hello");

    expect(buffer.getCell(8, 0)?.char).toBe("H");
    expect(buffer.getCell(9, 0)?.char).toBe("e");
    expect(buffer.getCell(10, 0)).toBeUndefined();
  });

  it("should ignore writes outside bounds (negative x)", () => {
    buffer.write(-2, 0, "Hello");
    expect(buffer.getCell(0, 0)?.char).toBe("l");
    expect(buffer.getCell(1, 0)?.char).toBe("l");
    expect(buffer.getCell(2, 0)?.char).toBe("o");
  });

  it("should ignore writes outside bounds (negative y)", () => {
    buffer.write(0, -1, "Hello");
    expect(buffer.getCell(0, 0)?.char).toBe(" ");
  });

  it("should return undefined for out of bounds getCell", () => {
    expect(buffer.getCell(-1, 0)).toBeUndefined();
    expect(buffer.getCell(0, -1)).toBeUndefined();
    expect(buffer.getCell(10, 0)).toBeUndefined();
    expect(buffer.getCell(0, 5)).toBeUndefined();
  });

  it("should clear all cells", () => {
    buffer.write(0, 0, "Hello");
    buffer.clear();

    for (let x = 0; x < 5; x++) {
      expect(buffer.getCell(x, 0)?.char).toBe(" ");
    }
  });

  it("should clear a specific region", () => {
    buffer.write(0, 0, "AAAAAAAAAA");
    buffer.write(0, 1, "BBBBBBBBBB");
    buffer.write(0, 2, "CCCCCCCCCC");

    buffer.clearRegion(2, 0, 3, 2);

    expect(buffer.getCell(1, 0)?.char).toBe("A");
    expect(buffer.getCell(2, 0)?.char).toBe(" ");
    expect(buffer.getCell(3, 0)?.char).toBe(" ");
    expect(buffer.getCell(4, 0)?.char).toBe(" ");
    expect(buffer.getCell(5, 0)?.char).toBe("A");

    expect(buffer.getCell(2, 1)?.char).toBe(" ");
    expect(buffer.getCell(2, 2)?.char).toBe("C");
  });

  it("should resize and reset the buffer", () => {
    buffer.write(0, 0, "Hello");
    buffer.resize(20, 10);

    expect(buffer.width).toBe(20);
    expect(buffer.height).toBe(10);
    expect(buffer.getCell(0, 0)?.char).toBe(" ");
  });

  it("should diff two buffers and return changed cells", () => {
    const other = new ScreenBuffer(10, 5);
    other.write(0, 0, "Hi");

    const changes = other.diff(buffer);

    expect(changes).toHaveLength(2);
    expect(changes[0]).toEqual({ x: 0, y: 0, cell: { char: "H", fg: undefined, bg: undefined, bold: undefined, dim: undefined, underline: undefined, italic: undefined, strikethrough: undefined, inverse: undefined } });
    expect(changes[1]).toEqual({ x: 1, y: 0, cell: { char: "i", fg: undefined, bg: undefined, bold: undefined, dim: undefined, underline: undefined, italic: undefined, strikethrough: undefined, inverse: undefined } });
  });

  it("should return empty diff for identical buffers", () => {
    const other = buffer.clone();
    expect(other.diff(buffer)).toHaveLength(0);
  });

  it("should detect style changes in diff", () => {
    const other = new ScreenBuffer(10, 5);
    buffer.write(0, 0, "A");
    other.write(0, 0, "A", { fg: "red" });

    const changes = other.diff(buffer);
    expect(changes).toHaveLength(1);
    expect(changes[0]?.cell.fg).toBe("red");
  });

  it("should clone the buffer without sharing references", () => {
    buffer.write(0, 0, "X");
    const clone = buffer.clone();

    clone.write(0, 0, "Y");

    expect(buffer.getCell(0, 0)?.char).toBe("X");
    expect(clone.getCell(0, 0)?.char).toBe("Y");
  });
});
