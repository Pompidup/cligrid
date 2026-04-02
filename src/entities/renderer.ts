import type { TerminalDimensions } from "../port/terminalDimensions.js";
import type { Template } from "./template.js";
import type { Component, RenderOutput, RenderLine, RenderContext } from "./component.js";
import type { Theme } from "./theme.js";
import { ScreenBuffer } from "./screenBuffer.js";
import { BORDER_CHARS, getBoxInsets } from "./style.js";
import { stylize } from "../utils/ansi.js";
import { applySegmentOverflow, segmentsWidth } from "../utils/text.js";
import { stringWidth } from "../utils/stringWidth.js";
import type { SegmentLine } from "../utils/text.js";
import { resolveThemeColor } from "./theme.js";
import { getTerminalDimensions } from "./../../config/terminalDimensionsFactory.js";

class Renderer {
  private terminalWidth: number;
  private terminalHeight: number;
  private template: Template;
  private resizeHandler: () => void;
  private componentListeners: Map<string, (updatedComponent: Component) => void> =
    new Map();
  private frontBuffer: ScreenBuffer;
  private backBuffer: ScreenBuffer;
  private _theme: Theme | null = null;
  private _focusedId: string | null = null;

  constructor(
    template: Template,
    terminalDimensions: TerminalDimensions = getTerminalDimensions()
  ) {
    this.terminalWidth = terminalDimensions.getWidth();
    this.terminalHeight = terminalDimensions.getHeight();
    this.template = template;

    this.frontBuffer = new ScreenBuffer(this.terminalWidth, this.terminalHeight);
    this.backBuffer = new ScreenBuffer(this.terminalWidth, this.terminalHeight);

    this.resizeHandler = () => {
      const { columns, rows } = process.stdout;
      this.terminalWidth = columns;
      this.terminalHeight = rows;
      this.frontBuffer.resize(columns, rows);
      this.backBuffer.resize(columns, rows);
      this.fullClear();
      this.render();
    };
    process.stdout.on("resize", this.resizeHandler);

    this.addListeners();

    this.template.on("componentAdded", (component: Component) => {
      this.addComponentListenerTree(component);
    });

    this.template.on("componentRemoved", (component: Component) => {
      this.removeComponentListener(component);
    });
  }

  render(): void {
    this.template.updateLayout(this.terminalWidth, this.terminalHeight);

    this.backBuffer.clear();

    const sorted = [...this.template.components].sort((a, b) => a.zIndex - b.zIndex);
    for (const component of sorted) {
      this.drawComponentTree(component);
    }

    this.flush();
  }

  partialRender(component: Component): void {
    if (!component.absolutePosition) {
      return;
    }

    const { x, y, width, height } = component.absolutePosition;
    this.backBuffer.clearRegion(x, y, width, height);
    this.drawComponentTree(component);
    this.flush();
  }

  fullClear(): void {
    this.frontBuffer.clear();
    this.backBuffer.clear();
    console.clear();
  }

  setTheme(theme: Theme | null): void {
    this._theme = theme;
  }

  get theme(): Theme | null {
    return this._theme;
  }

  setFocusedId(id: string | null): void {
    this._focusedId = id;
  }

  destroy(): void {
    process.stdout.removeListener("resize", this.resizeHandler);

    for (const [componentId, handler] of this.componentListeners) {
      const component = this.template.components.find((c) => c.id === componentId);
      if (component) {
        component.removeListener("propsChanged", handler);
      }
    }
    this.componentListeners.clear();
  }

  private flush(): void {
    const changes = this.backBuffer.diff(this.frontBuffer);

    if (changes.length === 0) return;

    let output = "";
    let lastX = -1;
    let lastY = -1;

    for (const change of changes) {
      const { cell } = change;
      // Skip shadow cells (placeholders for wide characters)
      if (cell.char === "") continue;
      if (change.y !== lastY || change.x !== lastX + 1) {
        output += `\x1b[${change.y + 1};${change.x + 1}H`;
      }
      const hasStyle = cell.fg || cell.bg || cell.bold || cell.dim || cell.underline || cell.italic || cell.strikethrough || cell.inverse;
      output += hasStyle ? stylize(cell.char, cell) : cell.char;
      lastX = change.x;
      lastY = change.y;
    }

    if (output.length > 0) {
      process.stdout.write(output);
    }

    this.frontBuffer = this.backBuffer.clone();
  }

  private addListeners() {
    for (const component of this.template.components) {
      this.addComponentListenerTree(component);
    }
  }

  private addComponentListenerTree(component: Component) {
    this.addComponentListener(component);
    for (const child of component.children) {
      this.addComponentListenerTree(child);
    }
  }

