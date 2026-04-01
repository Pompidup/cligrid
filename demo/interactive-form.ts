/**
 * Demo 2: Interactive Form
 *
 * Showcases: InputField (onChange, onSubmit), SelectList (onSelect),
 * focus management (Tab / Shift+Tab), dynamic updates via setProps.
 *
 * Run: pnpm demo:form
 * Recommended terminal size: 80x24 minimum
 */

import {
  App,
  createComponent,
  TextBox,
  InputField,
  SelectList,
} from "../src/index.js";

const app = new App({ alternateScreen: true });

const formData = { name: "", email: "", role: "" };

function updateResults() {
  results.setProps({ ...formData });
}

// ── Title ─────────────────────────────────────────────────────────────
const title = new TextBox({
  id: "title",
  position: { x: 0, y: 0 },
  width: "100%",
  height: 3,
  margin: 0,
  props: { text: "  Registration Form" },
  style: {
    border: { style: "double", fg: "cyan" },
    fg: "cyan",
    bold: true,
  },
});

// ── Name field ────────────────────────────────────────────────────────
const nameLabel = new TextBox({
  id: "name-label",
  position: {
    x: { position: 2 },
    y: { position: "bottom", relativeTo: "title" },
  },
  width: 8,
  height: 1,
  margin: 0,
  props: { text: "Name:" },
  style: { fg: "yellow", bold: true },
});

const nameInput = new InputField({
  id: "name-input",
  position: {
    x: { position: "right", relativeTo: "name-label" },
    y: { position: "bottom", relativeTo: "title" },
  },
  width: 30,
  height: 3,
  margin: 0,
  props: { value: "", placeholder: "Enter your name..." },
  style: { border: { style: "single", fg: "white" }, fg: "white" },
  onChange: (val) => {
    formData.name = val;
    updateResults();
  },
});

// ── Email field ───────────────────────────────────────────────────────
const emailLabel = new TextBox({
  id: "email-label",
  position: {
    x: { position: 2 },
    y: { position: "bottom", relativeTo: "name-input" },
  },
  width: 8,
  height: 1,
  margin: 0,
  props: { text: "Email:" },
  style: { fg: "yellow", bold: true },
});

const emailInput = new InputField({
  id: "email-input",
  position: {
    x: { position: "right", relativeTo: "email-label" },
    y: { position: "bottom", relativeTo: "name-input" },
  },
  width: 30,
  height: 3,
  margin: 0,
  props: { value: "", placeholder: "Enter your email..." },
  style: { border: { style: "single", fg: "white" }, fg: "white" },
  onChange: (val) => {
    formData.email = val;
    updateResults();
  },
});

// ── Role select ───────────────────────────────────────────────────────
const roleLabel = new TextBox({
  id: "role-label",
  position: {
    x: { position: 2 },
    y: { position: "bottom", relativeTo: "email-input" },
  },
  width: 8,
  height: 1,
  margin: 0,
  props: { text: "Role:" },
  style: { fg: "yellow", bold: true },
});

const roleSelect = new SelectList({
  id: "role-select",
  position: {
    x: { position: "right", relativeTo: "role-label" },
    y: { position: "bottom", relativeTo: "email-input" },
  },
  width: 30,
  height: 6,
  margin: 0,
  props: {
    items: ["Developer", "Designer", "Manager", "Other"],
    selectedIndex: 0,
  },
  style: {
    border: { style: "rounded", fg: "magenta" },
    fg: "white",
    padding: { left: 1 },
  },
  onSelect: (_idx, item) => {
    formData.role = item;
    updateResults();
  },
});

// ── Results panel ─────────────────────────────────────────────────────
const results = createComponent({
  id: "results",
  position: {
    x: { position: "right", relativeTo: "name-input" },
    y: { position: "bottom", relativeTo: "title" },
  },
  width: 30,
  height: 12,
  margin: 0,
  style: {
    border: { style: "double", fg: "green" },
    fg: "green",
    padding: { left: 2, top: 1 },
  },
  props: { name: "", email: "", role: "" },
  render: (props: { name: string; email: string; role: string }) => [
    { text: "Form Data", style: { bold: true, underline: true } },
    { text: "" },
    { text: `Name:  ${props.name || "(empty)"}` },
    { text: `Email: ${props.email || "(empty)"}` },
    { text: `Role:  ${props.role || "(none selected)"}` },
  ],
});

// ── Footer ────────────────────────────────────────────────────────────
const footer = createComponent({
  id: "footer",
  position: {
    x: { position: 0 },
    y: { position: "bottom", relativeTo: "role-select" },
  },
  width: "100%",
  height: 1,
  margin: 0,
  props: {},
  render: () => ({
    text: "  Tab: next field | Shift+Tab: prev | Up/Down: select role | Enter: confirm | Ctrl+C: quit",
    style: { dim: true },
  }),
});

// ── App setup ─────────────────────────────────────────────────────────
app
  .add(title)
  .add(nameLabel)
  .add(nameInput, true)
  .add(emailLabel)
  .add(emailInput, true)
  .add(roleLabel)
  .add(roleSelect, true)
  .add(results)
  .add(footer);

app.onKey("ctrl+c", () => {
  app.stop();
  process.exit(0);
});

app.start();
