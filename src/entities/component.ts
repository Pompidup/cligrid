import EventEmitter from "node:events";
import type { Style } from "./style.js";
import type { KeyEvent } from "./inputManager.js";
import { getBoxInsets } from "./style.js";

type Size = {
  value: number;
  unit: "px" | "%" | "auto";
};

type SizeInput = Size | number | string | "auto";

type LayoutDirection = "row" | "column" | "none";

type Position = {
  x: {
    position: number | "left" | "right";
    relativeTo?: string;
  };
  y: {
    position: number | "top" | "bottom";
    relativeTo?: string;
  };
};

type PositionInput = Position | { x: number; y: number };

type Props = Record<string, any>;

type AbsolutePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RenderLine = { text: string; style?: Partial<Style> };
type RenderOutput = string | RenderLine | RenderLine[];

type RenderContext = {
  width: number;
  height: number;
  focused: boolean;
  terminalWidth: number;
  terminalHeight: number;
};

type ComponentConfig<P extends Props = {}> = {
  id: string;
  name?: string;
  position: PositionInput;
  width: SizeInput;
  height: SizeInput;
  props?: P;
  margin?: number;
  style?: Style;
  children?: Component[];
  layout?: LayoutDirection;
  flex?: number;
  scrollable?: boolean;
  zIndex?: number;
  onKeyPress?: (event: KeyEvent, component: Component<P>) => void;
};

function parseSize(input: SizeInput): Size {
  if (typeof input === "number") {
    return { value: input, unit: "px" };
  }
  if (typeof input === "string") {
    if (input === "auto") {
      return { value: 0, unit: "auto" };
    }
    if (input.endsWith("%")) {
      return { value: parseInt(input, 10), unit: "%" };
    }
    return { value: parseInt(input, 10), unit: "px" };
  }
  return input;
}

function parsePosition(input: PositionInput): Position {
  if ("x" in input && "y" in input) {
    const ix = input.x;
    const iy = input.y;
    // Short form: { x: number, y: number }
    if (typeof ix === "number" && typeof iy === "number") {
      return {
        x: { position: ix },
        y: { position: iy },
      };
    }
  }
  return input as Position;
}

abstract class Component<P extends Props = {}> extends EventEmitter {
  readonly id: string;
  readonly name: string;
  position: Position;
  width: Size;
  height: Size;
  margin: number;
  style?: Style;
  layout: LayoutDirection;
  flex?: number;
  scrollable: boolean;
  zIndex: number;
  private _mounted: boolean = false;
  private _scrollOffset: number = 0;
  private _totalLines: number = 0;
  private _absolutePosition?: AbsolutePosition;
  props: P;
  private isDirty: boolean = true;
  private _children: Component[] = [];
  private _parent?: Component;

  constructor(config: ComponentConfig<P>);
  constructor(
    id: string,
    name: string,
    position: Position,
    width: Size,
    height: Size,
    props: P,
    margin?: number,
    style?: Style
  );
  constructor(
    idOrConfig: string | ComponentConfig<P>,
    name?: string,
    position?: Position,
    width?: Size,
    height?: Size,
    props?: P,
    margin?: number,
    style?: Style
  ) {
    super();

    if (typeof idOrConfig === "object") {
      const config = idOrConfig;
      this.id = config.id;
      this.name = config.name ?? config.id;
      this.position = parsePosition(config.position);
      this.width = parseSize(config.width);
      this.height = parseSize(config.height);
      this.props = (config.props ?? {}) as P;
      this.margin = config.margin ?? 1;
      this.style = config.style;
      this.layout = config.layout ?? "none";
      this.flex = config.flex;
      this.scrollable = config.scrollable ?? false;
      this.zIndex = config.zIndex ?? 0;
      if (config.onKeyPress) {
        this.on("keypress", (event: KeyEvent) => {
          config.onKeyPress!(event, this);
        });
      }
      if (config.children) {
        for (const child of config.children) {
          this.addChild(child);
        }
      }
    } else {
      this.id = idOrConfig;
      this.name = name!;
      this.position = position!;
      this.width = width!;
      this.height = height!;
      this.props = props!;
      this.margin = margin ?? 1;
      this.style = style;
      this.layout = "none";
      this.scrollable = false;
      this.zIndex = 0;
    }
  }

