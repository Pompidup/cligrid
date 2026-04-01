import type { Component } from "./component.js";
import type { KeyEvent } from "./inputManager.js";
import type { TerminalDimensions } from "../port/terminalDimensions.js";
import { Template } from "./template.js";
import { Renderer } from "./renderer.js";
import { InputManager } from "./inputManager.js";
import { FocusManager } from "./focusManager.js";
import { getTerminalDimensions } from "../../config/terminalDimensionsFactory.js";

type AppOptions = {
  terminalDimensions?: TerminalDimensions;
  alternateScreen?: boolean;
};

class App {
  private template: Template;
  private renderer: Renderer;
  private inputManager: InputManager;
  private focusManager: FocusManager;
  private keyHandlers: Map<string, (() => void)[]> = new Map();
  private running = false;
  private useAlternateScreen: boolean;
  private signalHandlers: (() => void)[] = [];
  private previousFocus?: Component;
  private overlays: Set<string> = new Set();
  private _state: Record<string, any> = {};
  private connectedComponents: Map<string, { component: Component; selector: (state: Record<string, any>) => Record<string, any> }> = new Map();

  constructor(options: AppOptions = {}) {
    const dims = options.terminalDimensions ?? getTerminalDimensions();
    this.useAlternateScreen = options.alternateScreen ?? false;

    this.template = new Template(dims);
    this.renderer = new Renderer(this.template, dims);
    this.inputManager = new InputManager();
    this.focusManager = new FocusManager();

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

  showOverlay(component: Component, focusable = true): this {
    component.zIndex = 100;
    this.template.addComponent(component);
    this.overlays.add(component.id);

    if (focusable) {
      this.previousFocus = this.focusManager.focused;
      this.focusManager.register(component);
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
      // Re-register to restore focus (if it was already registered, register is a no-op)
      if (this.focusManager.focused?.id !== prev.id) {
        // Focus the previously focused component by cycling
        const components = this.template.components;
        const idx = components.findIndex((c) => c.id === prev.id);
        if (idx !== -1) {
          // The component is still in the focusable list, we just need to refocus
          // Since FocusManager doesn't have a direct focusOn method, emit focus
          prev.emit("focus");
        }
      }
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
