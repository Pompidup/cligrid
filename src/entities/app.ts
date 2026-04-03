import type { Component } from "./component.js";
import type { KeyEvent, MouseEvent } from "./inputManager.js";
import type { TerminalDimensions } from "../port/terminalDimensions.js";
import type { EasingFn } from "../utils/easing.js";
import type { AnimationId } from "./animator.js";
import type { Theme } from "./theme.js";
import { Template } from "./template.js";
import { Renderer } from "./renderer.js";
import { InputManager } from "./inputManager.js";
import { FocusManager } from "./focusManager.js";
import { Animator } from "./animator.js";
import { getTerminalDimensions } from "../../config/terminalDimensionsFactory.js";

type AppOptions = {
  terminalDimensions?: TerminalDimensions;
  alternateScreen?: boolean;
  mouse?: boolean;
};

class App {
  private template: Template;
  private renderer: Renderer;
  private inputManager: InputManager;
  private focusManager: FocusManager;
  private animator: Animator;
  private keyHandlers: Map<string, (() => void)[]> = new Map();
  private running = false;
  private useAlternateScreen: boolean;
  private useMouse: boolean;
  private signalHandlers: (() => void)[] = [];
  private previousFocus?: Component;
  private overlays: Set<string> = new Set();
  private _state: Record<string, any> = {};
  private connectedComponents: Map<string, { component: Component; selector: (state: Record<string, any>) => Record<string, any> }> = new Map();
  private _hoveredComponent: Component | null = null;

  constructor(options: AppOptions = {}) {
    const dims = options.terminalDimensions ?? getTerminalDimensions();
    this.useAlternateScreen = options.alternateScreen ?? false;
    this.useMouse = options.mouse ?? false;

    this.template = new Template(dims);
    this.renderer = new Renderer(this.template, dims);
    this.inputManager = new InputManager();
    this.focusManager = new FocusManager();
    this.animator = new Animator();

    this.animator.onFrame(() => {
      if (this.running) {
        this.renderer.render();
      }
    });

    this.inputManager.on("keypress", (event: KeyEvent) => {
      // Check global key handlers first
      const combo = this.keyCombo(event);
      const handlers = this.keyHandlers.get(combo);
      if (handlers && handlers.length > 0) {
        for (const handler of handlers) {
          handler();
        }
        return;
      }

      // Then dispatch to focus manager
      this.focusManager.handleKeyEvent(event);
    });

    // Sync focused component ID to renderer and trigger re-render
    this.focusManager.on("focusChanged", (comp: Component) => {
      const previousId = this.renderer.focusedId;
      this.renderer.setFocusedId(comp.id);

      // Re-render old and new focused components so focusStyle is visible
      if (this.running) {
        if (previousId && previousId !== comp.id) {
          const prev = this.template.components.find((c) => c.id === previousId);
          if (prev) this.renderer.partialRender(prev);
        }
        this.renderer.partialRender(comp);
      }
    });

    this.inputManager.on("mouse", (event: MouseEvent) => {
      this.handleMouseEvent(event);
    });
  }

  add(component: Component, focusable = false): this {
    this.template.addComponent(component);
    if (focusable) {
      this.focusManager.register(component);
    }
    return this;
  }

  remove(id: string): this {
    const comp = this.template.components.find((c) => c.id === id);
    if (comp) {
      this.focusManager.unregister(comp);
    }
    this.template.removeComponent(id);
    return this;
  }

  onKey(combo: string, handler: () => void): this {
    const existing = this.keyHandlers.get(combo) ?? [];
    existing.push(handler);
    this.keyHandlers.set(combo, existing);
    return this;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    if (this.useAlternateScreen) {
      process.stdout.write("\x1b[?1049h");
    }

    // Hide cursor
    process.stdout.write("\x1b[?25l");

    this.inputManager.start();

    if (this.useMouse) {
      this.inputManager.enableMouse();
    }

    this.renderer.render();

    // Setup signal handlers for graceful shutdown
    const cleanup = () => this.stop();
    this.signalHandlers.push(cleanup);
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    this.animator.destroy();
    this.inputManager.destroy();
    this.renderer.destroy();
    this.focusManager.destroy();

    // Show cursor
    process.stdout.write("\x1b[?25h");

    if (this.useAlternateScreen) {
      process.stdout.write("\x1b[?1049l");
    }

    // Remove signal handlers
    for (const handler of this.signalHandlers) {
      process.removeListener("SIGINT", handler);
      process.removeListener("SIGTERM", handler);
    }
    this.signalHandlers = [];
  }

  render(): void {
    if (this.running) {
      this.renderer.render();
    }
  }

  get isRunning(): boolean {
    return this.running;
  }

  get focus(): FocusManager {
    return this.focusManager;
  }

  get hoveredComponent(): Component | null {
    return this._hoveredComponent;
  }