  get absolutePosition(): AbsolutePosition | undefined {
    return this._absolutePosition;
  }

  setAbsolutePosition(pos: AbsolutePosition): void {
    this._absolutePosition = pos;
  }

  abstract render(context?: RenderContext): RenderOutput;

  setProps(newProps: Partial<P>) {
    const hasChanges = Object.keys(newProps).some(
      (key) => newProps[key as keyof P] !== this.props[key as keyof P]
    );
    if (hasChanges) {
      this.props = { ...this.props, ...newProps };
      this.markDirty();
      this.emit("propsChanged", this);
    }
  }

  needsRender(): boolean {
    return this.isDirty;
  }

  markClean() {
    this.isDirty = false;
  }

  markDirty() {
    this.isDirty = true;
  }

  get children(): readonly Component[] {
    return this._children;
  }

  get parent(): Component | undefined {
    return this._parent;
  }

  addChild(child: Component): void {
    if (child._parent) {
      throw new Error(
        `Component "${child.id}" already has a parent "${child._parent.id}"`
      );
    }
    if (this._children.some((c) => c.id === child.id)) {
      throw new Error(
        `Component "${this.id}" already has a child with id "${child.id}"`
      );
    }
    child._parent = this;
    this._children.push(child);
    this.emit("childAdded", child);
  }

  removeChild(id: string): void {
    const index = this._children.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(
        `Component "${this.id}" has no child with id "${id}"`
      );
    }
    const [removed] = this._children.splice(index, 1);
    removed!._parent = undefined;
    this.emit("childRemoved", removed);
  }

  get mounted(): boolean {
    return this._mounted;
  }

  mount(): void {
    if (!this._mounted) {
      this._mounted = true;
      this.emit("mount");
    }
  }

  unmount(): void {
    if (this._mounted) {
      this._mounted = false;
      this.emit("destroy");
    }
  }

  onResize(width: number, height: number): void {
    this.emit("resize", width, height);
  }

  get scrollOffset(): number {
    return this._scrollOffset;
  }

  get totalLines(): number {
    return this._totalLines;
  }

  setTotalLines(total: number): void {
    this._totalLines = total;
  }

  scrollTo(offset: number): void {
    const maxOffset = Math.max(0, this._totalLines - this.getContentHeight());
    this._scrollOffset = Math.max(0, Math.min(offset, maxOffset));
    this.markDirty();
    this.emit("scroll", this._scrollOffset);
    this.emit("propsChanged", this);
  }

  scrollBy(delta: number): void {
    this.scrollTo(this._scrollOffset + delta);
  }

  private getContentHeight(): number {
    if (!this._absolutePosition) return 0;
    const insets = getBoxInsets(this.style);
    return this._absolutePosition.height - insets.top - insets.bottom;
  }

  getActualDimensions(terminalWidth: number, terminalHeight: number) {
    if (this._absolutePosition) {
      return {
        width: this._absolutePosition.width,
        height: this._absolutePosition.height,
      };
    }

    return {
      width:
        this.width.unit === "%"
          ? Math.ceil((this.width.value / 100) * terminalWidth)
          : this.width.value,
      height:
        this.height.unit === "%"
          ? Math.ceil((this.height.value / 100) * terminalHeight)
          : this.height.value,
    };
  }
}

export type { Size, SizeInput, Position, PositionInput, Props, AbsolutePosition, RenderLine, RenderOutput, RenderContext, ComponentConfig, LayoutDirection };
export { Component, parseSize, parsePosition };
