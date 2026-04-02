import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Animator } from "../src/entities/animator.js";
import { linear, easeIn } from "../src/utils/easing.js";

describe("Animator", () => {
  let animator: Animator;

  beforeEach(() => {
    vi.useFakeTimers();
    animator = new Animator();
  });

  afterEach(() => {
    animator.destroy();
    vi.useRealTimers();
  });

  it("calls onUpdate with interpolated values over time", () => {
    const values: number[] = [];
    animator.animate({
      from: 0,
      to: 100,
      duration: 1000,
      easing: linear,
      onUpdate: (v) => values.push(v),
    });

    vi.advanceTimersByTime(500);
    expect(values.length).toBeGreaterThan(0);
    // Last value should be around 50 (roughly half)
    const lastMidValue = values[values.length - 1]!;
    expect(lastMidValue).toBeGreaterThan(30);
    expect(lastMidValue).toBeLessThan(70);
  });

  it("calls onComplete when animation finishes", () => {
    const onComplete = vi.fn();
    animator.animate({
      from: 0,
      to: 100,
      duration: 500,
      onUpdate: () => {},
      onComplete,
    });

    vi.advanceTimersByTime(600);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("delivers final value (to) on completion", () => {
    const values: number[] = [];
    animator.animate({
      from: 0,
      to: 100,
      duration: 500,
      onUpdate: (v) => values.push(v),
    });

    vi.advanceTimersByTime(600);
    expect(values[values.length - 1]).toBe(100);
  });

  it("cancel stops updates", () => {
    const values: number[] = [];
    const id = animator.animate({
      from: 0,
      to: 100,
      duration: 1000,
      onUpdate: (v) => values.push(v),
    });

    vi.advanceTimersByTime(200);
    const countBefore = values.length;
    animator.cancel(id);
    vi.advanceTimersByTime(500);
    expect(values.length).toBe(countBefore);
  });

  it("destroy clears all animations", () => {
    const onComplete = vi.fn();
    animator.animate({
      from: 0,
      to: 100,
      duration: 1000,
      onUpdate: () => {},
      onComplete,
    });

    animator.destroy();
    vi.advanceTimersByTime(2000);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("supports multiple concurrent animations", () => {
    const values1: number[] = [];
    const values2: number[] = [];

    animator.animate({
      from: 0,
      to: 100,
      duration: 500,
      onUpdate: (v) => values1.push(v),
    });

    animator.animate({
      from: 200,
      to: 300,
      duration: 500,
      onUpdate: (v) => values2.push(v),
    });

    vi.advanceTimersByTime(600);
    expect(values1[values1.length - 1]).toBe(100);
    expect(values2[values2.length - 1]).toBe(300);
  });

  it("uses custom easing function", () => {
    const values: number[] = [];
    animator.animate({
      from: 0,
      to: 100,
      duration: 1000,
      easing: easeIn,
      onUpdate: (v) => values.push(v),
    });

    vi.advanceTimersByTime(1100);
    expect(values[values.length - 1]).toBe(100);
  });

  it("onTick fires each frame", () => {
    const cb = vi.fn();
    animator.onTick(cb);

    vi.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalled();
    expect(cb.mock.calls[0]![0]).toBeGreaterThan(0); // dt > 0
  });

  it("onTick unsubscribe stops callbacks", () => {
    const cb = vi.fn();
    const unsub = animator.onTick(cb);

    vi.advanceTimersByTime(50);
    const callsBefore = cb.mock.calls.length;
    unsub();
    vi.advanceTimersByTime(200);
    expect(cb.mock.calls.length).toBe(callsBefore);
  });

  it("onFrame callback fires after updates", () => {
    const onFrame = vi.fn();
    animator.onFrame(onFrame);
    animator.animate({
      from: 0,
      to: 100,
      duration: 500,
      onUpdate: () => {},
    });

    vi.advanceTimersByTime(100);
    expect(onFrame).toHaveBeenCalled();
  });
});
