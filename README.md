# @pompidup/cligrid

![npm](https://img.shields.io/npm/v/@pompidup/cligrid)
![license](https://img.shields.io/npm/l/@pompidup/cligrid)

A terminal UI framework for building responsive, interactive, component-based CLI applications in TypeScript.

[Changelog](https://github.com/Pompidup/cligrid/blob/main/CHANGELOG.md)

## Features

- **Component-based architecture** — build UIs with reusable, composable components
- **Built-in components** — TextBox, SelectList, ProgressBar, InputField ready to use
- **Functional components** — `createComponent()` factory, no class boilerplate needed
- **Responsive layout** — percentage and fixed sizing, relative positioning, flex layout (row/column)
- **Styling** — borders (single/double/rounded), colors (named + hex), padding, bold/dim/underline
- **Text overflow** — hidden, ellipsis, wrap, wrap-word modes
- **Keyboard input** — focus management (Tab/Shift+Tab), event bubbling, declarative `onKeyPress`
- **Scrolling** — scrollable components with keyboard control and visual scroll indicator
- **Overlays** — z-index layering, `showOverlay()`/`hideOverlay()` for modals
- **Reactive state** — app-level state store with `setState()`/`connect()` for automatic re-renders
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

## Layout & Positioning

### Fixed and Percentage Sizing

```typescript
width: 30,          // 30 columns
width: "50%",       // 50% of terminal width
height: "auto",     // computed from content
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
  fg: "white",         // text foreground (named or "#RRGGBB")
  bg: "blue",          // text background
  bold: true,
  dim: true,
  underline: true,
  padding: { top: 1, right: 2, bottom: 1, left: 2 },
  overflow: "hidden" | "ellipsis" | "wrap" | "wrap-word",
}
```

**Colors**: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, bright variants (`brightRed`, ...), and hex (`"#FF00FF"`).

## Interactivity

### Focus Management

Register focusable components and navigate with Tab/Shift+Tab:

```typescript
app.add(input1, true);   // true = focusable
app.add(input2, true);
app.add(label, false);   // not focusable (default)
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

## Advanced Features

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

```typescript
const list = createComponent({
  id: "log",
  scrollable: true, // enables Up/Down keyboard scrolling when focused
  // ...
});

app.add(list, true); // focusable for keyboard control

// Programmatic scrolling
list.scrollTo(10);
list.scrollBy(5);
```

A visual scroll indicator (track + thumb) appears when content overflows.

### Overlays

```typescript
const modal = createComponent({
  id: "modal",
  position: { x: 10, y: 5 },
  width: 40,
  height: 10,
  // ...
});

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

The package includes 4 runnable demos showcasing the library features:

```sh
# From libs/cligrid/
pnpm demo:dashboard    # Interactive dashboard with navigation menu
pnpm demo:form         # Form with input fields, select list, focus management
pnpm demo:advanced     # State store, scrolling, overlays, live updates
pnpm demo:castle       # ASCII art castle with lightning animation
```

## API Reference

### Core

| Export | Description |
|--------|-------------|
| `App` | Main application orchestrator (manages rendering, input, focus, state) |
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

### Utilities

| Export | Description |
|--------|-------------|
| `stylize()` | Apply ANSI styles to text |
| `fgCode()` / `bgCode()` | Get ANSI color codes |
| `InputManager` | Low-level keyboard input |
| `FocusManager` | Focus navigation |
| `ScreenBuffer` | Double-buffered screen |

### Types

`Style`, `ComponentConfig`, `RenderContext`, `RenderOutput`, `RenderLine`, `Position`, `Size`, `KeyEvent`, `TerminalDimensions`, `StyleAttrs`

## License

MIT
