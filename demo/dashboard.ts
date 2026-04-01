/**
 * Demo 1: Dashboard
 *
 * Showcases: createComponent, SelectList, ProgressBar, relative positioning,
 * percentage sizing, border styles (rounded/single/double), colors, padding,
 * interactive menu with dynamic content updates.
 *
 * Run: pnpm demo:dashboard
 * Recommended terminal size: 80x24 minimum
 */

import {
  App,
  createComponent,
  SelectList,
  ProgressBar,
} from "../src/index.js";

const app = new App({ alternateScreen: true });

// ── Page content data ─────────────────────────────────────────────────
type PageContent = { title: string; lines: { text: string; style?: any }[] };

const pages: Record<string, PageContent> = {
  Overview: {
    title: "System Overview",
    lines: [
      { text: "Status:   All systems operational", style: { fg: "green" } },
      { text: "Uptime:   42 days 7 hours 13 minutes" },
      { text: "Hostname: cligrid-demo-host" },
      { text: "Kernel:   6.8.0-generic" },
    ],
  },
  Metrics: {
    title: "Performance Metrics",
    lines: [
      { text: "Requests/s:  1,247" },
      { text: "Avg latency: 23ms", style: { fg: "green" } },
      { text: "P99 latency: 142ms", style: { fg: "yellow" } },
      { text: "Error rate:  0.02%" },
    ],
  },
  Alerts: {
    title: "Active Alerts",
    lines: [
      { text: "WARN  Disk usage above 85%", style: { fg: "yellow" } },
      { text: "INFO  Scheduled backup at 03:00", style: { fg: "cyan" } },
      { text: "OK    All health checks passing", style: { fg: "green" } },
      { text: "OK    SSL certificates valid", style: { fg: "green" } },
    ],
  },
  Settings: {
    title: "Settings",
    lines: [
      { text: "Theme:       dark" },
      { text: "Refresh:     5s" },
      { text: "Timezone:    UTC+1" },
      { text: "Notifications: enabled", style: { fg: "green" } },
    ],
  },
};

// ── Header ────────────────────────────────────────────────────────────
const header = createComponent({
  id: "header",
  position: { x: 0, y: 0 },
  width: "100%",
  height: 3,
  margin: 0,
  style: {
    border: { style: "rounded", fg: "cyan" },
    fg: "cyan",
    bold: true,
    padding: { left: 2 },
  },
  props: {},
  render: () => "System Dashboard — cligrid demo",
});

// ── Sidebar (interactive SelectList) ─────────────────────────────────
const sidebar = new SelectList({
  id: "sidebar",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "header" },
  },
  width: 24,
  height: 20,
  margin: 0,
  props: {
    items: ["Overview", "Metrics", "Alerts", "Settings"],
    selectedIndex: 0,
  },
  style: {
    border: { style: "single", fg: "green" },
    fg: "green",
    padding: { left: 1, top: 1 },
  },
  onSelect: (_idx, item) => {
    const page = pages[item];
    if (page) {
      mainPanel.setProps({ page });
    }
  },
});

// ── Main panel ────────────────────────────────────────────────────────
const mainPanel = createComponent({
  id: "main",
  position: {
    x: { position: "right", relativeTo: "sidebar" },
    y: { position: "bottom", relativeTo: "header" },
  },
  width: "60%",
  height: 8,
  margin: 0,
  style: {
    border: { style: "double", fg: "yellow" },
    fg: "white",
    padding: { left: 2, top: 1 },
  },
  props: { page: pages["Overview"]! },
  render: (props: { page: PageContent }) => [
    { text: props.page.title, style: { bold: true, underline: true } },
    { text: "" },
    ...props.page.lines,
  ],
});

// ── Progress bars ─────────────────────────────────────────────────────
const cpuBar = new ProgressBar({
  id: "cpu",
  position: {
    x: { position: "right", relativeTo: "sidebar" },
    y: { position: "bottom", relativeTo: "main" },
  },
  width: "60%",
  height: 3,
  margin: 0,
  props: { value: 0.72, label: "CPU" },
  style: {
    border: { style: "single", fg: "magenta" },
    fg: "magenta",
    padding: { left: 2 },
  },
});

const memBar = new ProgressBar({
  id: "mem",
  position: {
    x: { position: "right", relativeTo: "sidebar" },
    y: { position: "bottom", relativeTo: "cpu" },
  },
  width: "60%",
  height: 3,
  margin: 0,
  props: { value: 0.45, label: "MEM" },
  style: {
    border: { style: "single", fg: "blue" },
    fg: "blue",
    padding: { left: 2 },
  },
});

const dskBar = new ProgressBar({
  id: "dsk",
  position: {
    x: { position: "right", relativeTo: "sidebar" },
    y: { position: "bottom", relativeTo: "mem" },
  },
  width: "60%",
  height: 3,
  margin: 0,
  props: { value: 0.89, label: "DSK" },
  style: {
    border: { style: "single", fg: "red" },
    fg: "red",
    padding: { left: 2 },
  },
});

// ── Footer ────────────────────────────────────────────────────────────
const footer = createComponent({
  id: "footer",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "sidebar" },
  },
  width: "100%",
  height: 1,
  margin: 0,
  props: {},
  render: () => ({
    text: "  Up/Down: navigate | Enter: select | Ctrl+C: quit",
    style: { dim: true },
  }),
});

// ── App setup ─────────────────────────────────────────────────────────
app
  .add(header)
  .add(sidebar, true) // focusable for keyboard navigation
  .add(mainPanel)
  .add(cpuBar)
  .add(memBar)
  .add(dskBar)
  .add(footer);

app.onKey("ctrl+c", () => {
  app.stop();
  process.exit(0);
});

app.start();
