import type { TerminalDimensions } from "../port/terminalDimensions.js";
import type { Template } from "./template.js";
import type { Component, RenderOutput, RenderLine, RenderContext } from "./component.js";
import { ScreenBuffer } from "./screenBuffer.js";
import { BORDER_CHARS, getBoxInsets } from "./style.js";
import { stylize } from "../utils/ansi.js";
import { applyOverflow } from "../utils/text.js";
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
      if (change.y !== lastY || change.x !== lastX + 1) {
        output += `\x1b[${change.y + 1};${change.x + 1}H`;
      }
      const { cell } = change;
      const hasStyle = cell.fg || cell.bg || cell.bold || cell.dim || cell.underline;
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

  private drawComponentToBuffer(component: Component): void {
    if (!component.absolutePosition) {
      return;
    }
    const { x, y, width, height } = component.absolutePosition;
    const style = component.style;
    const insets = getBoxInsets(style);

    // Draw border if configured
    if (style?.border && style.border.style !== "none") {
      const chars = BORDER_CHARS[style.border.style];
      const borderStyle = style.border.fg ? { fg: style.border.fg } : undefined;

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

    // Draw background fill if configured
    if (style?.bg) {
      for (let row = insets.top; row < height - insets.bottom; row++) {
        for (let col = insets.left; col < width - insets.right; col++) {
          this.backBuffer.write(x + col, y + row, " ", { bg: style.bg });
        }
      }
    }

    // Draw content inside insets
    const contentWidth = width - insets.left - insets.right;
    const contentHeight = height - insets.top - insets.bottom;
    const context: RenderContext = {
      width: contentWidth,
      height: contentHeight,
      focused: false,
      terminalWidth: this.terminalWidth,
      terminalHeight: this.terminalHeight,
    };
    const output = component.render(context);
    const baseStyle = style ? { fg: style.fg, bg: style.bg, bold: style.bold, dim: style.dim, underline: style.underline } : undefined;

    const renderLines = this.normalizeRenderOutput(output);
    const overflowMode = style?.overflow ?? "hidden";

    // Apply overflow to all text lines
    const rawTexts = renderLines.map((rl) => rl.text);
    const processedTexts = applyOverflow(rawTexts, contentWidth, overflowMode);

    // Map processed lines back to styles (wrap/wrap-word may produce more lines)
    const styledLines = this.mapProcessedLines(renderLines, processedTexts, overflowMode);

    // Track total lines for scrollable components
    component.setTotalLines(styledLines.length);

    // Apply scroll offset
    const scrollOffset = component.scrollable ? component.scrollOffset : 0;
    const visibleLines = styledLines.slice(scrollOffset);

    for (let i = 0; i < visibleLines.length; i++) {
      const lineY = y + insets.top + i;
      if (lineY >= y + height - insets.bottom) break;

      const { text, style: lineOverride } = visibleLines[i]!;
      const lineStyle = lineOverride
        ? { ...baseStyle, ...lineOverride }
        : baseStyle;
      this.backBuffer.write(x + insets.left, lineY, text, lineStyle);
    }

    // Draw scroll indicator if scrollable and content overflows
    if (component.scrollable && styledLines.length > contentHeight && contentHeight > 0) {
      this.drawScrollIndicator(
        x + width - 1 - (insets.right > 0 ? 1 : 0),
        y + insets.top,
        contentHeight,
        scrollOffset,
        styledLines.length,
        style?.dim ? { dim: true } : undefined
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

  private mapProcessedLines(
    original: RenderLine[],
    processed: string[],
    mode: string
  ): RenderLine[] {
    if (mode === "hidden" || mode === "ellipsis") {
      // 1:1 mapping — same number of lines
      return processed.map((text, i) => ({
        text,
        style: original[i]?.style,
      }));
    }

    // For wrap modes, lines may have expanded. Map expanded lines back to original styles.
    const result: RenderLine[] = [];
    let processedIdx = 0;

    for (const orig of original) {
      // Count how many processed lines this original line produced
      const origText = orig.text;
      let consumed = 0;
      let rebuilt = "";

      while (processedIdx < processed.length) {
        const chunk = processed[processedIdx]!;
        const nextRebuilt = rebuilt + (rebuilt.length > 0 ? " " : "") + chunk;

        // Check if we've consumed enough characters for this original line
        // Use raw length comparison: when all chars of origText are covered
        consumed += chunk.length;
        result.push({ text: chunk, style: orig.style });
        processedIdx++;

        if (consumed >= origText.length) break;
        rebuilt = nextRebuilt;
      }
    }

    // Any remaining processed lines (shouldn't happen, but safety)
    while (processedIdx < processed.length) {
      result.push({ text: processed[processedIdx]! });
      processedIdx++;
    }

    return result;
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