  setTheme(theme: Theme | null): this {
    this.renderer.setTheme(theme);
    if (this.running) {
      this.renderer.render();
    }
    return this;
  }

  getTheme(): Theme | null {
    return this.renderer.theme;
  }

  showOverlay(component: Component, focusable = true): this {
    component.zIndex = 100;
    this.template.addComponent(component);
    this.overlays.add(component.id);

    if (focusable) {
      this.previousFocus = this.focusManager.focused;
      this.focusManager.register(component);
      this.focusManager.focusOn(component);
    }

    if (this.running) {
      this.renderer.render();
    }
    return this;
  }

  hideOverlay(component: Component): this {
    this.overlays.delete(component.id);
    this.focusManager.unregister(component);
    this.template.removeComponent(component.id);

    // Restore previous focus
    if (this.previousFocus) {
      const prev = this.previousFocus;
      this.previousFocus = undefined;
      this.focusManager.focusOn(prev);
    }

    if (this.running) {
      this.renderer.render();
    }
    return this;
  }

  get state(): Record<string, any> {
    return { ...this._state };
  }

  setState(partial: Record<string, any>): void {
    this._state = { ...this._state, ...partial };

    // Notify connected components
    for (const [, { component, selector }] of this.connectedComponents) {
      const derived = selector(this._state);
      const hasChanges = Object.keys(derived).some(
        (key) => derived[key] !== (component.props as Record<string, any>)[key]
      );
      if (hasChanges) {
        component.setProps(derived);
      }
    }
  }

  connect(
    component: Component,
    selector: (state: Record<string, any>) => Record<string, any>
  ): this {
    this.connectedComponents.set(component.id, { component, selector });
    // Apply initial state
    const derived = selector(this._state);
    component.setProps(derived);
    return this;
  }

  disconnect(componentId: string): this {
    this.connectedComponents.delete(componentId);
    return this;
  }

  animate(
    component: Component,
    propsTarget: Record<string, number>,
    options: { duration: number; easing?: EasingFn; onComplete?: () => void }
  ): AnimationId[] {
    const ids: AnimationId[] = [];
    const keys = Object.keys(propsTarget);

    for (const key of keys) {
      const from = (component.props as Record<string, any>)[key] as number;
      const to = propsTarget[key]!;

      const id = this.animator.animate({
        from,
        to,
        duration: options.duration,
        easing: options.easing,
        onUpdate: (value) => {
          component.setProps({ [key]: value } as any);
        },
        onComplete: key === keys[keys.length - 1] ? options.onComplete : undefined,
      });
      ids.push(id);
    }

    return ids;
  }

  tick(callback: (dt: number) => void): () => void {
    return this.animator.onTick(callback);
  }

  hitTest(x: number, y: number): Component | null {
    // Sort by z-index descending (highest first)
    const sorted = [...this.template.components].sort((a, b) => b.zIndex - a.zIndex);

    for (const component of sorted) {
      const hit = this.hitTestComponent(component, x, y);
      if (hit) return hit;
    }
    return null;
  }

  private hitTestComponent(component: Component, x: number, y: number): Component | null {
    // Check children first (they render on top)
    for (let i = component.children.length - 1; i >= 0; i--) {
      const hit = this.hitTestComponent(component.children[i]!, x, y);
      if (hit) return hit;
    }

    const pos = component.absolutePosition;
    if (!pos) return null;

    if (x >= pos.x && x < pos.x + pos.width && y >= pos.y && y < pos.y + pos.height) {
      return component;
    }
    return null;
  }

  private handleMouseEvent(event: MouseEvent): void {
    const target = this.hitTest(event.x, event.y);

    // Handle hover detection
    this.updateHover(target, event);

    if (!target) return;

    switch (event.type) {
      case "click":
        target.emit("mousedown", event);
        target.emit("click", event);
        break;
      case "release":
        target.emit("mouseup", event);
        break;
      case "scroll-up":
        target.emit("scroll", { ...event, direction: -1 });
        if (target.scrollable) {
          target.scrollBy(-1);
        }
        break;
      case "scroll-down":
        target.emit("scroll", { ...event, direction: 1 });
        if (target.scrollable) {
          target.scrollBy(1);
        }
        break;
      case "move":
        target.emit("mousemove", event);
        break;
    }
  }

  private updateHover(target: Component | null, _event: MouseEvent): void {
    const prev = this._hoveredComponent;

    if (prev === target) return;

    if (prev) {
      prev.hovered = false;
      prev.emit("mouseleave");
    }

    if (target) {
      target.hovered = true;
      target.emit("mouseenter");
    }

    this._hoveredComponent = target;
  }

  private keyCombo(event: KeyEvent): string {
    const parts: string[] = [];
    if (event.ctrl) parts.push("ctrl");
    if (event.shift) parts.push("shift");
    if (event.meta) parts.push("meta");
    parts.push(event.key);
    return parts.join("+");
  }
}

export { App };
export type { AppOptions };
