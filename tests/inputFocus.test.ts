import { describe, it, expect, vi, beforeEach } from "vitest";
import { FocusManager } from "../src/entities/focusManager.js";
import { InputManager } from "../src/entities/inputManager.js";
import { Component } from "../src/entities/component.js";
import type { KeyEvent } from "../src/entities/inputManager.js";

class FocusableComponent extends Component {
  render() { return this.id; }
}

function makeComp(id: string) {
  return new FocusableComponent(
    id, id,
    { x: { position: 0 }, y: { position: 0 } },
    { value: 10, unit: "px" },
    { value: 5, unit: "px" },
    {}
  );
}

describe("FocusManager", () => {
  let fm: FocusManager;

  beforeEach(() => {
    fm = new FocusManager();
  });

  it("should have no focused component initially", () => {
    expect(fm.focused).toBeUndefined();
  });

  it("should auto-focus first registered component", () => {
    const comp = makeComp("a");
    fm.register(comp);
    expect(fm.focused).toBe(comp);
  });

  it("should cycle focus with focusNext", () => {
    const a = makeComp("a");
    const b = makeComp("b");
    const c = makeComp("c");
    fm.register(a);
    fm.register(b);
    fm.register(c);

    expect(fm.focused).toBe(a);
    fm.focusNext();
    expect(fm.focused).toBe(b);
    fm.focusNext();
    expect(fm.focused).toBe(c);
    fm.focusNext();
    expect(fm.focused).toBe(a); // wraps
  });

  it("should cycle focus with focusPrevious", () => {
    const a = makeComp("a");
    const b = makeComp("b");
    fm.register(a);
    fm.register(b);

    expect(fm.focused).toBe(a);
    fm.focusPrevious();
    expect(fm.focused).toBe(b); // wraps
    fm.focusPrevious();
    expect(fm.focused).toBe(a);
  });

  it("should emit focus and blur events on components", () => {
    const a = makeComp("a");
    const b = makeComp("b");
    const focusSpy = vi.fn();
    const blurSpy = vi.fn();

    a.on("focus", focusSpy);
    a.on("blur", blurSpy);
    b.on("focus", vi.fn());

    fm.register(a);
    fm.register(b);

    expect(focusSpy).toHaveBeenCalledTimes(1); // auto-focus
    fm.focusNext();
    expect(blurSpy).toHaveBeenCalledTimes(1);
  });

  it("should dispatch keypress to focused component", () => {
    const a = makeComp("a");
    const keypressSpy = vi.fn();
    a.on("keypress", keypressSpy);

    fm.register(a);

    const event: KeyEvent = { key: "a", ctrl: false, shift: false, meta: false, raw: Buffer.from("a") };
    fm.handleKeyEvent(event);

    expect(keypressSpy).toHaveBeenCalledWith(event);
  });

  it("should handle Tab as focusNext", () => {
    const a = makeComp("a");
    const b = makeComp("b");
    fm.register(a);
    fm.register(b);

    fm.handleKeyEvent({ key: "tab", ctrl: false, shift: false, meta: false, raw: Buffer.from("\t") });
    expect(fm.focused).toBe(b);
  });

  it("should handle Shift+Tab as focusPrevious", () => {
    const a = makeComp("a");
    const b = makeComp("b");
    fm.register(a);
    fm.register(b);

    fm.handleKeyEvent({ key: "tab", ctrl: false, shift: true, meta: false, raw: Buffer.from("\x1b[Z") });
    expect(fm.focused).toBe(b); // wraps to last
  });

  it("should handle unregister of focused component", () => {
    const a = makeComp("a");
    const b = makeComp("b");
    fm.register(a);
    fm.register(b);

    fm.unregister(a);
    expect(fm.focused).toBe(b);
  });

  it("should handle unregister of all components", () => {
    const a = makeComp("a");
    fm.register(a);
    fm.unregister(a);
    expect(fm.focused).toBeUndefined();
  });

  it("should emit focusChanged event", () => {
    const a = makeComp("a");
    const b = makeComp("b");
    const changeSpy = vi.fn();

    fm.on("focusChanged", changeSpy);
    fm.register(a);
    fm.register(b);

    expect(changeSpy).toHaveBeenCalledWith(a);
    fm.focusNext();
    expect(changeSpy).toHaveBeenCalledWith(b);
  });

  it("should cleanup on destroy", () => {
    const a = makeComp("a");
    fm.register(a);
    fm.destroy();
    expect(fm.focused).toBeUndefined();
  });
});

describe("InputManager", () => {
  it("should parse regular keys", () => {
    const im = new InputManager();
    const keypressSpy = vi.fn();
    im.on("keypress", keypressSpy);

    // Simulate parsing via private method
    const event = (im as any).parseKey("a", Buffer.from("a"));
    expect(event.key).toBe("a");
    expect(event.ctrl).toBe(false);
  });

  it("should parse Ctrl+C", () => {
    const im = new InputManager();
    const event = (im as any).parseKey("\x03", Buffer.from("\x03"));
    expect(event.key).toBe("c");
    expect(event.ctrl).toBe(true);
  });

  it("should parse arrow keys", () => {
    const im = new InputManager();
    const up = (im as any).parseKey("\x1b[A", Buffer.from("\x1b[A"));
    expect(up.key).toBe("up");
    const down = (im as any).parseKey("\x1b[B", Buffer.from("\x1b[B"));
    expect(down.key).toBe("down");
  });

  it("should parse Enter", () => {
    const im = new InputManager();
    const event = (im as any).parseKey("\r", Buffer.from("\r"));
    expect(event.key).toBe("enter");
  });

  it("should parse Escape", () => {
    const im = new InputManager();
    const event = (im as any).parseKey("\x1b", Buffer.from("\x1b"));
    expect(event.key).toBe("escape");
  });

  it("should parse Tab", () => {
    const im = new InputManager();
    const event = (im as any).parseKey("\t", Buffer.from("\t"));
    expect(event.key).toBe("tab");
    expect(event.shift).toBe(false);
  });

  it("should parse Shift+Tab", () => {
    const im = new InputManager();
    const event = (im as any).parseKey("\x1b[Z", Buffer.from("\x1b[Z"));
    expect(event.key).toBe("tab");
    expect(event.shift).toBe(true);
  });
});
