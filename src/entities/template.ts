import EventEmitter from "node:events";
import { getTerminalDimensions } from "./../../config/terminalDimensionsFactory.js";
import type { TerminalDimensions } from "src/port/terminalDimensions.js";
import type { Component, AbsolutePosition, Size } from "./component.js";
import { getBoxInsets } from "./style.js";

class Template extends EventEmitter {
  private _components: Component[] = [];
  private _terminalWidth: number;
  private _terminalHeight: number;

  constructor(
    terminalDimensions: TerminalDimensions = getTerminalDimensions()
  ) {
    super();
    this._terminalWidth = terminalDimensions.getWidth();
    this._terminalHeight = terminalDimensions.getHeight();
  }

  get components(): readonly Component[] {
    return this._components;
  }

  get terminalWidth(): number {
    return this._terminalWidth;
  }

  get terminalHeight(): number {
    return this._terminalHeight;
  }

  addComponent(component: Component): void {
    this._components.push(component);
    this.emit("componentAdded", component);
  }

  removeComponent(id: string): void {
    const dependents = this._components.filter(
      (c) =>
        c.position.x.relativeTo === id || c.position.y.relativeTo === id
    );
    if (dependents.length > 0) {
      const names = dependents.map((c) => c.id).join(", ");
      throw new Error(
        `Cannot remove component "${id}": components [${names}] depend on it via relativeTo`
      );
    }

    const index = this._components.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Component "${id}" not found`);
    }

    const [removed] = this._components.splice(index, 1);
    removed!.unmount();
    this.emit("componentRemoved", removed);
  }

  private calculateAbsolutePosition(
    component: Component,
    visited: Set<string> = new Set(),
    cache: Map<string, { x: number; y: number; width: number; height: number }> = new Map()
  ) {
    const cached = cache.get(component.id);
    if (cached) {
      return cached;
    }

    if (visited.has(component.id)) {
      throw new Error(
        `Circular relative positioning detected: component "${component.id}" references itself in the chain [${[...visited].join(" -> ")} -> ${component.id}]`
      );
    }
    visited.add(component.id);

    let x = 0,
      y = 0,
      width = 0,
      height = 0;

    width =
      component.width.unit === "%"
        ? Math.ceil((component.width.value / 100) * this.terminalWidth)
        : component.width.value;

    if (component.height.unit === "auto") {
      height = this.computeAutoHeight(component, this.terminalHeight);
    } else {
      height =
        component.height.unit === "%"
          ? Math.ceil((component.height.value / 100) * this.terminalHeight)
          : component.height.value;
    }

    if (typeof component.position.x.position === "number") {
      x = component.position.x.position + component.margin;
    }
    if (typeof component.position.y.position === "number") {
      y = component.position.y.position + component.margin;
    }

    if (component.position.x.relativeTo) {
      const parent = this.components.find(
        (c) => c.id === component.position.x.relativeTo
      );
      if (!parent) {
        throw new Error(
          `Component "${component.id}" references relativeTo "${component.position.x.relativeTo}" on X axis, but no component with that id was not found`
        );
      }
      const parentPosition = this.calculateAbsolutePosition(parent, new Set(visited), cache);
      if (component.position.x.position === "right") {
        x = Math.ceil(
          parentPosition.x -
            parent.margin +
            parentPosition.width +
            component.margin
        );
      } else if (component.position.x.position === "left") {
        x = Math.ceil(
          parentPosition.x - parent.margin - width + component.margin
        );
      }
    }

    if (component.position.y.relativeTo) {
      const parent = this.components.find(
        (c) => c.id === component.position.y.relativeTo
      );
      if (!parent) {
        throw new Error(
          `Component "${component.id}" references relativeTo "${component.position.y.relativeTo}" on Y axis, but no component with that id was not found`
        );
      }
      const parentPosition = this.calculateAbsolutePosition(parent, new Set(visited), cache);
      if (component.position.y.position === "bottom") {
        y = Math.ceil(
          parentPosition.y -
            parent.margin +
            parentPosition.height +
            component.margin
        );
      } else if (component.position.y.position === "top") {
        y = Math.ceil(
          parentPosition.y - parent.margin - height + component.margin
        );
      }
    }

    const result = { x, y, width, height };
    cache.set(component.id, result);
    return result;
  }

  updateLayout(terminalWidth: number, terminalHeight: number) {
    this._terminalWidth = terminalWidth;
    this._terminalHeight = terminalHeight;

    const cache = new Map<string, { x: number; y: number; width: number; height: number }>();

    this.components.forEach((component) => {
      const { x, y, width, height } = this.calculateAbsolutePosition(component, new Set(), cache);
      const prev = component.absolutePosition;
      component.setAbsolutePosition({ x, y, width, height });
      component.markDirty();

      // Notify on dimension change (resize)
      if (prev && (prev.width !== width || prev.height !== height)) {
        component.onResize(width, height);
      }

      if (
        x < 0 ||
        y < 0 ||
        x + width > this.terminalWidth ||
        y + height > this.terminalHeight
      ) {
        this.emit("warning", {
          componentId: component.id,
          message: `Component "${component.id}" is positioned out of bounds: x=${x}, y=${y}, w=${width}, h=${height} (terminal: ${this.terminalWidth}x${this.terminalHeight})`,
        });
      }

      // Calculate children positions recursively
      if (component.children.length > 0) {
        this.calculateChildrenPositions(component);
      }
    });
  }

  private calculateChildrenPositions(parent: Component): void {
    const parentPos = parent.absolutePosition;
    if (!parentPos) return;

    const insets = getBoxInsets(parent.style);
    const contentX = parentPos.x + insets.left;
    const contentY = parentPos.y + insets.top;
    const contentWidth = parentPos.width - insets.left - insets.right;
    const contentHeight = parentPos.height - insets.top - insets.bottom;

    if (parent.layout === "row" || parent.layout === "column") {
      this.calculateFlexLayout(parent, contentX, contentY, contentWidth, contentHeight);
    } else {
      this.calculateFreeLayout(parent, contentX, contentY, contentWidth, contentHeight);
    }
  }

  private calculateFreeLayout(
    parent: Component,
    contentX: number,
    contentY: number,
    contentWidth: number,
    contentHeight: number
  ): void {
    for (const child of parent.children) {
      let childWidth = this.resolveChildSize(child.width, contentWidth);
      let childHeight = this.resolveChildSize(child.height, contentHeight);

      // Auto-height: compute from render output
      if (child.height.unit === "auto") {
        childHeight = this.computeAutoHeight(child, contentHeight);
      }

      // Apply min/max constraints
      childWidth = this.clampSize(childWidth, child.minWidth, child.maxWidth, contentWidth);
      childHeight = this.clampSize(childHeight, child.minHeight, child.maxHeight, contentHeight);

      let childX = contentX;
      let childY = contentY;

      if (typeof child.position.x.position === "number") {
        childX = contentX + child.position.x.position + child.margin;
      }
      if (typeof child.position.y.position === "number") {
        childY = contentY + child.position.y.position + child.margin;
      }

      const clippedWidth = Math.min(childWidth, contentX + contentWidth - childX);
      const clippedHeight = Math.min(childHeight, contentY + contentHeight - childY);

      child.setAbsolutePosition({
        x: childX,
        y: childY,
        width: Math.max(0, clippedWidth),
        height: Math.max(0, clippedHeight),
      });
      child.markDirty();

      if (child.children.length > 0) {
        this.calculateChildrenPositions(child);
      }
    }
  }

  private calculateFlexLayout(
    parent: Component,
    contentX: number,
    contentY: number,
    contentWidth: number,
    contentHeight: number
  ): void {
    const isRow = parent.layout === "row";
    const totalSpace = isRow ? contentWidth : contentHeight;
    const gap = parent.gap;

    // First pass: compute fixed sizes and total flex
    let fixedSpace = 0;
    let totalFlex = 0;

    const childSizes: { width: number; height: number }[] = [];

    for (const child of parent.children) {
      const margin = child.margin;
      let w = this.resolveChildSize(child.width, contentWidth);
      let h = this.resolveChildSize(child.height, contentHeight);

      if (child.height.unit === "auto") {
        h = this.computeAutoHeight(child, contentHeight);
      }

      // Apply min/max constraints to non-flex children in Pass 1
      if (!(child.flex !== undefined && child.flex > 0)) {
        w = this.clampSize(w, child.minWidth, child.maxWidth, contentWidth);
        h = this.clampSize(h, child.minHeight, child.maxHeight, contentHeight);
      }

      if (child.flex !== undefined && child.flex > 0) {
        totalFlex += child.flex;
        // Margin still takes space in the main axis
        if (isRow) {
          fixedSpace += margin * 2;
        } else {
          fixedSpace += margin * 2;
        }
        childSizes.push({ width: w, height: h });
      } else {
        if (isRow) {
          fixedSpace += w + margin * 2;
        } else {
          fixedSpace += h + margin * 2;
        }
        childSizes.push({ width: w, height: h });
      }
    }

    // Account for gap between children
    const totalGap = gap * Math.max(0, parent.children.length - 1);
    fixedSpace += totalGap;

    const remainingSpace = Math.max(0, totalSpace - fixedSpace);

    // Second pass: resolve final sizes
    const resolvedSizes: { width: number; height: number }[] = [];
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i]!;
      let { width: childWidth, height: childHeight } = childSizes[i]!;

      if (child.flex !== undefined && child.flex > 0 && totalFlex > 0) {
        const flexSize = Math.floor((child.flex / totalFlex) * remainingSpace);
        if (isRow) {
          childWidth = flexSize;
        } else {
          childHeight = flexSize;
        }
      }

      childWidth = this.clampSize(childWidth, child.minWidth, child.maxWidth, contentWidth);
      childHeight = this.clampSize(childHeight, child.minHeight, child.maxHeight, contentHeight);

      // Apply alignItems stretch on cross axis
      if (parent.alignItems === "stretch") {
        if (isRow) {
          childHeight = contentHeight - child.margin * 2;
        } else {
          childWidth = contentWidth - child.margin * 2;
        }
      }

      resolvedSizes.push({ width: childWidth, height: childHeight });
    }

    // Compute total consumed main-axis space for justify
    let totalConsumed = 0;
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i]!;
      const mainSize = isRow ? resolvedSizes[i]!.width : resolvedSizes[i]!.height;
      totalConsumed += mainSize + child.margin * 2;
    }
    totalConsumed += totalGap;

    const freeSpace = Math.max(0, totalSpace - totalConsumed);
    const childCount = parent.children.length;
    const justify = parent.justifyContent;

    // Calculate justify offsets
    let justifyStart = 0;
    let justifyGap = 0;
    if (justify === "center") {
      justifyStart = Math.floor(freeSpace / 2);
    } else if (justify === "end") {
      justifyStart = freeSpace;
    } else if (justify === "space-between" && childCount > 1) {
      justifyGap = freeSpace / (childCount - 1);
    } else if (justify === "space-around" && childCount > 0) {
      justifyGap = freeSpace / childCount;
      justifyStart = Math.floor(justifyGap / 2);
    }

    // Third pass: assign positions
    let cursor = justifyStart;
    const crossSpace = isRow ? contentHeight : contentWidth;
    const align = parent.alignItems;

    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i]!;
      const margin = child.margin;
      const { width: childWidth, height: childHeight } = resolvedSizes[i]!;

      let childX: number;
      let childY: number;

      if (isRow) {
        childX = contentX + cursor + margin;
        const crossSize = childHeight;
        childY = contentY + this.alignOnCross(align, crossSize, crossSpace, margin);
        cursor += childWidth + margin * 2;
      } else {
        const crossSize = childWidth;
        childX = contentX + this.alignOnCross(align, crossSize, crossSpace, margin);
        childY = contentY + cursor + margin;
        cursor += childHeight + margin * 2;
      }

      // Add gap + justify gap after each child except the last
      if (i < parent.children.length - 1) {
        cursor += gap + justifyGap;
      }

      // Clip to parent content area
      const clippedWidth = Math.min(childWidth, contentX + contentWidth - childX);
      const clippedHeight = Math.min(childHeight, contentY + contentHeight - childY);

      child.setAbsolutePosition({
        x: childX,
        y: childY,
        width: Math.max(0, clippedWidth),
        height: Math.max(0, clippedHeight),
      });
      child.markDirty();

      if (child.children.length > 0) {
        this.calculateChildrenPositions(child);
      }
    }
  }

  private alignOnCross(align: string, childSize: number, crossSpace: number, margin: number): number {
    switch (align) {
      case "center":
        return Math.floor((crossSpace - childSize) / 2);
      case "end":
        return crossSpace - childSize - margin;
      case "stretch":
        return margin;
      default: // "start"
        return margin;
    }
  }

  private clampSize(value: number, min: Size | undefined, max: Size | undefined, parentSize: number): number {
    if (min) value = Math.max(value, this.resolveChildSize(min, parentSize));
    if (max) value = Math.min(value, this.resolveChildSize(max, parentSize));
    return value;
  }

  private resolveChildSize(size: { value: number; unit: string }, parentSize: number): number {
    if (size.unit === "%") {
      return Math.ceil((size.value / 100) * parentSize);
    }
    if (size.unit === "auto") {
      return 0;
    }
    return size.value;
  }

  private computeAutoHeight(child: Component, maxHeight: number): number {
    const output = child.render();
    const childInsets = getBoxInsets(child.style);
    let lines: number;

    if (typeof output === "string") {
      lines = output.split("\n").length;
    } else if (Array.isArray(output)) {
      lines = output.length;
    } else {
      lines = 1;
    }

    return Math.min(lines + childInsets.top + childInsets.bottom, maxHeight);
  }
}

export { Template };
