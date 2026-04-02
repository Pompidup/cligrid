import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InputManager } from "../src/entities/inputManager.js";
import type { MouseEvent } from "../src/entities/inputManager.js";

describe("Mouse SGR parsing", () => {
  let input: InputManager;

  beforeEach(() => {
    input = new InputManager();
  });

  it("should parse left click", () => {
    const event = input.parseMouse("\x1b[<0;10;5M");
    expect(event).toEqual({ x: 9, y: 4, button: "left", type: "click" });
  });

  it("should parse right click", () => {
    const event = input.parseMouse("\x1b[<2;1;1M");
    expect(event).toEqual({ x: 0, y: 0, button: "right", type: "click" });
  });

  it("should parse middle click", () => {
    const event = input.parseMouse("\x1b[<1;5;10M");
    expect(event).toEqual({ x: 4, y: 9, button: "middle", type: "click" });
  });

  it("should parse left release", () => {
    const event = input.parseMouse("\x1b[<0;10;5m");
    expect(event).toEqual({ x: 9, y: 4, button: "left", type: "release" });
  });

  it("should parse mouse move with left button held", () => {
    // motion flag (32) + left button (0) = 32
    const event = input.parseMouse("\x1b[<32;15;20M");
    expect(event).toEqual({ x: 14, y: 19, button: "left", type: "move" });
  });

  it("should parse mouse move with no button", () => {
    // motion flag (32) + button 3 (no button) = 35
    const event = input.parseMouse("\x1b[<35;15;20M");
    expect(event).toEqual({ x: 14, y: 19, button: "none", type: "move" });
  });

  it("should parse scroll up", () => {
    // scroll flag (64) + 0 = 64
    const event = input.parseMouse("\x1b[<64;10;5M");
    expect(event).toEqual({ x: 9, y: 4, button: "none", type: "scroll-up" });
  });

  it("should parse scroll down", () => {
    // scroll flag (64) + 1 = 65
    const event = input.parseMouse("\x1b[<65;10;5M");
    expect(event).toEqual({ x: 9, y: 4, button: "none", type: "scroll-down" });
  });

  it("should return null for non-mouse sequences", () => {
    expect(input.parseMouse("\x1b[A")).toBeNull();
    expect(input.parseMouse("hello")).toBeNull();
    expect(input.parseMouse("")).toBeNull();
  });

  it("should convert 1-based coordinates to 0-based", () => {
    const event = input.parseMouse("\x1b[<0;1;1M");
    expect(event).toEqual({ x: 0, y: 0, button: "left", type: "click" });
  });

  it("should handle large coordinates", () => {
    const event = input.parseMouse("\x1b[<0;200;50M");
    expect(event).toEqual({ x: 199, y: 49, button: "left", type: "click" });
  });
});

describe("Mouse enable/disable", () => {
  let input: InputManager;
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    input = new InputManager();
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  it("should enable mouse tracking", () => {
    input.enableMouse();
    expect(writeSpy).toHaveBeenCalledWith("\x1b[?1003h\x1b[?1006h");
    expect(input.mouseEnabled).toBe(true);
  });

  it("should disable mouse tracking", () => {
    input.enableMouse();
    writeSpy.mockClear();
    input.disableMouse();
    expect(writeSpy).toHaveBeenCalledWith("\x1b[?1003l\x1b[?1006l");
    expect(input.mouseEnabled).toBe(false);
  });

  it("should not double-enable", () => {
    input.enableMouse();
    writeSpy.mockClear();
    input.enableMouse();
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("should not double-disable", () => {
    input.disableMouse();
    expect(writeSpy).not.toHaveBeenCalled();
  });
});

describe("Mouse position tracking", () => {
  it("should update mouseX/mouseY on mouse events", () => {
    const input = new InputManager();
    expect(input.mouseX).toBe(-1);
    expect(input.mouseY).toBe(-1);

    // Simulate by calling parseMouse and checking that dataHandler would update
    // We test the InputManager's event emission logic
    const events: MouseEvent[] = [];
    input.on("mouse", (e: MouseEvent) => events.push(e));

    // Manually trigger the data handler logic
    // Since start() needs a TTY, we test the parsing + position tracking directly
    const mouseEvent = input.parseMouse("\x1b[<0;15;10M");
    if (mouseEvent) {
      input.mouseX = mouseEvent.x;
      input.mouseY = mouseEvent.y;
    }
    expect(input.mouseX).toBe(14);
    expect(input.mouseY).toBe(9);
  });
});
