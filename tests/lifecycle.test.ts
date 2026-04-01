import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createComponent } from "../src/entities/createComponent.js";
import { Template } from "../src/entities/template.js";
import { Renderer } from "../src/entities/renderer.js";
import { App } from "../src/entities/app.js";
import { setTerminalDimensions } from "../config/terminalDimensionsFactory.js";

describe("Lifecycle hooks", () => {
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

  it("should call onMount on first render", () => {
    const mountSpy = vi.fn();

    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      margin: 0,
      render: () => "test",
      onMount: mountSpy,
    });

    template.addComponent(comp);
    renderer.render();

    expect(mountSpy).toHaveBeenCalledOnce();
    expect(comp.mounted).toBe(true);
  });

  it("should not call onMount on subsequent renders", () => {
    const mountSpy = vi.fn();

    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      margin: 0,
      render: () => "test",
      onMount: mountSpy,
    });

    template.addComponent(comp);
    renderer.render();
    renderer.render();
    renderer.render();

    expect(mountSpy).toHaveBeenCalledOnce();
  });

  it("should call onDestroy when component is removed", () => {
    const destroySpy = vi.fn();

    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 5,
      margin: 0,
      render: () => "test",
      onDestroy: destroySpy,
    });

    template.addComponent(comp);
    renderer.render();

    template.removeComponent("test");
    expect(destroySpy).toHaveBeenCalledOnce();
    expect(comp.mounted).toBe(false);
  });

  it("should emit resize event when dimensions change", () => {
    const resizeSpy = vi.fn();

    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: "50%",
      height: "50%",
      margin: 0,
      render: () => "test",
    });

    comp.on("resize", resizeSpy);

    template.addComponent(comp);
    template.updateLayout(80, 24);
    // First layout - no previous position, no resize event
    expect(resizeSpy).not.toHaveBeenCalled();

    // Second layout with different dimensions
    template.updateLayout(100, 30);
    expect(resizeSpy).toHaveBeenCalledWith(50, 15);
  });
});

describe("App state store", () => {
  it("should store and retrieve state", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    app.setState({ score: 0, name: "Alice" });
    expect(app.state).toEqual({ score: 0, name: "Alice" });

    app.setState({ score: 42 });
    expect(app.state).toEqual({ score: 42, name: "Alice" });

    app.stop();
  });

  it("should update connected component props on setState", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    const comp = createComponent({
      id: "score",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { score: 0 },
      render: (props) => `Score: ${props.score}`,
    });

    app.add(comp);
    app.setState({ score: 0 });
    app.connect(comp, (state) => ({ score: state.score }));

    expect(comp.props.score).toBe(0);

    app.setState({ score: 100 });
    expect(comp.props.score).toBe(100);

    app.stop();
  });

  it("should not trigger setProps if derived state hasnt changed", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { value: "a" },
      render: (props) => props.value,
    });

    app.add(comp);
    app.setState({ value: "a", other: 1 });
    app.connect(comp, (state) => ({ value: state.value }));

    const spy = vi.spyOn(comp, "setProps");
    app.setState({ other: 2 }); // "value" hasn't changed

    expect(spy).not.toHaveBeenCalled();
    app.stop();
  });

  it("should apply initial state on connect", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    app.setState({ count: 42 });

    const comp = createComponent({
      id: "counter",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { count: 0 },
      render: (props) => `${props.count}`,
    });

    app.add(comp);
    app.connect(comp, (state) => ({ count: state.count }));

    expect(comp.props.count).toBe(42);
    app.stop();
  });

  it("should disconnect component from store", () => {
    setTerminalDimensions({ getWidth: () => 80, getHeight: () => 24 });
    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    const comp = createComponent({
      id: "test",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { val: 0 },
      render: (props) => `${props.val}`,
    });

    app.add(comp);
    app.setState({ val: 0 });
    app.connect(comp, (state) => ({ val: state.val }));
    app.disconnect("test");

    app.setState({ val: 999 });
    expect(comp.props.val).toBe(0); // not updated

    app.stop();
  });
});
