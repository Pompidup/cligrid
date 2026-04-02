import { describe, it, expect, vi } from "vitest";
import { Tabs } from "../src/components/tabs.js";
import type { RenderLine, StyledSegment } from "../src/entities/component.js";

function renderLine(tabs: Tabs): RenderLine {
  return tabs.render() as RenderLine;
}

function getSegments(tabs: Tabs): StyledSegment[] {
  return renderLine(tabs).segments ?? [];
}

const testTabs = [
  { label: "Home", id: "home" },
  { label: "Settings", id: "settings" },
  { label: "About", id: "about" },
];

describe("Tabs", () => {
  it("should render all tabs with separators", () => {
    const tabs = new Tabs({
      id: "t1",
      position: { x: 0, y: 0 },
      width: 40,
      height: 1,
      props: { tabs: testTabs, activeTab: "home" },
    });

    const segments = getSegments(tabs);
    const text = segments.map((s) => s.text).join("");
    expect(text).toContain("Home");
    expect(text).toContain("Settings");
    expect(text).toContain("About");
    expect(text).toContain("│");
  });

  it("should style the active tab as bold+underline", () => {
    const tabs = new Tabs({
      id: "t2",
      position: { x: 0, y: 0 },
      width: 40,
      height: 1,
      props: { tabs: testTabs, activeTab: "settings" },
    });

    const segments = getSegments(tabs);
    const activeSegment = segments.find((s) => s.text.includes("Settings"));
    expect(activeSegment?.style?.bold).toBe(true);
    expect(activeSegment?.style?.underline).toBe(true);
  });

  it("should style inactive tabs as dim", () => {
    const tabs = new Tabs({
      id: "t3",
      position: { x: 0, y: 0 },
      width: 40,
      height: 1,
      props: { tabs: testTabs, activeTab: "home" },
    });

    const segments = getSegments(tabs);
    const inactiveSegment = segments.find((s) => s.text.includes("Settings"));
    expect(inactiveSegment?.style?.dim).toBe(true);
  });

  it("should navigate right with keyboard", () => {
    const tabs = new Tabs({
      id: "t4",
      position: { x: 0, y: 0 },
      width: 40,
      height: 1,
      props: { tabs: testTabs, activeTab: "home" },
    });

    tabs.emit("keypress", { key: "right", ctrl: false, shift: false, meta: false, raw: Buffer.from("") });
    expect(tabs.props.activeTab).toBe("settings");

    tabs.emit("keypress", { key: "right", ctrl: false, shift: false, meta: false, raw: Buffer.from("") });
    expect(tabs.props.activeTab).toBe("about");
  });

  it("should navigate left with keyboard", () => {
    const tabs = new Tabs({
      id: "t5",
      position: { x: 0, y: 0 },
      width: 40,
      height: 1,
      props: { tabs: testTabs, activeTab: "settings" },
    });

    tabs.emit("keypress", { key: "left", ctrl: false, shift: false, meta: false, raw: Buffer.from("") });
    expect(tabs.props.activeTab).toBe("home");
  });

  it("should wrap around right to first tab", () => {
    const tabs = new Tabs({
      id: "t6",
      position: { x: 0, y: 0 },
      width: 40,
      height: 1,
      props: { tabs: testTabs, activeTab: "about" },
    });

    tabs.emit("keypress", { key: "right", ctrl: false, shift: false, meta: false, raw: Buffer.from("") });
    expect(tabs.props.activeTab).toBe("home");
  });

  it("should wrap around left to last tab", () => {
    const tabs = new Tabs({
      id: "t7",
      position: { x: 0, y: 0 },
      width: 40,
      height: 1,
      props: { tabs: testTabs, activeTab: "home" },
    });

    tabs.emit("keypress", { key: "left", ctrl: false, shift: false, meta: false, raw: Buffer.from("") });
    expect(tabs.props.activeTab).toBe("about");
  });

  it("should call onTabChange callback", () => {
    const callback = vi.fn();
    const tabs = new Tabs({
      id: "t8",
      position: { x: 0, y: 0 },
      width: 40,
      height: 1,
      props: { tabs: testTabs, activeTab: "home" },
      onTabChange: callback,
    });

    tabs.emit("keypress", { key: "right", ctrl: false, shift: false, meta: false, raw: Buffer.from("") });
    expect(callback).toHaveBeenCalledWith("settings");
  });

  it("should handle single tab", () => {
    const tabs = new Tabs({
      id: "t9",
      position: { x: 0, y: 0 },
      width: 40,
      height: 1,
      props: { tabs: [{ label: "Only", id: "only" }], activeTab: "only" },
    });

    const segments = getSegments(tabs);
    expect(segments.length).toBe(1);
    expect(segments[0]!.text).toContain("Only");
    expect(segments[0]!.style?.bold).toBe(true);
  });
});
