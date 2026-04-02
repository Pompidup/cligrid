# @pompidup/cligrid

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
