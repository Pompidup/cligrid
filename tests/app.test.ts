import { describe, it, expect, vi, afterEach } from "vitest";
import { App } from "../src/entities/app.js";
import { Component } from "../src/entities/component.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

class TestComponent extends Component<{ label: string }> {
  render() { return this.props.label; }
}

describe("App", () => {
  let app: App;

  afterEach(() => {
    app?.stop();
  });

  function setup() {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
    app = new App({ terminalDimensions: { getWidth: () => 80, getHeight: () => 24 } });
    return app;
  }

  it("should add and remove components", () => {
    const app = setup();
    const comp = new TestComponent({
      id: "test", position: { x: 0, y: 0 }, width: 20, height: 5,
      props: { label: "Hello" },
    });

    app.add(comp);
    expect(() => app.remove("test")).not.toThrow();
  });

  it("should support fluent API", () => {
    const app = setup();
    const a = new TestComponent({
      id: "a", position: { x: 0, y: 0 }, width: 10, height: 3,
      props: { label: "A" },
    });
    const b = new TestComponent({
      id: "b", position: { x: 10, y: 0 }, width: 10, height: 3,
      props: { label: "B" },
    });

    const result = app.add(a).add(b);
    expect(result).toBe(app);
  });

  it("should register focusable components", () => {
    const app = setup();
    const comp = new TestComponent({
      id: "focusable", position: { x: 0, y: 0 }, width: 20, height: 5,
      props: { label: "Focus me" },
    });

    app.add(comp, true);
    expect(app.focus.focused).toBe(comp);
  });

  it("should start and stop", () => {
    const app = setup();
    expect(app.isRunning).toBe(false);

    app.start();
    expect(app.isRunning).toBe(true);

    app.stop();
    expect(app.isRunning).toBe(false);
  });

  it("should not crash on double start or double stop", () => {
    const app = setup();
    app.start();
    expect(() => app.start()).not.toThrow();
    app.stop();
    expect(() => app.stop()).not.toThrow();
  });

  it("should register global key handlers", () => {
    const app = setup();
    const handler = vi.fn();

    app.onKey("ctrl+c", handler);
    app.start();

    // Simulate ctrl+c through input manager
    const inputManager = app["inputManager"];
    inputManager.emit("keypress", {
      key: "c", ctrl: true, shift: false, meta: false, raw: Buffer.from("\x03"),
    });

    expect(handler).toHaveBeenCalled();
  });

  it("should dispatch non-global keys to focus manager", () => {
    const app = setup();
    const comp = new TestComponent({
      id: "focused", position: { x: 0, y: 0 }, width: 20, height: 5,
      props: { label: "X" },
    });
    const keypressSpy = vi.fn();
    comp.on("keypress", keypressSpy);

    app.add(comp, true);
    app.start();

    const inputManager = app["inputManager"];
    const event = { key: "a", ctrl: false, shift: false, meta: false, raw: Buffer.from("a") };
    inputManager.emit("keypress", event);

    expect(keypressSpy).toHaveBeenCalledWith(event);
  });
});
