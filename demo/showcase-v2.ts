/**
 * Demo: v2 Showcase
 *
 * Showcases all v2 features in a single dashboard:
 * - Table with data
 * - Tabs for navigation
 * - Spinner during loading
 * - Modal confirmation dialog
 * - Checkbox toggles
 * - Animation system
 * - Color gradients
 * - Theme system
 * - Emoji / Unicode support
 * - Mouse support
 * - Focus visible (focusStyle)
 *
 * Run: pnpm demo:showcase
 * Recommended terminal size: 100x30 minimum
 */

import {
  App,
  createComponent,
  Table,
  Tabs,
  Spinner,
  Modal,
  Checkbox,
  ProgressBar,
  darkTheme,
  gradient,
  easeOut,
} from "../src/index.js";

const app = new App({ alternateScreen: true, mouse: true });
app.setTheme(darkTheme);

// ── Header with gradient title ───────────────────────────────────────
const titleGradient = gradient("#5B9BD5", "#AF52DE", 20);
const titleChars = "  cligrid v2 — Showcase 🚀".split("");
const header = createComponent({
  id: "header",
  position: { x: 0, y: 0 },
  width: "100%",
  height: 3,
  margin: 0,
  style: {
    border: { style: "rounded", fg: "primary" },
    padding: { left: 1 },
  },
  props: {},
  render: () => ({
    text: "",
    segments: titleChars.map((ch, i) => ({
      text: ch,
      style: { fg: titleGradient[i % titleGradient.length], bold: true },
    })),
  }),
});

// ── Tabs ─────────────────────────────────────────────────────────────
const tabs = new Tabs({
  id: "tabs",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "header" },
  },
  width: "100%",
  height: 1,
  margin: 0,
  props: {
    tabs: [
      { label: "📊 Data", id: "data" },
      { label: "⚙️ Settings", id: "settings" },
      { label: "📈 Metrics", id: "metrics" },
    ],
    activeTab: "data",
  },
  focusStyle: { fg: "yellow" },
  onTabChange: (id) => {
    dataTable.setProps({
      ...dataTable.props,
      rows: id === "data" ? dataRows : id === "settings" ? settingsRows : metricsRows,
    });
    dataTable.setProps({
      ...dataTable.props,
      columns: id === "metrics" ? metricsColumns : id === "settings" ? settingsColumns : dataColumns,
    });
  },
});

// ── Table data ───────────────────────────────────────────────────────
const dataColumns = [
  { key: "name", label: "Name", width: 20 },
  { key: "status", label: "Status", width: 12 },
  { key: "region", label: "Region", width: 15 },
  { key: "latency", label: "Latency", width: 10, align: "right" as const },
];

const dataRows = [
  { name: "api-gateway", status: "✅ Running", region: "us-east-1", latency: "12ms" },
  { name: "auth-service", status: "✅ Running", region: "eu-west-1", latency: "23ms" },
  { name: "db-primary", status: "✅ Running", region: "us-east-1", latency: "5ms" },
  { name: "cache-node", status: "⚠️ Degraded", region: "ap-south-1", latency: "89ms" },
  { name: "worker-pool", status: "✅ Running", region: "us-west-2", latency: "34ms" },
  { name: "cdn-edge", status: "✅ Running", region: "global", latency: "2ms" },
  { name: "search-index", status: "🔄 Updating", region: "eu-west-1", latency: "156ms" },
];

const settingsColumns = [
  { key: "key", label: "Setting", width: 25 },
  { key: "value", label: "Value", width: 20 },
  { key: "desc", label: "Description", width: 30 },
];

const settingsRows = [
  { key: "theme", value: "dark", desc: "UI color theme" },
  { key: "refresh_rate", value: "5s", desc: "Dashboard refresh interval" },
  { key: "timezone", value: "UTC+1", desc: "Display timezone" },
  { key: "notifications", value: "enabled", desc: "Alert notifications" },
];

const metricsColumns = [
  { key: "metric", label: "Metric", width: 25 },
  { key: "current", label: "Current", width: 15, align: "right" as const },
  { key: "avg", label: "Avg (24h)", width: 15, align: "right" as const },
];

