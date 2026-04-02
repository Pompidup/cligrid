/**
 * Demo 5: Styled Segments & Text Alignment
 *
 * Showcases: StyledSegment (per-segment styling within a line),
 * TextAlign (left/center/right alignment), segment overflow/truncation,
 * line-level bg as base style for segments.
 *
 * Run: pnpm demo:segments
 * Recommended terminal size: 80x24 minimum
 */

import { App, createComponent } from "../src/index.js";

const app = new App({ alternateScreen: true });

// ── Header ────────────────────────────────────────────────────────────
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
  },
  props: {},
  render: () => ({
    text: "Styled Segments & Text Alignment",
    align: "center" as const,
  }),
});

// ── Panel 1: Color Palette (segments on single lines) ─────────────────
const colorPalette = createComponent({
  id: "palette",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "header" },
  },
  width: "40%",
  height: 9,
  margin: 0,
  style: {
    border: { style: "rounded", fg: "white" },
    fg: "white",
    padding: { left: 1, top: 1 },
  },
  props: {},
  render: () => [
    { text: "Color Palette", style: { bold: true, underline: true } },
    { text: "" },
    {
      text: "",
      segments: [
        { text: " RED ", style: { bg: "red", fg: "white", bold: true } },
        { text: " " },
        { text: " GRN ", style: { bg: "green", fg: "black", bold: true } },
        { text: " " },
        { text: " BLU ", style: { bg: "blue", fg: "white", bold: true } },
        { text: " " },
        { text: " YEL ", style: { bg: "yellow", fg: "black", bold: true } },
        { text: " " },
        { text: " MAG ", style: { bg: "magenta", fg: "white", bold: true } },
      ],
    },
    { text: "" },
    {
      text: "",
      segments: [
        { text: " CYN ", style: { bg: "cyan", fg: "black", bold: true } },
        { text: " " },
        { text: " WHT ", style: { bg: "white", fg: "black", bold: true } },
        { text: " " },
        { text: " dim ", style: { bg: "brightBlack", fg: "white", dim: true } },
        { text: " " },
        { text: " BLD ", style: { bg: "white", fg: "black", bold: true } },
        { text: " " },
        { text: " UND ", style: { bg: "white", fg: "black", underline: true } },
      ],
    },
    { text: "" },
    {
      text: "",
      segments: [
        { text: "Hex: ", style: { dim: true } },
        { text: "#FF6B6B", style: { fg: "#FF6B6B", bold: true } },
        { text: " " },
        { text: "#4ECDC4", style: { fg: "#4ECDC4", bold: true } },
        { text: " " },
        { text: "#FFE66D", style: { fg: "#FFE66D", bold: true } },
      ],
    },
  ],
});

// ── Panel 2: Log Output (mixed styles / syntax highlighting) ──────────
const logOutput = createComponent({
  id: "logs",
  position: {
    x: { position: "right", relativeTo: "palette" },
    y: { position: "bottom", relativeTo: "header" },
  },
  width: "60%",
  height: 9,
  margin: 0,
  style: {
    border: { style: "single", fg: "green" },
    fg: "white",
    padding: { left: 1, top: 1 },
  },
  props: {},
  render: () => [
    { text: "Application Logs", style: { bold: true, underline: true } },
    { text: "" },
    {
      text: "",
      segments: [
        { text: " INFO ", style: { bg: "blue", fg: "white", bold: true } },
        { text: " Server started on ", style: { fg: "white" } },
        { text: ":3000", style: { fg: "cyan", bold: true } },
      ],
    },
    {
      text: "",
      segments: [
        { text: " WARN ", style: { bg: "yellow", fg: "black", bold: true } },
        { text: " Memory usage at ", style: { fg: "white" } },
        { text: "87%", style: { fg: "yellow", bold: true } },
      ],
    },
    {
      text: "",
      segments: [
        { text: " ERR  ", style: { bg: "red", fg: "white", bold: true } },
        { text: " Connection timeout after ", style: { fg: "white" } },
        { text: "30s", style: { fg: "red", bold: true } },
      ],
    },
    {
      text: "",
      segments: [
        { text: " OK   ", style: { bg: "green", fg: "black", bold: true } },
        { text: " All health checks ", style: { fg: "white" } },
        { text: "passing", style: { fg: "green", bold: true } },
      ],
    },
  ],
});

