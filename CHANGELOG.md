# @pompidup/cligrid

## 2.0.0

### Major Changes

Major release with new components, input paradigms, theming, and animation.

#### New Components
- **Table** — data table with column alignment (left/center/right), bold/underline headers, separators, and vertical scroll support
- **Spinner** — animated loading indicator with 4 styles: `dots`, `line`, `arc`, `bouncingBar`. Auto-advances frames on mount
- **Tabs** — tab navigation with Left/Right keyboard control, `onTabChange` callback, wrap-around navigation
- **Modal** — dialog with title, body, navigable buttons (Left/Right/Enter/Escape), designed for `app.showOverlay()`
- **Checkbox** — toggle input with `[✓]/[ ]` rendering, Space/Enter to toggle, `onChange` callback

#### Animation System
- Built-in `Animator` with `app.animate(component, propsTarget, options)` for property animation
- `app.tick(callback)` for frame-based callbacks
- 6 easing functions: `linear`, `easeIn`, `easeOut`, `easeInOut`, `bounce`, `elastic`
- Batch rendering with dirty-component accumulation per frame

#### Mouse Support
- Enable with `new App({ mouse: true })`
- SGR mouse protocol parsing (click, release, move, scroll)
- Hit-testing via component `absolutePosition`
- Events: `click`, `mousedown`, `mouseup`, `mousemove`, `scroll` on target components
- Hover detection: `mouseenter`/`mouseleave` events, `hovered` property on components
- `hovered: boolean` in `RenderContext` for hover-aware rendering

#### Theme System
- Design tokens: `primary`, `secondary`, `danger`, `success`, `warning`, `surface`, `text`, `border`, `muted`, `accent`
- Built-in `darkTheme` and `lightTheme` presets
- `app.setTheme(theme)` / `app.getTheme()` for runtime theme switching
- Token resolution in renderer — use `fg: "primary"` instead of hardcoded colors

#### Layout Enhancements
- **Gap** — `gap` property for flex layout spacing between children
- **Min/Max dimensions** — `minWidth`, `maxWidth`, `minHeight`, `maxHeight` constraints
- **Justify content** — `justifyContent: "start" | "center" | "end" | "space-between" | "space-around"`
- **Align items** — `alignItems: "start" | "center" | "end" | "stretch"`

#### Styling Enhancements
- **Italic, strikethrough, inverse** text styles
- **Unicode width-aware rendering** — correct layout for emoji, CJK characters, zero-width joiners
- **Focus visible** — `focusStyle` on components for automatic visual focus indicators
- **Color utilities** — `gradient()`, `lighten()`, `darken()`, `mix()` for programmatic color manipulation
- **Horizontal scrolling** — `scrollToX()`, `scrollByX()`, Left/Right keyboard control, visual indicator

#### Other
- v2 showcase demo (`pnpm demo:showcase`) combining all new features

## 1.1.0

### Minor Changes

- **Styled segments** — new `segments` field on `RenderLine` allows multiple styles within a single line via `StyledSegment[]`. Each segment has its own `fg`, `bg`, `bold`, `dim`, `underline`. The line-level `style` acts as a base for all segments.
- **Text alignment** — new `align` field on `RenderLine` supports `"left"` (default), `"center"`, and `"right"` alignment within the component's content area. Works with both plain text and segments.
- **Segment-aware overflow** — `hidden`, `ellipsis`, `wrap`, and `wrap-word` overflow modes now correctly handle segments, truncating and wrapping across segment boundaries while preserving individual styles.
- **New demo** — `pnpm demo:segments` showcases color palettes, log-level badges, text alignment, combined segments + alignment, and segment overflow with ellipsis.

## 1.0.1

### Patch Changes

- d010a3f: Extract cligrid to dedicated repository, update repository and homepage URLs, add CI/CD with GitHub Actions and OIDC trusted publisher for npm releases.

## 1.0.0

### Major Changes

First stable release. The library has been transformed from a rendering engine into a full terminal UI framework.

#### New Features

- **Functional components** — `createComponent()` factory to build components without class boilerplate
- **RenderContext** — `render()` now receives context with computed dimensions (`width`, `height`, `terminalWidth`, `terminalHeight`)
- **Text overflow modes** — `hidden`, `ellipsis`, `wrap`, `wrap-word` via `style.overflow`
- **Scrolling** — `scrollable` property, `scrollTo()`/`scrollBy()` methods, keyboard control (Up/Down when focused), visual scroll indicator
- **Built-in components** — `TextBox`, `SelectList`, `ProgressBar`, `InputField` ready to use
- **Event bubbling** — keyboard events propagate from child to parent, stoppable via `event.handled = true`
- **Declarative key handlers** — `onKeyPress` in ComponentConfig
- **Z-index system** — components sorted by `zIndex` for layered rendering
- **Overlay helpers** — `app.showOverlay()` / `app.hideOverlay()` with automatic focus save/restore
- **Lifecycle hooks** — `onMount`, `onDestroy`, `onResize` on components
- **Reactive state store** — `app.setState()`, `app.connect()`, `app.disconnect()` for automatic component updates
- **Demo folder** — 4 runnable demos (dashboard, form, advanced, castle)

#### Fixes

- Out-of-bounds warning now emits an event instead of `console.warn`, preventing stdout corruption during alternate screen rendering

## 0.2.1

### Patch Changes

- Add missing information in package.json

## 0.2.0

### Minor Changes

- Remove unused package, make margin optional with default value to 1, update and fix example in README

## 0.1.0

### Minor Changes

- Initial release
