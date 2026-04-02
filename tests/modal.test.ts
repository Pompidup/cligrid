import { describe, it, expect, vi } from "vitest";
import { Modal } from "../src/components/modal.js";
import type { RenderLine, StyledSegment } from "../src/entities/component.js";

function renderLines(modal: Modal): RenderLine[] {
  return modal.render({ width: 30, height: 10, focused: true, terminalWidth: 80, terminalHeight: 24 }) as RenderLine[];
}

function keyEvent(key: string) {
  return { key, ctrl: false, shift: false, meta: false, raw: Buffer.from("") };
}

describe("Modal", () => {
  it("should render title, body, and buttons", () => {
    const modal = new Modal({
      id: "m1",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        title: "Confirm",
        body: "Are you sure?",
        buttons: [
          { label: "OK", action: () => {} },
          { label: "Cancel", action: () => {} },
        ],
      },
    });

    const lines = renderLines(modal);

    // Title
    expect(lines[0]!.text).toBe("Confirm");
    expect(lines[0]!.style?.bold).toBe(true);
    expect(lines[0]!.align).toBe("center");

    // Empty line
    expect(lines[1]!.text).toBe("");

    // Body
    expect(lines[2]!.text).toBe("Are you sure?");

    // Empty line before buttons
    expect(lines[3]!.text).toBe("");

    // Buttons
    const buttonLine = lines[4]!;
    expect(buttonLine.segments).toBeDefined();
    const btnTexts = buttonLine.segments!.map((s) => s.text).join("");
    expect(btnTexts).toContain("OK");
    expect(btnTexts).toContain("Cancel");
  });

  it("should highlight the selected button with inverse", () => {
    const modal = new Modal({
      id: "m2",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        title: "Test",
        body: "Body",
        buttons: [
          { label: "OK", action: () => {} },
          { label: "Cancel", action: () => {} },
        ],
        selectedButton: 0,
      },
    });

    const lines = renderLines(modal);
    const buttonLine = lines[lines.length - 1]!;
    const okSegment = buttonLine.segments!.find((s) => s.text.includes("OK"));
    const cancelSegment = buttonLine.segments!.find((s) => s.text.includes("Cancel"));

    expect(okSegment?.style?.inverse).toBe(true);
    expect(okSegment?.style?.bold).toBe(true);
    expect(cancelSegment?.style?.inverse).toBeUndefined();
  });

  it("should navigate buttons with left/right keys", () => {
    const modal = new Modal({
      id: "m3",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        title: "Test",
        body: "Body",
        buttons: [
          { label: "OK", action: () => {} },
          { label: "Cancel", action: () => {} },
        ],
      },
    });

    expect(modal.props.selectedButton).toBe(0);

    modal.emit("keypress", keyEvent("right"));
    expect(modal.props.selectedButton).toBe(1);

    modal.emit("keypress", keyEvent("left"));
    expect(modal.props.selectedButton).toBe(0);
  });

  it("should wrap button navigation", () => {
    const modal = new Modal({
      id: "m4",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        title: "Test",
        body: "Body",
        buttons: [
          { label: "A", action: () => {} },
          { label: "B", action: () => {} },
        ],
      },
    });

    // Wrap right
    modal.emit("keypress", keyEvent("right"));
    modal.emit("keypress", keyEvent("right"));
    expect(modal.props.selectedButton).toBe(0);

    // Wrap left
    modal.emit("keypress", keyEvent("left"));
    expect(modal.props.selectedButton).toBe(1);
  });

  it("should call action on enter", () => {
    const okAction = vi.fn();
    const cancelAction = vi.fn();
    const modal = new Modal({
      id: "m5",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        title: "Test",
        body: "Body",
        buttons: [
          { label: "OK", action: okAction },
          { label: "Cancel", action: cancelAction },
        ],
      },
    });

    modal.emit("keypress", keyEvent("enter"));
    expect(okAction).toHaveBeenCalledOnce();
    expect(cancelAction).not.toHaveBeenCalled();
  });

  it("should call last button action on escape", () => {
    const okAction = vi.fn();
    const cancelAction = vi.fn();
    const modal = new Modal({
      id: "m6",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        title: "Test",
        body: "Body",
        buttons: [
          { label: "OK", action: okAction },
          { label: "Cancel", action: cancelAction },
        ],
      },
    });

    modal.emit("keypress", keyEvent("escape"));
    expect(cancelAction).toHaveBeenCalledOnce();
    expect(okAction).not.toHaveBeenCalled();
  });

  it("should handle multi-line body", () => {
    const modal = new Modal({
      id: "m7",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        title: "Info",
        body: "Line 1\nLine 2\nLine 3",
        buttons: [{ label: "OK", action: () => {} }],
      },
    });

    const lines = renderLines(modal);
    // title + empty + 3 body lines + empty + buttons = 7
    expect(lines.length).toBe(7);
    expect(lines[2]!.text).toBe("Line 1");
    expect(lines[3]!.text).toBe("Line 2");
    expect(lines[4]!.text).toBe("Line 3");
  });

  it("should handle no buttons", () => {
    const modal = new Modal({
      id: "m8",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        title: "Info",
        body: "No buttons here",
        buttons: [],
      },
    });

    const lines = renderLines(modal);
    // title + empty + body + empty = 4 (no button line)
    expect(lines.length).toBe(4);
  });

  it("should apply custom button styles", () => {
    const modal = new Modal({
      id: "m9",
      position: { x: 0, y: 0 },
      width: 30,
      height: 10,
      props: {
        title: "Test",
        body: "Body",
        buttons: [
          { label: "Delete", action: () => {}, style: { fg: "red" } },
        ],
      },
    });

    const lines = renderLines(modal);
    const buttonLine = lines[lines.length - 1]!;
    const deleteBtn = buttonLine.segments!.find((s) => s.text.includes("Delete"));
    expect(deleteBtn?.style?.fg).toBe("red");
  });
});