const metricsRows = [
  { metric: "Requests/sec", current: "1,247", avg: "982" },
  { metric: "Avg latency", current: "23ms", avg: "31ms" },
  { metric: "Error rate", current: "0.02%", avg: "0.05%" },
  { metric: "Active connections", current: "3,891", avg: "2,450" },
  { metric: "CPU usage", current: "72%", avg: "58%" },
  { metric: "Memory usage", current: "4.2GB", avg: "3.8GB" },
];

const dataTable = new Table({
  id: "table",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "tabs" },
  },
  width: "70%",
  height: 12,
  margin: 0,
  scrollable: true,
  style: {
    border: { style: "single", fg: "border" },
    padding: { left: 1, top: 0 },
    fg: "text",
  },
  focusStyle: { border: { style: "single", fg: "primary" } },
  props: {
    columns: dataColumns,
    rows: dataRows,
  },
});

// ── Sidebar: Spinner + Checkboxes + Progress ─────────────────────────
const spinner = new Spinner({
  id: "spinner",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "tabs" },
  },
  width: "30%",
  height: 3,
  margin: 0,
  style: {
    border: { style: "rounded", fg: "accent" },
    fg: "accent",
    padding: { left: 1 },
  },
  props: { label: "Syncing data...", style: "dots" },
});

const checkbox1 = new Checkbox({
  id: "chk-auto",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "spinner" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { padding: { left: 2 } },
  props: { checked: true, label: "Auto-refresh" },
  focusStyle: { fg: "yellow" },
});

const checkbox2 = new Checkbox({
  id: "chk-notify",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "chk-auto" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { padding: { left: 2 } },
  props: { checked: false, label: "Notifications" },
  focusStyle: { fg: "yellow" },
});

const progressBar = new ProgressBar({
  id: "progress",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "chk-notify" },
  },
  width: "30%",
  height: 3,
  margin: 0,
  style: {
    border: { style: "single", fg: "success" },
    fg: "success",
    padding: { left: 1 },
  },
  props: { value: 0.72, label: "Health" },
});

// ── Footer ───────────────────────────────────────────────────────────
const footer = createComponent({
  id: "footer",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "table" },
  },
  width: "100%",
  height: 1,
  margin: 0,
  props: {},
  render: () => ({
    text: "",
    segments: [
      { text: " Tab", style: { bold: true, fg: "cyan" } },
      { text: ":focus  " },
      { text: "←→", style: { bold: true, fg: "cyan" } },
      { text: ":tabs  " },
      { text: "↑↓", style: { bold: true, fg: "cyan" } },
      { text: ":scroll  " },
      { text: "Space", style: { bold: true, fg: "cyan" } },
      { text: ":toggle  " },
      { text: "m", style: { bold: true, fg: "cyan" } },
      { text: ":modal  " },
      { text: "Ctrl+C", style: { bold: true, fg: "red" } },
      { text: ":quit" },
    ],
  }),
});

// ── Modal (shown with "m" key) ───────────────────────────────────────
const modal = new Modal({
  id: "modal",
  position: { x: 15, y: 5 },
  width: 50,
  height: 10,
  margin: 0,
  style: {
    border: { style: "double", fg: "danger" },
    fg: "text",
    padding: { left: 2, top: 1, right: 2, bottom: 1 },
    bg: "#1C1C1E",
  },
  props: {
    title: "⚠️  Confirm Action",
    body: "Are you sure you want to restart all services?\nThis will cause a brief downtime.",
    buttons: [
      {
        label: "Restart",
        style: { fg: "red" },
        action: () => {
          app.hideOverlay(modal);
        },
      },
      {
        label: "Cancel",
        action: () => {
          app.hideOverlay(modal);
        },
      },
    ],
  },
});

// ── App assembly ─────────────────────────────────────────────────────
app
  .add(header)
  .add(tabs, true)
  .add(dataTable, true)
  .add(spinner)
  .add(checkbox1, true)
  .add(checkbox2, true)
  .add(progressBar)
  .add(footer);

// ── Keyboard shortcuts ──────────────────────────────────────────────
app.onKey("ctrl+c", () => {
  app.stop();
  process.exit(0);
});

app.onKey("m", () => {
  app.showOverlay(modal, true);
});

// ── Animate progress bar value ──────────────────────────────────────
app.animate(
  progressBar,
  { value: 0.95 },
  { duration: 3000, easing: easeOut },
);

app.start();
