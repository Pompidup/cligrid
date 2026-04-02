import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "../src/entities/app.js";
import { createComponent } from "../src/entities/createComponent.js";
import { linear } from "../src/utils/easing.js";

describe("App animation integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("app.animate() interpolates component props", () => {
    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    const component = createComponent({
      id: "anim-test",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      props: { value: 0 },
      render: (props) => `${props.value}`,
    });

    app.add(component);

    app.animate(component, { value: 100 }, { duration: 1000, easing: linear });

    vi.advanceTimersByTime(500);
    const midValue = (component.props as any).value;
    expect(midValue).toBeGreaterThan(30);
    expect(midValue).toBeLessThan(70);

    vi.advanceTimersByTime(600);
    expect((component.props as any).value).toBe(100);
  });

  it("app.animate() calls onComplete", () => {
    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    const component = createComponent({
      id: "anim-complete",
      position: { x: 0, y: 0 },
      width: 10,
      height: 1,
      props: { value: 0 },
      render: (props) => `${props.value}`,
    });

    app.add(component);

    const onComplete = vi.fn();
    app.animate(component, { value: 50 }, { duration: 300, onComplete });

    vi.advanceTimersByTime(400);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("app.tick() fires callback each frame", () => {
    const app = new App({
      terminalDimensions: { getWidth: () => 80, getHeight: () => 24 },
    });

    const cb = vi.fn();
    const unsub = app.tick(cb);

    vi.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalled();
    expect(cb.mock.calls[0]![0]).toBeGreaterThan(0);

    unsub();
    const callCount = cb.mock.calls.length;
    vi.advanceTimersByTime(200);
    expect(cb.mock.calls.length).toBe(callCount);
  });
});