  private addComponentListener(component: Component) {
    if (this.componentListeners.has(component.id)) {
      return;
    }
    const handler = (updatedComponent: Component) => {
      this.partialRender(updatedComponent);
    };
    component.on("propsChanged", handler);
    this.componentListeners.set(component.id, handler);
  }

  private removeComponentListener(component: Component) {
    const handler = this.componentListeners.get(component.id);
    if (handler) {
      component.removeListener("propsChanged", handler);
      this.componentListeners.delete(component.id);
    }
  }

  private drawComponentTree(component: Component): void {
    this.drawComponentToBuffer(component);
    component.markClean();
    if (!component.mounted) {
      component.mount();
    }
    for (const child of component.children) {
      this.drawComponentTree(child);
    }
  }

  private resolveColor(color: string | undefined): string | undefined {
    return resolveThemeColor(color, this._theme);
  }

  private drawComponentToBuffer(component: Component): void {
    if (!component.absolutePosition) {
      return;
    }
    const { x, y, width, height } = component.absolutePosition;
    const isFocused = this._focusedId !== null && component.id === this._focusedId;

    // Merge focusStyle when focused
    let style = component.style;
    if (isFocused && component.focusStyle) {
      style = { ...style, ...component.focusStyle };
    }

    const insets = getBoxInsets(style);

    // Draw border if configured
    if (style?.border && style.border.style !== "none") {
      const chars = BORDER_CHARS[style.border.style];
      const borderFg = this.resolveColor(style.border.fg);
      const borderStyle = borderFg ? { fg: borderFg } : undefined;

      // Top border
      this.backBuffer.write(x, y, chars.topLeft + chars.horizontal.repeat(Math.max(0, width - 2)) + chars.topRight, borderStyle);
      // Bottom border
      this.backBuffer.write(x, y + height - 1, chars.bottomLeft + chars.horizontal.repeat(Math.max(0, width - 2)) + chars.bottomRight, borderStyle);
      // Side borders
      for (let row = 1; row < height - 1; row++) {
        this.backBuffer.write(x, y + row, chars.vertical, borderStyle);
        this.backBuffer.write(x + width - 1, y + row, chars.vertical, borderStyle);
      }
    }

    // Resolve theme colors for background
    const resolvedBg = this.resolveColor(style?.bg);

    // Draw background fill if configured
    if (resolvedBg) {
      for (let row = insets.top; row < height - insets.bottom; row++) {
        for (let col = insets.left; col < width - insets.right; col++) {
          this.backBuffer.write(x + col, y + row, " ", { bg: resolvedBg });
        }
      }
    }

    // Draw content inside insets
    const contentWidth = width - insets.left - insets.right;
    const contentHeight = height - insets.top - insets.bottom;
    const context: RenderContext = {
      width: contentWidth,
      height: contentHeight,
      focused: isFocused,
      hovered: component.hovered,
      terminalWidth: this.terminalWidth,
      terminalHeight: this.terminalHeight,
    };
    const output = component.render(context);

    // Resolve theme colors in base style
    const baseStyle = style ? {
      fg: this.resolveColor(style.fg),
      bg: this.resolveColor(style.bg),
      bold: style.bold,
      dim: style.dim,
      underline: style.underline,
      italic: style.italic,
      strikethrough: style.strikethrough,
      inverse: style.inverse,
    } : undefined;

    const renderLines = this.normalizeRenderOutput(output);
    const overflowMode = style?.overflow ?? "hidden";

    // Convert RenderLines to SegmentLines (merge line-level style into segments)
    const segmentLines: SegmentLine[] = renderLines.map((rl) => ({
      segments: (rl.segments ?? [{ text: rl.text, style: rl.style }]).map((seg) => ({
        text: seg.text,
        style: seg.style
          ? (rl.segments && rl.style ? { ...rl.style, ...seg.style } : seg.style)
          : (rl.segments ? rl.style : seg.style),
      })),
      align: rl.align,
    }));

    // Apply segment-aware overflow
    const processedLines = applySegmentOverflow(segmentLines, contentWidth, overflowMode);

    // Track total lines for scrollable components
    component.setTotalLines(processedLines.length);

    // Compute max line width for horizontal scroll tracking
    let maxLineWidth = 0;
    for (const line of processedLines) {
      const w = segmentsWidth(line.segments);
      if (w > maxLineWidth) maxLineWidth = w;
    }
    component.setTotalColumns(maxLineWidth);

    // Apply scroll offset
    const scrollOffset = component.scrollable ? component.scrollOffset : 0;
    const scrollXOffset = component.scrollable ? component.scrollXOffset : 0;
    const visibleLines = processedLines.slice(scrollOffset);

    for (let i = 0; i < visibleLines.length; i++) {
      const lineY = y + insets.top + i;
      if (lineY >= y + height - insets.bottom) break;

      const { segments, align } = visibleLines[i]!;
      const lineWidth = segmentsWidth(segments);

      // Calculate alignment offset
      let alignOffset = 0;
      if (align === "center") {
        alignOffset = Math.max(0, Math.floor((contentWidth - lineWidth) / 2));
      } else if (align === "right") {
        alignOffset = Math.max(0, contentWidth - lineWidth);
      }

      // Write each segment individually with merged styles, applying horizontal scroll
      let cursorX = x + insets.left + alignOffset;
      let consumedWidth = 0;
      for (const seg of segments) {
        // Resolve theme colors in segment styles
        const resolvedSegStyle = seg.style ? {
          ...seg.style,
          fg: this.resolveColor(seg.style.fg) ?? seg.style.fg,
          bg: this.resolveColor(seg.style.bg) ?? seg.style.bg,
        } : undefined;
        const segStyle = resolvedSegStyle ? { ...baseStyle, ...resolvedSegStyle } : baseStyle;
        const segW = stringWidth(seg.text);

        if (scrollXOffset > 0 && consumedWidth + segW > scrollXOffset) {
          // Partially visible segment
          const skipChars = Math.max(0, scrollXOffset - consumedWidth);
          const visibleText = seg.text.slice(skipChars);
          this.backBuffer.write(cursorX, lineY, visibleText, segStyle);
          cursorX += stringWidth(visibleText);
        } else if (consumedWidth >= scrollXOffset) {
          // Fully visible segment
          this.backBuffer.write(cursorX, lineY, seg.text, segStyle);
          cursorX += segW;
        }
        consumedWidth += segW;
      }
    }

    // Draw vertical scroll indicator if scrollable and content overflows
    if (component.scrollable && processedLines.length > contentHeight && contentHeight > 0) {
      this.drawScrollIndicator(
        x + width - 1 - (insets.right > 0 ? 1 : 0),
        y + insets.top,
        contentHeight,
        scrollOffset,
        processedLines.length,
        style?.dim ? { dim: true } : undefined
      );
    }

    // Draw horizontal scroll indicator if scrollable and content wider than viewport
    if (component.scrollable && maxLineWidth > contentWidth && contentWidth > 0) {
      this.drawHorizontalScrollIndicator(
        x + insets.left,
        y + height - 1 - (insets.bottom > 0 ? 1 : 0),
        contentWidth,
        scrollXOffset,
        maxLineWidth,
      );
    }
  }

