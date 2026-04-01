/**
 * Demo 3: Advanced Features
 *
 * Showcases: reactive state store (setState / connect), scrollable content,
 * overlays (showOverlay / hideOverlay), z-index, live updates via setInterval.
 *
 * Run: pnpm demo:advanced
 * Recommended terminal size: 80x24 minimum
 */

import { App, createComponent, ProgressBar } from "../src/index.js";

const app = new App({ alternateScreen: true });

// ── Reactive state ────────────────────────────────────────────────────
app.setState({ counter: 0, progress: 0 });

// ── Header (connected to state) ──────────────────────────────────────
const header = createComponent({
  id: "header",
  position: { x: 0, y: 0 },
  width: "100%",
  height: 3,
  margin: 0,
  style: {
    border: { style: "double", fg: "cyan" },
    fg: "cyan",
    bold: true,
    padding: { left: 2 },
  },
  props: { counter: 0 },
  render: (props: { counter: number }) =>
    `Advanced Demo  |  Counter: ${props.counter}s`,
});

app.add(header);
app.connect(header, (state) => ({ counter: state.counter }));

// ── Scrollable content area ──────────────────────────────────────────
const scrollContent = createComponent({
  id: "scroll-area",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "header" },
  },
  width: "50%",
  height: 17,
  margin: 0,
  scrollable: true,
  style: {
    border: { style: "single", fg: "green" },
    fg: "white",
    padding: { left: 1 },
  },
  props: {},
  render: () => {
    const lines: { text: string; style?: any }[] = [
      { text: "Scrollable Content (Up/Down)", style: { bold: true, underline: true } },
      { text: "" },
    ];
    for (let i = 1; i <= 50; i++) {
      lines.push({
        text: `Line ${String(i).padStart(2, "0")}: Lorem ipsum dolor sit amet`,
      });
    }
    return lines;
  },
});

app.add(scrollContent, true);

// ── Timer display (connected to state) ───────────────────────────────
const timer = createComponent({
  id: "timer",
  position: {
    x: { position: "right", relativeTo: "scroll-area" },
    y: { position: "bottom", relativeTo: "header" },
  },
  width: "50%",
  height: 6,
  margin: 0,
  style: {
    border: { style: "rounded", fg: "yellow" },
    fg: "yellow",
    padding: { left: 2, top: 1 },
  },
  props: { counter: 0 },
  render: (props: { counter: number }) => [
    { text: "Live Counter", style: { bold: true } },
    { text: "" },
    { text: `Elapsed: ${props.counter} seconds` },
  ],
});

app.add(timer);
app.connect(timer, (state) => ({ counter: state.counter }));

// ── Progress bar (connected to state) ────────────────────────────────
const progressBar = new ProgressBar({
  id: "progress",
  position: {
    x: { position: "right", relativeTo: "scroll-area" },
    y: { position: "bottom", relativeTo: "timer" },
  },
  width: "50%",
  height: 3,
  margin: 0,
  props: { value: 0, label: "Progress" },
  style: {
    border: { style: "single", fg: "magenta" },
    fg: "magenta",
    padding: { left: 2 },
  },
});

app.add(progressBar);
app.connect(progressBar, (state) => ({ value: state.progress }));

// ── Info panel ───────────────────────────────────────────────────────
const infoPanel = createComponent({
  id: "info",
  position: {
    x: { position: "right", relativeTo: "scroll-area" },
    y: { position: "bottom", relativeTo: "progress" },
  },
  width: "50%",
  height: 8,
  margin: 0,
  style: {
    border: { style: "single", fg: "white" },
    fg: "white",
    padding: { left: 2, top: 1 },
    dim: true,
  },
  props: {},
  render: () => [
    { text: "Features demonstrated:" },
    { text: "• Reactive state store" },
    { text: "• Scrollable content (left)" },
    { text: "• Overlay modal (press 'o')" },
    { text: "• Live progress bar" },
  ],
});

app.add(infoPanel);

// ── Status bar ───────────────────────────────────────────────────────
const statusBar = createComponent({
  id: "status",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "scroll-area" },
  },
  width: "100%",
  height: 1,
  margin: 0,
  props: {},
  render: () => ({
    text: "  Up/Down: scroll | o: toggle overlay | r: reset counter | Ctrl+C: quit",
    style: { dim: true },
  }),
});

app.add(statusBar);

// ── Overlay modal (shown/hidden on demand) ───────────────────────────
const modal = createComponent({
  id: "modal",
  position: { x: 10, y: 5 },
  width: 50,
  height: 10,
  margin: 0,
  zIndex: 100,
  style: {
    border: { style: "double", fg: "red" },
    fg: "white",
    bg: "black",
    padding: { left: 3, top: 1 },
  },
  props: {},
  render: () => [
    { text: "OVERLAY MODAL", style: { bold: true, fg: "red" } },
    { text: "" },
    { text: "This is rendered on top of everything." },
    { text: "It uses z-index 100 + showOverlay()." },
    { text: "" },
    { text: "Focus is saved and restored" },
    { text: "when the overlay is hidden." },
    { text: "Press 'o' to close.", style: { dim: true } },
  ],
});

// ── Timer interval ───────────────────────────────────────────────────
const intervalId = setInterval(() => {
  const current = app.state;
  const newCounter = current.counter + 1;
  const newProgress = Math.min(1, newCounter / 30);
  app.setState({ counter: newCounter, progress: newProgress });
}, 1000);

// ── Key handlers ─────────────────────────────────────────────────────
let overlayVisible = false;

app.onKey("o", () => {
  if (overlayVisible) {
    app.hideOverlay(modal);
  } else {
    app.showOverlay(modal);
  }
  overlayVisible = !overlayVisible;
});

app.onKey("r", () => {
  app.setState({ counter: 0, progress: 0 });
});

app.onKey("ctrl+c", () => {
  clearInterval(intervalId);
  app.stop();
  process.exit(0);
});

app.start();
