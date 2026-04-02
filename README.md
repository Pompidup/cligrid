# @pompidup/cligrid

![npm](https://img.shields.io/npm/v/@pompidup/cligrid)
![license](https://img.shields.io/npm/l/@pompidup/cligrid)

A terminal UI framework for building responsive, interactive, component-based CLI applications in TypeScript.

[Changelog](https://github.com/Pompidup/cligrid/blob/main/CHANGELOG.md)

## Features

- **Component-based architecture** — build UIs with reusable, composable components
- **Built-in components** — TextBox, SelectList, ProgressBar, InputField, Table, Spinner, Tabs, Modal, Checkbox
- **Functional components** — `createComponent()` factory, no class boilerplate needed
- **Responsive layout** — percentage and fixed sizing, relative positioning, flex layout (row/column) with gap, justify, alignItems
- **Min/Max constraints** — `minWidth`, `maxWidth`, `minHeight`, `maxHeight` for responsive layouts
- **Styling** — borders (single/double/rounded), colors (named + hex), padding, bold/dim/underline/italic/strikethrough/inverse
- **Styled segments** — multiple styles within a single line via `segments` (`StyledSegment[]`)
- **Text alignment** — `align: "left" | "center" | "right"` per line
- **Text overflow** — hidden, ellipsis, wrap, wrap-word modes (segment-aware)
- **Unicode-aware** — correct rendering of emoji, CJK characters, and zero-width joiners
- **Keyboard input** — focus management (Tab/Shift+Tab), event bubbling, declarative `onKeyPress`
- **Mouse support** — click, scroll, hover detection with `mouseenter`/`mouseleave` events
- **Scrolling** — vertical and horizontal scrolling with keyboard control and visual indicators
- **Overlays** — z-index layering, `showOverlay()`/`hideOverlay()` for modals
- **Reactive state** — app-level state store with `setState()`/`connect()` for automatic re-renders
- **Animation system** — built-in `app.animate()` with easing functions (linear, easeIn, easeOut, bounce, elastic)
- **Color utilities** — `gradient()`, `lighten()`, `darken()`, `mix()` for programmatic color manipulation
- **Theme system** — design tokens (`primary`, `danger`, `surface`, etc.) with dark/light presets
- **Focus visible** — `focusStyle` for automatic visual focus indicators
- **Lifecycle hooks** — `onMount`, `onDestroy`, `onResize`
- **Performance** — double-buffered rendering, diff-based updates, partial re-renders on prop changes

## Installation

```sh
npm install @pompidup/cligrid
# or
yarn add @pompidup/cligrid
# or
pnpm add @pompidup/cligrid
```

## Quick Start

```typescript
import { App, createComponent } from "@pompidup/cligrid";

const app = new App({ alternateScreen: true });

const hello = createComponent({
  id: "hello",
  position: { x: 0, y: 0 },
  width: "100%",
  height: 3,
  margin: 0,
  style: {
    border: { style: "rounded", fg: "cyan" },
    fg: "cyan",
    padding: { left: 2 },
  },
  props: {},
  render: () => "Hello from cligrid!",
});

app.add(hello);

app.onKey("ctrl+c", () => {
  app.stop();
  process.exit(0);
});

app.start();
```

## Built-in Components

### TextBox

Displays text with optional borders, padding, and overflow handling.

```typescript
import { TextBox } from "@pompidup/cligrid";

const box = new TextBox({
  id: "info",
  position: { x: 0, y: 0 },
  width: "50%",
  height: 5,
  props: { text: "Hello\nWorld" },
  style: { border: { style: "single" }, overflow: "wrap-word" },
});
```

### SelectList

Navigable list with keyboard support (Up/Down to move, Enter to select).

```typescript
import { SelectList } from "@pompidup/cligrid";

const menu = new SelectList({
  id: "menu",
  position: { x: 0, y: 0 },
  width: 30,
  height: 6,
  props: {
    items: ["New Game", "Load Game", "Settings", "Quit"],
    selectedIndex: 0,
  },
  style: { border: { style: "rounded" } },
  onSelect: (index, item) => {
    console.log(`Selected: ${item}`);
  },
});
```

### ProgressBar

Horizontal progress indicator.

```typescript
import { ProgressBar } from "@pompidup/cligrid";

const bar = new ProgressBar({
  id: "loading",
  position: { x: 0, y: 0 },
  width: 40,
  height: 3,
  props: { value: 0.65, label: "Loading" },
  style: { border: { style: "single", fg: "green" } },
});
// Renders: Loading [████████░░░░░░] 65%
```

### InputField

Text input with cursor, placeholder, and callbacks.

```typescript
import { InputField } from "@pompidup/cligrid";

const input = new InputField({
  id: "name",
  position: { x: 0, y: 0 },
  width: 30,
  height: 3,
  props: { value: "", placeholder: "Enter your name..." },
  style: { border: { style: "single" } },
  onChange: (value) => { /* called on each keystroke */ },
  onSubmit: (value) => { /* called on Enter */ },
});
```

### Table

Data table with column alignment, headers, and vertical scrolling.

```typescript
import { Table } from "@pompidup/cligrid";

const table = new Table({
  id: "users",
  position: { x: 0, y: 0 },
  width: 60,
  height: 10,
  scrollable: true,
  props: {
    columns: [
      { key: "name", label: "Name", width: 20 },
      { key: "role", label: "Role", width: 15 },
      { key: "status", label: "Status", width: 10, align: "right" },
    ],
    rows: [
      { name: "Alice", role: "Admin", status: "Active" },
      { name: "Bob", role: "User", status: "Idle" },
    ],
  },
  style: { border: { style: "single" } },
});
```

### Spinner

Animated loading indicator with multiple styles.

```typescript
import { Spinner } from "@pompidup/cligrid";

const spinner = new Spinner({
  id: "loader",
  position: { x: 0, y: 0 },
  width: 30,
  height: 1,
  props: { label: "Loading...", style: "dots" },
  // Styles: "dots" | "line" | "arc" | "bouncingBar"
});
```

### Tabs

Tab navigation with Left/Right keyboard control.

```typescript
import { Tabs } from "@pompidup/cligrid";

const tabs = new Tabs({
  id: "nav",
  position: { x: 0, y: 0 },
  width: 40,
  height: 1,
  props: {
    tabs: [
      { label: "Home", id: "home" },
      { label: "Settings", id: "settings" },
    ],
    activeTab: "home",
  },
  onTabChange: (id) => { /* switch content */ },
});
```

### Modal

Dialog with title, body, navigable buttons, and overlay support.

```typescript
import { Modal } from "@pompidup/cligrid";

const modal = new Modal({
  id: "confirm",
  position: { x: 10, y: 5 },
  width: 40,
  height: 10,
  style: { border: { style: "double" } },
  props: {
    title: "Confirm",
    body: "Are you sure?",
    buttons: [
      { label: "OK", action: () => app.hideOverlay(modal) },
      { label: "Cancel", action: () => app.hideOverlay(modal) },
    ],
  },
});

app.showOverlay(modal); // z-index 100, focus trap
```

### Checkbox

Toggle input with Space/Enter keyboard control.

```typescript
import { Checkbox } from "@pompidup/cligrid";

const checkbox = new Checkbox({
  id: "agree",
  position: { x: 0, y: 0 },
  width: 30,
  height: 1,
  props: { checked: false, label: "I agree to the terms" },
  onChange: (checked) => { /* handle toggle */ },
});
```

## Layout & Positioning

### Fixed and Percentage Sizing

```typescript
width: 30,          // 30 columns
width: "50%",       // 50% of terminal width
height: "auto",     // computed from content
```

### Min/Max Constraints

```typescript
minWidth: 20,       // minimum 20 columns
maxWidth: "80%",    // maximum 80% of terminal width
minHeight: 5,
maxHeight: 30,
```

### Relative Positioning

Position components relative to each other:

```typescript
const sidebar = new TextBox({
  id: "sidebar",
  position: { x: 0, y: 0 },
  width: 24,
  height: "100%",
  // ...
});

const content = createComponent({
  id: "content",
  position: {
    x: { position: "right", relativeTo: "sidebar" },
    y: { position: 0 },
  },
  width: "70%",
  height: "100%",
  // ...
});
```

Relative positions: `"right"`, `"left"` (x-axis), `"top"`, `"bottom"` (y-axis).

### Flex Layout

Distribute children automatically in rows or columns:

```typescript
const row = createComponent({
  id: "row",
  position: { x: 0, y: 0 },
  width: "100%",
  height: 10,
  layout: "row",
  gap: 1,
  justifyContent: "space-between", // "start" | "center" | "end" | "space-between" | "space-around"
  alignItems: "center",            // "start" | "center" | "end" | "stretch"
  children: [
    createComponent({ id: "a", width: 20, height: "auto", /* ... */ }),
    createComponent({ id: "b", width: "100%", height: "auto", flex: 1, /* ... */ }),
  ],
  // ...
});
```

## Styling

```typescript
style: {
  border: {
    style: "single" | "double" | "rounded" | "none",
    fg: "cyan",        // border color
  },
  fg: "white",         // text foreground (named, "#RRGGBB", or theme token)
  bg: "blue",          // text background
  bold: true,
  dim: true,
  underline: true,
  italic: true,
  strikethrough: true,
  inverse: true,
  padding: { top: 1, right: 2, bottom: 1, left: 2 },
  overflow: "hidden" | "ellipsis" | "wrap" | "wrap-word",
}
```

**Colors**: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, bright variants (`brightRed`, ...), hex (`"#FF00FF"`), and theme tokens (`"primary"`, `"danger"`, etc.).

### Styled Segments

Apply different styles to parts of the same line using `segments`:

```typescript
render: () => [
  {
    text: "",
    segments: [
      { text: " INFO ", style: { bg: "blue", fg: "white", bold: true } },
      { text: " Server started on ", style: { fg: "white" } },
      { text: ":3000", style: { fg: "cyan", bold: true } },
    ],
  },
]
```

### Text Alignment

Align text within a component's content area:

```typescript
render: () => [
  { text: "Left-aligned (default)" },
  { text: "Centered title", align: "center" },
  { text: "Right-aligned value", align: "right" },
]
```

## Interactivity

### Focus Management

Register focusable components and navigate with Tab/Shift+Tab:

```typescript
app.add(input1, true);   // true = focusable
app.add(input2, true);
app.add(label, false);   // not focusable (default)
```

Use `focusStyle` for automatic visual focus indicators:

```typescript
const comp = createComponent({
  id: "panel",
  focusStyle: { fg: "yellow", bold: true }, // applied when focused
  // ...
});
```

### Keyboard Events

Global key handlers:

```typescript
app.onKey("ctrl+c", () => { app.stop(); process.exit(0); });
app.onKey("ctrl+s", () => { /* save */ });
```

Component-level key handlers:

```typescript
const comp = createComponent({
  id: "panel",
  // ...
  onKeyPress: (event, component) => {
    if (event.key === "enter") {
      event.handled = true; // stop bubbling
    }
  },
});
```

Events bubble up from child to parent until `event.handled = true`.

### Mouse Support

Enable mouse tracking for click, scroll, and hover events:

```typescript
const app = new App({ mouse: true });

const button = createComponent({
  id: "btn",
  // ...
});

button.on("click", (event) => { /* { x, y, button, type } */ });
button.on("mouseenter", () => { /* hover start */ });
button.on("mouseleave", () => { /* hover end */ });
button.on("scroll", (event) => { /* { direction: -1 | 1 } */ });
```

Components receive `hovered: boolean` in `RenderContext` to adapt their rendering.

## Advanced Features

### Animation System

Animate component props with easing functions:

```typescript
import { easeOut, bounce } from "@pompidup/cligrid";

app.animate(progressBar, { value: 1.0 }, {
  duration: 2000,
  easing: easeOut,
  onComplete: () => { /* done */ },
});

// Frame-based callbacks
const unsubscribe = app.tick((dt) => { /* called each frame */ });
```

Available easings: `linear`, `easeIn`, `easeOut`, `easeInOut`, `bounce`, `elastic`.

### Color Utilities

```typescript
import { gradient, lighten, darken, mix } from "@pompidup/cligrid";

const colors = gradient("#FF0000", "#0000FF", 10); // 10-step gradient
const lighter = lighten("#333333", 0.3);
const darker = darken("#CCCCCC", 0.2);
const blended = mix("#FF0000", "#00FF00", 0.5);
```

### Theme System

Use design tokens for consistent styling across components:

```typescript
import { darkTheme, lightTheme } from "@pompidup/cligrid";

app.setTheme(darkTheme);

// Use token names as colors
const comp = createComponent({
  id: "panel",
  style: { fg: "primary", bg: "surface", border: { style: "single", fg: "border" } },
  // ...
});

// Switch theme at runtime
app.setTheme(lightTheme);
```

Tokens: `primary`, `secondary`, `danger`, `success`, `warning`, `surface`, `text`, `border`, `muted`, `accent`.

### Reactive State Store

```typescript
app.setState({ score: 0, level: 1 });

const display = createComponent({
  id: "score",
  props: { score: 0 },
  render: (props) => `Score: ${props.score}`,
  // ...
});

app.add(display);
app.connect(display, (state) => ({ score: state.score }));

// Later: auto-updates the component
app.setState({ score: 42 });
```

### Scrolling

Vertical and horizontal scrolling with keyboard and mouse support:

```typescript
const list = createComponent({
  id: "log",
  scrollable: true, // Up/Down for vertical, Left/Right for horizontal
  // ...
});

app.add(list, true); // focusable for keyboard control

// Programmatic scrolling
list.scrollTo(10);     list.scrollBy(5);      // vertical
list.scrollToX(10);    list.scrollByX(5);     // horizontal
```

Visual scroll indicators (track + thumb) appear when content overflows.

### Overlays

```typescript
app.showOverlay(modal);   // z-index 100, saves previous focus
app.hideOverlay(modal);   // restores focus
```

### Lifecycle Hooks

```typescript
const comp = createComponent({
  id: "comp",
  // ...
  onMount: () => { /* first render */ },
  onDestroy: () => { /* removed */ },
});

comp.on("resize", (width, height) => { /* dimensions changed */ });
```

## Demos

The package includes 6 runnable demos showcasing the library features:

```sh
pnpm demo:dashboard    # Interactive dashboard with navigation menu
pnpm demo:form         # Form with input fields, select list, focus management
pnpm demo:advanced     # State store, scrolling, overlays, live updates
pnpm demo:castle       # ASCII art castle with lightning animation
pnpm demo:segments     # Styled segments, text alignment, segment overflow
pnpm demo:showcase     # v2 showcase: Table, Tabs, Spinner, Modal, Checkbox, themes, mouse
```

## API Reference

### Core

| Export | Description |
|--------|-------------|
| `App` | Main application orchestrator (manages rendering, input, focus, state, themes, mouse) |
| `createComponent()` | Functional component factory |
| `Component` | Base class for custom components |
| `Template` | Layout manager |
| `Renderer` | Terminal rendering engine |

### Built-in Components

| Export | Description |
|--------|-------------|
| `TextBox` | Multi-line text display |
| `SelectList` | Navigable list with selection |
| `ProgressBar` | Horizontal progress indicator |
| `InputField` | Text input with cursor |
| `Table` | Data table with column alignment and scroll |
| `Spinner` | Animated loading indicator |
| `Tabs` | Tab navigation with keyboard control |
| `Modal` | Dialog with buttons and overlay support |
| `Checkbox` | Toggle input |

### Animation & Color

| Export | Description |
|--------|-------------|
| `Animator` | Animation engine |
| `linear`, `easeIn`, `easeOut`, `easeInOut`, `bounce`, `elastic` | Easing functions |
| `gradient()`, `lighten()`, `darken()`, `mix()` | Color manipulation |
| `darkTheme`, `lightTheme`, `resolveThemeColor()` | Theme system |

### Utilities

| Export | Description |
|--------|-------------|
| `stylize()` | Apply ANSI styles to text |
| `fgCode()` / `bgCode()` | Get ANSI color codes |
| `stringWidth()` | Unicode-aware string width |
| `InputManager` | Low-level keyboard and mouse input |
| `FocusManager` | Focus navigation |
| `ScreenBuffer` | Double-buffered screen |

### Types

`Style`, `ComponentConfig`, `RenderContext`, `RenderOutput`, `RenderLine`, `StyledSegment`, `TextAlign`, `Position`, `Size`, `KeyEvent`, `MouseEvent`, `Theme`, `TerminalDimensions`, `StyleAttrs`

## License

MIT
