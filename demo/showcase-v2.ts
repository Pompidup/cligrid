/**
 * Demo: v2 Showcase
 *
 * Run: pnpm demo:showcase
 * Recommended terminal size: 100x30 minimum
 *
 * Features demonstrated:
 * - Table with data and vertical scroll (↑↓ when focused)
 * - Tabs for navigation (←→ when focused)
 * - Logs tab with horizontal scroll (←→ when table focused)
 * - Spinner with auto-cycling styles
 * - Modal overlay (m key) — centered, opaque bg, focus on buttons
 * - Checkbox toggles (Space/Enter when focused)
 * - Theme toggle (t key or checkbox) — dark/light with design tokens
 * - Animation system — live CPU/MEM bars with easing
 * - Color gradients in header
 * - Mouse support — hover tracking, click counter
 * - Focus visible — gold highlight on Tab navigation
 * - Unicode/Emoji throughout
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
    border: { style: "rounded", fg: "primary" },
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
      { label: "📜 Logs (→ scroll)", id: "logs" },
    ],
    activeTab: "services",
  },
  style: { fg: "text" },
  focusStyle: { fg: "warning", bold: true },
  onTabChange: (id) => switchTab(id),
});

// ── Table data ───────────────────────────────────────────────────────
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

// Long messages → demonstrates horizontal scroll
const logColumns = [
  { key: "time", label: "Timestamp", width: 12 },
  { key: "level", label: "Level", width: 7 },
  { key: "source", label: "Source", width: 14 },
  { key: "message", label: "Message", width: 120 },
];
const logRows = [
  { time: "14:23:01.42", level: "INFO", source: "api-gateway", message: "Request processed: GET /api/v2/users?limit=50&offset=100&sort=created_at&order=desc — 200 OK — 23ms response time — cache: HIT" },
  { time: "14:23:01.89", level: "WARN", source: "cache-node", message: "Cache eviction triggered: memory usage at 89%, evicting 1,247 entries from LRU cache — consider scaling up the cache cluster" },
  { time: "14:23:02.15", level: "INFO", source: "auth-svc", message: "JWT token refreshed for user_id=8842 session_id=sess_abc123def456 — new expiry: 2026-04-02T15:23:02Z — scope: read,write" },
  { time: "14:23:02.34", level: "ERROR", source: "notif-svc", message: "Connection refused: smtp://mail.internal:587 — retry 3/5 — Error: ECONNREFUSED — check mail server health and firewall rules" },
  { time: "14:23:02.67", level: "INFO", source: "worker-pool", message: "Job batch completed: processed 500/500 items in 2.3s — average 4.6ms/item — queue depth: 23 remaining — next batch in 5s" },
  { time: "14:23:03.01", level: "DEBUG", source: "search-idx", message: "Reindexing shard 7/12: 45,000 documents processed, 12,000 remaining — estimated completion: 14:25:30 — throughput: 2,500 docs/s" },
  { time: "14:23:03.45", level: "INFO", source: "analytics", message: "Daily aggregation complete: 2.4M events processed — storage: 847MB compressed — dashboards refreshed — next run: 2026-04-03T00:00Z" },
  { time: "14:23:03.89", level: "WARN", source: "db-primary", message: "Slow query detected: SELECT * FROM orders JOIN users ON orders.user_id = users.id WHERE... — execution time: 3.2s — add index" },
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
    border: { style: "single", fg: "border" },
    padding: { left: 1 },
    fg: "text",
  },
  focusStyle: { border: { style: "double", fg: "primary" } },
  props: { columns: serviceColumns, rows: serviceRows },
});

function switchTab(id: string) {
  if (id === "services") dataTable.setProps({ columns: serviceColumns, rows: serviceRows });
  else if (id === "metrics") dataTable.setProps({ columns: metricsColumns, rows: metricsRows });
  else if (id === "logs") dataTable.setProps({ columns: logColumns, rows: logRows });
}

// ── Sidebar ──────────────────────────────────────────────────────────
const spinnerStyles = ["dots", "line", "arc", "bouncingBar"] as const;
let spinnerIdx = 0;

const spinner = new Spinner({
  id: "spinner",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "tabs" },
  },
  width: "30%",
  height: 3,
  margin: 0,
  style: { border: { style: "rounded", fg: "accent" }, fg: "accent", padding: { left: 1 } },
  props: { label: "Syncing data...", style: "dots" },
});

// Mouse status panel
const statusPanel = createComponent({
  id: "status",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "spinner" },
  },
  width: "30%",
  height: 5,
  margin: 0,
  style: { border: { style: "rounded", fg: "muted" }, padding: { left: 1 }, fg: "text" },
  focusStyle: { border: { style: "rounded", fg: "warning" } },
  props: { hoverTarget: "—", clicks: 0 },
  render: (props: { hoverTarget: string; clicks: number }, ctx?: RenderContext) => {
    const f = ctx?.focused ? " 🎯" : "";
    const h = ctx?.hovered ? " ✨" : "";
    return [
      { text: `🖱️  Mouse Panel${f}${h}`, style: { bold: true } },
      { text: "" },
      { text: `Hover: ${props.hoverTarget}`, style: { fg: "secondary" } },
      { text: `Clicks: ${props.clicks}`, style: { fg: "success" } },
    ];
  },
});

let clickCount = 0;
statusPanel.on("click", () => {
  clickCount++;
  statusPanel.setProps({ ...statusPanel.props, clicks: clickCount });
});

// Checkboxes — all use theme tokens
const chkTheme = new Checkbox({
  id: "chk-theme",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "status" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { padding: { left: 2 }, fg: "text" },
  focusStyle: { fg: "warning", bold: true },
  props: { checked: false, label: "☀️ Light theme" },
  onChange: (checked) => toggleTheme(checked),
});

const chkNotify = new Checkbox({
  id: "chk-notify",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "chk-theme" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { padding: { left: 2 }, fg: "text" },
  focusStyle: { fg: "warning", bold: true },
  props: { checked: true, label: "🔔 Notifications" },
  onChange: (checked) => {
    spinner.setProps({
      ...spinner.props,
      label: checked ? "Syncing data..." : "Notifications off",
    });
  },
});

const chkSpinner = new Checkbox({
  id: "chk-spinner",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "chk-notify" },
  },
  width: "30%",
  height: 1,
  margin: 0,
  style: { padding: { left: 2 }, fg: "text" },
  focusStyle: { fg: "warning", bold: true },
  props: { checked: false, label: "🔄 Next spinner style" },
  onChange: () => {
    spinnerIdx = (spinnerIdx + 1) % spinnerStyles.length;
    spinner.setProps({ ...spinner.props, style: spinnerStyles[spinnerIdx], frameIndex: 0 });
    // Auto-uncheck so you can press again
    setTimeout(() => chkSpinner.setProps({ checked: false }), 200);
  },
});

// Progress bars
const cpuBar = new ProgressBar({
  id: "cpu-bar",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "chk-spinner" },
  },
  width: "30%", height: 1, margin: 0,
  style: { fg: "warning", padding: { left: 2 } },
  props: { value: 0.45, label: "CPU" },
});

const memBar = new ProgressBar({
  id: "mem-bar",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "cpu-bar" },
  },
  width: "30%", height: 1, margin: 0,
  style: { fg: "primary", padding: { left: 2 } },
  props: { value: 0.62, label: "MEM" },
});

const dskBar = new ProgressBar({
  id: "dsk-bar",
  position: {
    x: { position: "right", relativeTo: "table" },
    y: { position: "bottom", relativeTo: "mem-bar" },
  },
  width: "30%", height: 1, margin: 0,
  style: { fg: "danger", padding: { left: 2 } },
  props: { value: 0.87, label: "DSK" },
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
      { text: " Tab", style: { bold: true, fg: "primary" } },
      { text: ":focus" },
      { text: "  ←→", style: { bold: true, fg: "primary" } },
      { text: ":tabs/scroll-H" },
      { text: "  ↑↓", style: { bold: true, fg: "primary" } },
      { text: ":scroll-V" },
      { text: "  Space", style: { bold: true, fg: "primary" } },
      { text: ":toggle" },
      { text: "  m", style: { bold: true, fg: "primary" } },
      { text: ":modal" },
      { text: "  t", style: { bold: true, fg: "primary" } },
      { text: ":theme" },
      { text: "  Ctrl+C", style: { bold: true, fg: "danger" } },
      { text: ":quit" },
    ],
  }),
});

// ── Modal — centered, opaque bg ──────────────────────────────────────
const modalW = 54;
const modalH = 12;
const termW = process.stdout.columns ?? 100;
const termH = process.stdout.rows ?? 30;

const modal = new Modal({
  id: "modal",
  position: { x: Math.max(0, Math.floor((termW - modalW) / 2)), y: Math.max(0, Math.floor((termH - modalH) / 2)) },
  width: modalW,
  height: modalH,
  margin: 0,
  style: {
    border: { style: "double", fg: "danger" },
    fg: "text",
    padding: { left: 2, top: 1, right: 2, bottom: 1 },
    bg: "surface",
  },
  props: {
    title: "⚠️  Confirm Action",
    body: "Are you sure you want to restart all services?\nThis will cause ~30s of downtime.\n\n←→ navigate buttons, Enter confirm, Esc cancel",
    buttons: [
      { label: "🔄 Restart", style: { fg: "danger" }, action: () => app.hideOverlay(modal) },
      { label: "❌ Cancel", action: () => app.hideOverlay(modal) },
    ],
  },
});

// ── Theme toggle ─────────────────────────────────────────────────────
function toggleTheme(light: boolean) {
  currentThemeName = light ? "light" : "dark";
  app.setTheme(light ? lightTheme : darkTheme);
  chkTheme.setProps({ checked: light, label: light ? "🌙 Dark theme" : "☀️ Light theme" });
  app.render();
}

// ── App assembly ─────────────────────────────────────────────────────
app
  .add(header)
  .add(tabs, true)
  .add(dataTable, true)
  .add(spinner)
  .add(statusPanel, true)
  .add(chkTheme, true)
  .add(chkNotify, true)
  .add(chkSpinner, true)
  .add(cpuBar)
  .add(memBar)
  .add(dskBar)
  .add(footer);

// ── Hover tracking ──────────────────────────────────────────────────
const allComponents = [header, tabs, dataTable, spinner, statusPanel, chkTheme, chkNotify, chkSpinner, cpuBar, memBar, dskBar, footer];
for (const comp of allComponents) {
  comp.on("mouseenter", () => {
    statusPanel.setProps({ ...statusPanel.props, hoverTarget: comp.id });
  });
  comp.on("mouseleave", () => {
    if (statusPanel.props.hoverTarget === comp.id) {
      statusPanel.setProps({ ...statusPanel.props, hoverTarget: "—" });
    }
  });
}

// ── Keys ─────────────────────────────────────────────────────────────
app.onKey("ctrl+c", () => { app.stop(); process.exit(0); });
app.onKey("m", () => app.showOverlay(modal, true));
app.onKey("t", () => toggleTheme(currentThemeName !== "light"));

// ── Animations ──────────────────────────────────────────────────────
function animateMetrics() {
  app.animate(cpuBar, { value: 0.3 + Math.random() * 0.6 }, { duration: 2000, easing: easeInOut });
  app.animate(memBar, { value: 0.4 + Math.random() * 0.5 }, { duration: 2500, easing: easeInOut });
}
animateMetrics();
const animInterval = setInterval(animateMetrics, 3000);

// Auto-cycle spinner style
const spinnerInterval = setInterval(() => {
  spinnerIdx = (spinnerIdx + 1) % spinnerStyles.length;
  spinner.setProps({ ...spinner.props, style: spinnerStyles[spinnerIdx], frameIndex: 0 });
}, 5000);

// Cleanup
const origStop = app.stop.bind(app);
app.stop = () => { clearInterval(animInterval); clearInterval(spinnerInterval); origStop(); };

app.start();
