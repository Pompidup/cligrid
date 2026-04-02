/**
 * Demo: v2 Showcase
 *
 * Showcases all v2 features in a single interactive dashboard.
 * Each feature is clearly demonstrated with visual feedback.
 *
 * Run: pnpm demo:showcase
 * Recommended terminal size: 100x30 minimum
 *
 * Features demonstrated:
 * - Table with data and vertical scroll
 * - Tabs for navigation between views
 * - Spinner with multiple styles
 * - Modal confirmation dialog (overlay)
 * - Checkbox toggles
 * - Animation system (progress bar, counters)
 * - Color gradients
 * - Theme system (dark/light switch)
 * - Emoji / Unicode support
 * - Mouse support (click, scroll)
 * - Hover detection (visual feedback)
 * - Focus visible (focusStyle highlights)
 * - Horizontal scroll (wide content)
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
  lightTheme,
  gradient,
  easeOut,
  easeInOut,
} from "../src/index.js";
import type { RenderContext } from "../src/index.js";

let currentThemeName = "dark";
const app = new App({ alternateScreen: true, mouse: true });
app.setTheme(darkTheme);

// ── Header with gradient title ───────────────────────────────────────
const titleText = "  cligrid v2 — Showcase 🚀  ";
const titleGradient = gradient("#5B9BD5", "#AF52DE", titleText.length);
const header = createComponent({
  id: "header",
  position: { x: 0, y: 0 },
  width: "100%",
  height: 3,
  margin: 0,
  style: {
    border: { style: "rounded", fg: "#5B9BD5" },
    padding: { left: 0 },
  },
  props: {},
  render: () => ({
    text: "",
    segments: titleText.split("").map((ch, i) => ({
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
      { label: "📊 Services", id: "services" },
      { label: "📈 Metrics", id: "metrics" },
      { label: "📜 Logs (scroll →)", id: "logs" },
    ],
    activeTab: "services",
  },
  style: { fg: "white" },
  focusStyle: { fg: "#FFD700", bold: true },
  onTabChange: (id) => {
    switchTab(id);
  },
});

// ── Table: Services ──────────────────────────────────────────────────
const serviceColumns = [
  { key: "name", label: "Service", width: 18 },
  { key: "status", label: "Status", width: 14 },
  { key: "region", label: "Region", width: 14 },
  { key: "cpu", label: "CPU", width: 8, align: "right" as const },
  { key: "mem", label: "Memory", width: 10, align: "right" as const },
];

const serviceRows = [
  { name: "🌐 api-gateway", status: "✅ Running", region: "us-east-1", cpu: "24%", mem: "512MB" },
  { name: "🔐 auth-svc", status: "✅ Running", region: "eu-west-1", cpu: "18%", mem: "256MB" },
  { name: "🗄️ db-primary", status: "✅ Running", region: "us-east-1", cpu: "67%", mem: "2.1GB" },
  { name: "💾 cache-node", status: "⚠️ Degraded", region: "ap-south-1", cpu: "89%", mem: "1.8GB" },
  { name: "⚙️ worker-pool", status: "✅ Running", region: "us-west-2", cpu: "45%", mem: "768MB" },
  { name: "🌍 cdn-edge", status: "✅ Running", region: "global", cpu: "12%", mem: "128MB" },
  { name: "🔍 search-idx", status: "🔄 Updating", region: "eu-west-1", cpu: "92%", mem: "3.2GB" },
  { name: "📧 mail-svc", status: "✅ Running", region: "us-east-1", cpu: "8%", mem: "384MB" },
  { name: "📊 analytics", status: "✅ Running", region: "us-west-2", cpu: "55%", mem: "1.4GB" },
  { name: "🔔 notif-svc", status: "❌ Down", region: "eu-west-1", cpu: "0%", mem: "0MB" },
];

const metricsColumns = [
  { key: "metric", label: "Metric", width: 22 },
  { key: "current", label: "Current", width: 12, align: "right" as const },
  { key: "avg24h", label: "Avg 24h", width: 12, align: "right" as const },
  { key: "peak", label: "Peak", width: 12, align: "right" as const },
  { key: "trend", label: "Trend", width: 8 },
];

const metricsRows = [
  { metric: "Requests/sec", current: "1,247", avg24h: "982", peak: "3,891", trend: "📈" },
  { metric: "Avg latency", current: "23ms", avg24h: "31ms", peak: "142ms", trend: "📉" },
  { metric: "P99 latency", current: "89ms", avg24h: "120ms", peak: "450ms", trend: "📉" },
  { metric: "Error rate", current: "0.02%", avg24h: "0.05%", peak: "1.2%", trend: "📉" },
  { metric: "Active conns", current: "3,891", avg24h: "2,450", peak: "5,100", trend: "📈" },
  { metric: "Bandwidth", current: "847MB/s", avg24h: "620MB/s", peak: "1.2GB/s", trend: "📈" },
  { metric: "Cache hit rate", current: "94.2%", avg24h: "92.8%", peak: "98.1%", trend: "📈" },
  { metric: "Queue depth", current: "23", avg24h: "15", peak: "89", trend: "📈" },
];

// Long log lines to demonstrate horizontal scroll
const logColumns = [
  { key: "time", label: "Timestamp", width: 12 },
  { key: "level", label: "Level", width: 7 },
  { key: "source", label: "Source", width: 14 },
  { key: "message", label: "Message", width: 80 },
];

const logRows = [
  { time: "14:23:01.42", level: "INFO", source: "api-gateway", message: "Request processed: GET /api/v2/users?limit=50&offset=100&sort=created_at&order=desc — 200 OK — 23ms response time" },
  { time: "14:23:01.89", level: "WARN", source: "cache-node", message: "Cache eviction triggered: memory usage at 89%, evicting 1,247 entries from LRU cache, consider scaling up cache cluster" },
  { time: "14:23:02.15", level: "INFO", source: "auth-svc", message: "JWT token refreshed for user_id=8842 session_id=sess_abc123def456 — new expiry: 2026-04-02T15:23:02Z" },
  { time: "14:23:02.34", level: "ERROR", source: "notif-svc", message: "Connection refused: smtp://mail.internal:587 — retry 3/5 — Error: ECONNREFUSED — check mail server health" },
  { time: "14:23:02.67", level: "INFO", source: "worker-pool", message: "Job batch completed: processed 500/500 items in 2.3s — average 4.6ms/item — queue depth: 23 remaining" },
  { time: "14:23:03.01", level: "DEBUG", source: "search-idx", message: "Reindexing shard 7/12: 45,000 documents processed, 12,000 remaining — estimated completion: 14:25:30" },
  { time: "14:23:03.45", level: "INFO", source: "analytics", message: "Daily aggregation complete: 2.4M events processed — storage: 847MB compressed — dashboards refreshed" },
  { time: "14:23:03.89", level: "WARN", source: "db-primary", message: "Slow query detected: SELECT * FROM orders JOIN users ON... — execution time: 3.2s — consider adding index on orders.user_id" },
];

const dataTable = new Table({
  id: "table",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "tabs" },
  },
  width: "70%",
  height: 14,
  margin: 0,
  scrollable: true,
  style: {
    border: { style: "single", fg: "#3A3A3C" },
    padding: { left: 1, top: 0 },
    fg: "white",
  },
  focusStyle: { border: { style: "double", fg: "#5B9BD5" } },
  props: {
    columns: serviceColumns,
    rows: serviceRows,
  },
});

function switchTab(id: string) {
  if (id === "services") {
    dataTable.setProps({ columns: serviceColumns, rows: serviceRows });
  } else if (id === "metrics") {
    dataTable.setProps({ columns: metricsColumns, rows: metricsRows });
  } else if (id === "logs") {
    dataTable.setProps({ columns: logColumns, rows: logRows });
  }
}

// ── Sidebar ──────────────────────────────────────────────────────────

// Spinner with cycling styles
const spinnerStyles = ["dots", "line", "arc", "bouncingBar"] as const;
let spinnerStyleIndex = 0;

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
    border: { style: "rounded", fg: "#AF52DE" },
    fg: "#AF52DE",
    padding: { left: 1 },
  },
  props: { label: "Syncing data...", style: "dots" },
});

// Status panel showing mouse/hover info
const statusPanel = createComponent({
  id: "status",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "spinner" },
  },
  width: "30%",
  height: 5,
  margin: 0,
  style: {
    border: { style: "rounded", fg: "#8E8E93" },
    padding: { left: 1 },
    fg: "white",
  },
  focusStyle: { border: { style: "rounded", fg: "#FFD700" } },
  props: { mouseInfo: "Move mouse over components", hoverTarget: "—", clicks: 0 },
  render: (props: { mouseInfo: string; hoverTarget: string; clicks: number }, ctx?: RenderContext) => {
    const focusLabel = ctx?.focused ? " 🎯 FOCUSED" : "";
    const hoverLabel = ctx?.hovered ? " ✨ HOVERED" : "";
    return [
      { text: `🖱️  Mouse Panel${focusLabel}${hoverLabel}`, style: { bold: true } },
      { text: "" },
      { text: `Hovering: ${props.hoverTarget}` },
      { text: `Clicks: ${props.clicks}`, style: { fg: "#34C759" } },
    ];
  },
});

// Track clicks on status panel
let clickCount = 0;
statusPanel.on("click", () => {
  clickCount++;
  statusPanel.setProps({ ...statusPanel.props, clicks: clickCount });
});

// Track hover on all components
const hoverableIds = ["header", "tabs", "table", "spinner", "status", "chk-theme", "chk-notify", "chk-spinner", "progress", "footer"];

const checkbox1 = new Checkbox({
  id: "chk-theme",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "status" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { padding: { left: 2 }, fg: "white" },
  focusStyle: { fg: "#FFD700", bold: true },
  props: { checked: false, label: "🌙 Dark / ☀️ Light" },
  onChange: (checked) => {
    currentThemeName = checked ? "light" : "dark";
    app.setTheme(checked ? lightTheme : darkTheme);
    // Force full re-render with new theme
    app.render();
  },
});

const checkbox2 = new Checkbox({
  id: "chk-notify",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "chk-theme" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { padding: { left: 2 }, fg: "white" },
  focusStyle: { fg: "#FFD700", bold: true },
  props: { checked: true, label: "🔔 Notifications" },
});

const checkbox3 = new Checkbox({
  id: "chk-spinner",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "chk-notify" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { padding: { left: 2 }, fg: "white" },
  focusStyle: { fg: "#FFD700", bold: true },
  props: { checked: false, label: "🔄 Cycle spinner style" },
  onChange: (checked) => {
    if (checked) {
      spinnerStyleIndex = (spinnerStyleIndex + 1) % spinnerStyles.length;
      const newStyle = spinnerStyles[spinnerStyleIndex]!;
      spinner.setProps({ ...spinner.props, style: newStyle, frameIndex: 0 });
    }
  },
});

// Progress bars with animation
const cpuBar = new ProgressBar({
  id: "cpu-bar",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "chk-spinner" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { fg: "#FF9500", padding: { left: 2 } },
  props: { value: 0.45, label: "CPU" },
});

const memBar = new ProgressBar({
  id: "mem-bar",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "cpu-bar" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { fg: "#5B9BD5", padding: { left: 2 } },
  props: { value: 0.62, label: "MEM" },
});

const dskBar = new ProgressBar({
  id: "dsk-bar",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "mem-bar" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { fg: "#FF3B30", padding: { left: 2 } },
  props: { value: 0.87, label: "DSK" },
});

// ── Footer with live help ────────────────────────────────────────────
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
  render: (_props: {}, ctx?: RenderContext) => {
    const hoverHint = ctx?.hovered ? " (hovered!)" : "";
    return {
      text: "",
      segments: [
        { text: " Tab", style: { bold: true, fg: "#5B9BD5" } },
        { text: ":navigate" },
        { text: "  ←→", style: { bold: true, fg: "#5B9BD5" } },
        { text: ":tabs/scroll-H" },
        { text: "  ↑↓", style: { bold: true, fg: "#5B9BD5" } },
        { text: ":scroll-V" },
        { text: "  Space", style: { bold: true, fg: "#5B9BD5" } },
        { text: ":toggle" },
        { text: "  m", style: { bold: true, fg: "#5B9BD5" } },
        { text: ":modal" },
        { text: "  t", style: { bold: true, fg: "#5B9BD5" } },
        { text: ":theme" },
        { text: "  🖱️ Click/Hover", style: { fg: "#8E8E93" } },
        { text: hoverHint, style: { fg: "#34C759", bold: true } },
        { text: "  Ctrl+C", style: { bold: true, fg: "#FF3B30" } },
        { text: ":quit" },
      ],
    };
  },
});

// ── Modal ────────────────────────────────────────────────────────────
const modal = new Modal({
  id: "modal",
  position: { x: 15, y: 5 },
  width: 50,
  height: 12,
  margin: 0,
  style: {
    border: { style: "double", fg: "#FF3B30" },
    fg: "white",
    padding: { left: 2, top: 1, right: 2, bottom: 1 },
    bg: "#2C2C2E",
  },
  props: {
    title: "⚠️  Confirm Action",
    body: "Are you sure you want to restart all services?\nThis will cause approximately 30s of downtime.\n\nUse ←→ to navigate, Enter to confirm, Esc to cancel.",
    buttons: [
      {
        label: "🔄 Restart",
        style: { fg: "#FF3B30" },
        action: () => {
          app.hideOverlay(modal);
        },
      },
      {
        label: "❌ Cancel",
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
  .add(statusPanel, true)
  .add(checkbox1, true)
  .add(checkbox2, true)
  .add(checkbox3, true)
  .add(cpuBar)
  .add(memBar)
  .add(dskBar)
  .add(footer);

// ── Hover tracking on all components ────────────────────────────────
for (const id of hoverableIds) {
  const comp = [header, tabs, dataTable, spinner, statusPanel, checkbox1, checkbox2, checkbox3, cpuBar, memBar, dskBar, footer]
    .find(c => c.id === id);
  if (comp) {
    comp.on("mouseenter", () => {
      statusPanel.setProps({ ...statusPanel.props, hoverTarget: id });
    });
    comp.on("mouseleave", () => {
      if (statusPanel.props.hoverTarget === id) {
        statusPanel.setProps({ ...statusPanel.props, hoverTarget: "—" });
      }
    });
  }
}

// ── Keyboard shortcuts ──────────────────────────────────────────────
app.onKey("ctrl+c", () => {
  app.stop();
  process.exit(0);
});

app.onKey("m", () => {
  app.showOverlay(modal, true);
});

app.onKey("t", () => {
  const isLight = currentThemeName === "light";
  currentThemeName = isLight ? "dark" : "light";
  app.setTheme(isLight ? darkTheme : lightTheme);
  checkbox1.setProps({ checked: !isLight });
  app.render();
});

// ── Animations: simulate live CPU/MEM fluctuation ───────────────────
function animateMetrics() {
  const cpuTarget = 0.3 + Math.random() * 0.6;
  const memTarget = 0.4 + Math.random() * 0.5;

  app.animate(cpuBar, { value: cpuTarget }, { duration: 2000, easing: easeInOut });
  app.animate(memBar, { value: memTarget }, { duration: 2500, easing: easeInOut });
}

// Initial animation
animateMetrics();

// Re-animate every 3 seconds
let animInterval: ReturnType<typeof setInterval>;
animInterval = setInterval(() => {
  animateMetrics();
}, 3000);

// Cycle spinner style every 5 seconds
let spinnerInterval = setInterval(() => {
  spinnerStyleIndex = (spinnerStyleIndex + 1) % spinnerStyles.length;
  const newStyle = spinnerStyles[spinnerStyleIndex]!;
  spinner.setProps({ ...spinner.props, style: newStyle, frameIndex: 0 });
}, 5000);

// Cleanup intervals on stop
const origStop = app.stop.bind(app);
app.stop = () => {
  clearInterval(animInterval);
  clearInterval(spinnerInterval);
  origStop();
};

app.start();