  private drawScrollIndicator(
    colX: number,
    startY: number,
    trackHeight: number,
    scrollOffset: number,
    totalLines: number,
    indicatorStyle?: Record<string, any>
  ): void {
    if (trackHeight <= 0 || totalLines <= 0) return;

    const thumbSize = Math.max(1, Math.round((trackHeight / totalLines) * trackHeight));
    const maxOffset = totalLines - trackHeight;
    const thumbPos = maxOffset > 0
      ? Math.round((scrollOffset / maxOffset) * (trackHeight - thumbSize))
      : 0;

    for (let i = 0; i < trackHeight; i++) {
      const isThumb = i >= thumbPos && i < thumbPos + thumbSize;
      const char = isThumb ? "█" : "░";
      this.backBuffer.write(colX, startY + i, char, indicatorStyle);
    }
  }

  private drawHorizontalScrollIndicator(
    startX: number,
    rowY: number,
    trackWidth: number,
    scrollXOffset: number,
    totalColumns: number,
  ): void {
    if (trackWidth <= 0 || totalColumns <= 0) return;

    const thumbSize = Math.max(1, Math.round((trackWidth / totalColumns) * trackWidth));
    const maxOffset = totalColumns - trackWidth;
    const thumbPos = maxOffset > 0
      ? Math.round((scrollXOffset / maxOffset) * (trackWidth - thumbSize))
      : 0;

    for (let i = 0; i < trackWidth; i++) {
      const isThumb = i >= thumbPos && i < thumbPos + thumbSize;
      const char = isThumb ? "█" : "░";
      this.backBuffer.write(startX + i, rowY, char);
    }
  }

  private normalizeRenderOutput(output: RenderOutput): RenderLine[] {
    if (typeof output === "string") {
      return output.split("\n").map((text) => ({ text }));
    }
    if (Array.isArray(output)) {
      return output;
    }
    return [output];
  }
}

export { Renderer };
