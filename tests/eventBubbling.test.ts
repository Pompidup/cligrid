import { describe, it, expect, vi } from "vitest";
import { createComponent } from "../src/entities/createComponent.js";
import { FocusManager } from "../src/entities/focusManager.js";
import type { KeyEvent } from "../src/entities/inputManager.js";

function keyEvent(key: string, opts: Partial<KeyEvent> = {}): KeyEvent {
  return { key, ctrl: false, shift: false, meta: false, raw: Buffer.from(""), ...opts };
}

describe("Event bubbling", () => {
  it("should bubble keypress from child to parent when not handled", () => {
    const parentSpy = vi.fn();

    const child = createComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      render: () => "child",
    });

    const parent = createComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      children: [child],
      render: () => "parent",
    });

    parent.on("keypress", parentSpy);

    const fm = new FocusManager();
    fm.register(child);

    fm.handleKeyEvent(keyEvent("a"));

    expect(parentSpy).toHaveBeenCalled();
    fm.destroy();
  });

  it("should not bubble when event is marked as handled", () => {
    const parentSpy = vi.fn();

    const child = createComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      render: () => "child",
      onKeyPress: (event) => {
        event.handled = true;
      },
    });

    const parent = createComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      children: [child],
      render: () => "parent",
    });

    parent.on("keypress", parentSpy);

    const fm = new FocusManager();
    fm.register(child);

    fm.handleKeyEvent(keyEvent("a"));

    expect(parentSpy).not.toHaveBeenCalled();
    fm.destroy();
  });

  it("should bubble through multiple levels", () => {
    const grandparentSpy = vi.fn();

    const grandchild = createComponent({
      id: "grandchild",
      position: { x: 0, y: 0 },
      width: 5,
      height: 3,
      render: () => "gc",
    });

    const child = createComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      children: [grandchild],
      render: () => "child",
    });

    const grandparent = createComponent({
      id: "grandparent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      children: [child],
      render: () => "gp",
    });

    grandparent.on("keypress", grandparentSpy);

    const fm = new FocusManager();
    fm.register(grandchild);

    fm.handleKeyEvent(keyEvent("x"));

    expect(grandparentSpy).toHaveBeenCalled();
    fm.destroy();
  });

  it("should stop bubbling at the level that handles the event", () => {
    const grandparentSpy = vi.fn();
    const childSpy = vi.fn();

    const grandchild = createComponent({
      id: "grandchild",
      position: { x: 0, y: 0 },
      width: 5,
      height: 3,
      render: () => "gc",
    });

    const child = createComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      children: [grandchild],
      render: () => "child",
    });

    child.on("keypress", (event: KeyEvent) => {
      childSpy();
      event.handled = true;
    });

    const grandparent = createComponent({
      id: "grandparent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      children: [child],
      render: () => "gp",
    });

    grandparent.on("keypress", grandparentSpy);

    const fm = new FocusManager();
    fm.register(grandchild);

    fm.handleKeyEvent(keyEvent("z"));

    expect(childSpy).toHaveBeenCalled();
    expect(grandparentSpy).not.toHaveBeenCalled();
    fm.destroy();
  });
});

describe("onKeyPress declarative handler", () => {
  it("should call onKeyPress from config", () => {
    const spy = vi.fn();

    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      render: () => "test",
      onKeyPress: spy,
    });

    comp.emit("keypress", keyEvent("a"));
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ key: "a" }),
      comp
    );
  });

  it("should allow onKeyPress to mark event as handled", () => {
    const parentSpy = vi.fn();

    const child = createComponent({
      id: "child",
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      render: () => "child",
      onKeyPress: (event) => {
        if (event.key === "enter") {
          event.handled = true;
        }
      },
    });

    const parent = createComponent({
      id: "parent",
      position: { x: 0, y: 0 },
      width: 40,
      height: 20,
      children: [child],
      render: () => "parent",
    });

    parent.on("keypress", parentSpy);

    const fm = new FocusManager();
    fm.register(child);

    // "enter" is handled by child, should not bubble
    fm.handleKeyEvent(keyEvent("enter"));
    expect(parentSpy).not.toHaveBeenCalled();

    // "a" is not handled by child, should bubble
    fm.handleKeyEvent(keyEvent("a"));
    expect(parentSpy).toHaveBeenCalled();

    fm.destroy();
  });
});
