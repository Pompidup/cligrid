import { describe, it, expect, vi } from "vitest";
import { Checkbox } from "../src/components/checkbox.js";
import type { RenderLine, StyledSegment } from "../src/entities/component.js";

function renderLine(checkbox: Checkbox): RenderLine {
  return checkbox.render() as RenderLine;
}

function getSegments(checkbox: Checkbox): StyledSegment[] {
  return renderLine(checkbox).segments ?? [];
}

function renderText(checkbox: Checkbox): string {
  return getSegments(checkbox).map((s) => s.text).join("");
}

function keyEvent(key: string) {
  return { key, ctrl: false, shift: false, meta: false, raw: Buffer.from("") };
}

describe("Checkbox", () => {
  it("should render unchecked state", () => {
    const cb = new Checkbox({
      id: "cb1",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { checked: false, label: "Accept" },
    });

    const text = renderText(cb);
    expect(text).toBe("[ ] Accept");
  });

  it("should render checked state with checkmark", () => {
    const cb = new Checkbox({
      id: "cb2",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { checked: true, label: "Accept" },
    });

    const text = renderText(cb);
    expect(text).toBe("[✓] Accept");
  });

  it("should style the checkmark as bold green", () => {
    const cb = new Checkbox({
      id: "cb3",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { checked: true, label: "Terms" },
    });

    const segments = getSegments(cb);
    const checkSegment = segments.find((s) => s.text === "✓");
    expect(checkSegment?.style?.bold).toBe(true);
    expect(checkSegment?.style?.fg).toBe("green");
  });

  it("should toggle on space key", () => {
    const cb = new Checkbox({
      id: "cb4",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { checked: false, label: "Option" },
    });

    cb.emit("keypress", keyEvent(" "));
    expect(cb.props.checked).toBe(true);

    cb.emit("keypress", keyEvent(" "));
    expect(cb.props.checked).toBe(false);
  });

  it("should toggle on enter key", () => {
    const cb = new Checkbox({
      id: "cb5",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { checked: false, label: "Option" },
    });

    cb.emit("keypress", keyEvent("enter"));
    expect(cb.props.checked).toBe(true);
  });

  it("should call onChange callback with new value", () => {
    const onChange = vi.fn();
    const cb = new Checkbox({
      id: "cb6",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { checked: false, label: "Notify" },
      onChange,
    });

    cb.emit("keypress", keyEvent(" "));
    expect(onChange).toHaveBeenCalledWith(true);

    cb.emit("keypress", keyEvent(" "));
    expect(onChange).toHaveBeenCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("should not toggle on other keys", () => {
    const onChange = vi.fn();
    const cb = new Checkbox({
      id: "cb7",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { checked: false, label: "Option" },
      onChange,
    });

    cb.emit("keypress", keyEvent("a"));
    cb.emit("keypress", keyEvent("up"));
    cb.emit("keypress", keyEvent("tab"));
    expect(cb.props.checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should update render after toggle", () => {
    const cb = new Checkbox({
      id: "cb8",
      position: { x: 0, y: 0 },
      width: 20,
      height: 1,
      props: { checked: false, label: "Toggle me" },
    });

    expect(renderText(cb)).toBe("[ ] Toggle me");
    cb.emit("keypress", keyEvent(" "));
    expect(renderText(cb)).toBe("[✓] Toggle me");
    cb.emit("keypress", keyEvent("enter"));
    expect(renderText(cb)).toBe("[ ] Toggle me");
  });
});