// ── Panel 3: Text Alignment ───────────────────────────────────────────
const alignment = createComponent({
  id: "alignment",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "palette" },
  },
  width: "40%",
  height: 10,
  margin: 0,
  style: {
    border: { style: "rounded", fg: "yellow" },
    fg: "white",
    padding: { left: 1, right: 1, top: 1 },
  },
  props: {},
  render: () => [
    {
      text: "Text Alignment",
      style: { bold: true, underline: true },
      align: "center" as const,
    },
    { text: "" },
    { text: "Left-aligned (default)", align: "left" as const },
    {
      text: "Center-aligned",
      align: "center" as const,
      style: { fg: "yellow" },
    },
    {
      text: "Right-aligned",
      align: "right" as const,
      style: { fg: "cyan" },
    },
    { text: "" },
    { text: "Name: cligrid", align: "left" as const },
    { text: "v1.0.3", align: "right" as const, style: { dim: true } },
  ],
});

// ── Panel 4: Segments + Alignment Combined ────────────────────────────
const combined = createComponent({
  id: "combined",
  position: {
    x: { position: "right", relativeTo: "alignment" },
    y: { position: "bottom", relativeTo: "logs" },
  },
  width: "60%",
  height: 10,
  margin: 0,
  style: {
    border: { style: "single", fg: "magenta" },
    fg: "white",
    padding: { left: 1, right: 1, top: 1 },
  },
  props: {},
  render: () => [
    {
      text: "Segments + Alignment",
      style: { bold: true, underline: true },
      align: "center" as const,
    },
    { text: "" },
    {
      text: "",
      align: "center" as const,
      segments: [
        { text: " OK ", style: { bg: "green", fg: "black", bold: true } },
        { text: "  " },
        { text: " WARN ", style: { bg: "yellow", fg: "black", bold: true } },
        { text: "  " },
        { text: " ERR ", style: { bg: "red", fg: "white", bold: true } },
      ],
    },
    {
      text: "",
      align: "center" as const,
      segments: [
        { text: "Status: ", style: { dim: true } },
        { text: "Online", style: { fg: "green", bold: true } },
      ],
    },
    {
      text: "",
      align: "right" as const,
      segments: [
        { text: "updated ", style: { dim: true } },
        { text: new Date().toLocaleTimeString(), style: { fg: "cyan" } },
        { text: " " },
      ],
    },
    { text: "" },
    {
      text: "",
      style: { bg: "brightBlack" },
      align: "left" as const,
      segments: [
        { text: " Line bg ", style: { fg: "white", bold: true } },
        { text: "applies to ", style: { fg: "yellow" } },
        { text: "all segments ", style: { fg: "cyan" } },
      ],
    },
  ],
});

// ── Panel 5: Overflow Truncation ──────────────────────────────────────
const overflow = createComponent({
  id: "overflow",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "alignment" },
  },
  width: "100%",
  height: 5,
  margin: 0,
  style: {
    border: { style: "single", fg: "red" },
    fg: "white",
    padding: { left: 1, top: 1 },
    overflow: "ellipsis",
  },
  props: {},
  render: () => [
    { text: "Segment Overflow (ellipsis)", style: { bold: true, underline: true } },
    {
      text: "",
      segments: [
        { text: "This is a very long line with ", style: { fg: "white" } },
        { text: "RED segment ", style: { fg: "red", bold: true } },
        { text: "then GREEN segment ", style: { fg: "green", bold: true } },
        { text: "then BLUE segment ", style: { fg: "blue", bold: true } },
        { text: "then YELLOW segment ", style: { fg: "yellow", bold: true } },
        { text: "then MAGENTA segment ", style: { fg: "magenta", bold: true } },
        {
          text: "that keeps going and going to demonstrate truncation across segment boundaries",
          style: { fg: "cyan" },
        },
      ],
    },
  ],
});

// ── Footer ────────────────────────────────────────────────────────────
const footer = createComponent({
  id: "footer",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "overflow" },
  },
  width: "100%",
  height: 1,
  margin: 0,
  props: {},
  render: () => ({
    text: "  Ctrl+C: quit",
    style: { dim: true },
  }),
});

// ── App setup ─────────────────────────────────────────────────────────
app
  .add(header)
  .add(colorPalette)
  .add(logOutput)
  .add(alignment)
  .add(combined)
  .add(overflow)
  .add(footer);

app.onKey("ctrl+c", () => {
  app.stop();
  process.exit(0);
});

app.start();
