import EventEmitter from "node:events";
import type { Component } from "./component.js";
import type { KeyEvent } from "./inputManager.js";

class FocusManager extends EventEmitter {
  private focusableComponents: Component[] = [];
  private focusIndex = -1;

  register(component: Component): void {
    if (!this.focusableComponents.includes(component)) {
      this.focusableComponents.push(component);
      if (this.focusIndex === -1) {
        this.focusIndex = 0;
        this.emitFocus();
      }
    }
  }

  unregister(component: Component): void {
    const idx = this.focusableComponents.indexOf(component);
    if (idx === -1) return;

    const wasFocused = idx === this.focusIndex;
    this.focusableComponents.splice(idx, 1);

    if (this.focusableComponents.length === 0) {
      this.focusIndex = -1;
    } else if (wasFocused) {
      this.focusIndex = Math.min(this.focusIndex, this.focusableComponents.length - 1);
      this.emitFocus();
    } else if (idx < this.focusIndex) {
      this.focusIndex--;
    }
  }

  get focused(): Component | undefined {
    if (this.focusIndex < 0 || this.focusIndex >= this.focusableComponents.length) {
      return undefined;
    }
    return this.focusableComponents[this.focusIndex];
  }

  focusNext(): void {
    if (this.focusableComponents.length === 0) return;
    this.emitBlur();
    this.focusIndex = (this.focusIndex + 1) % this.focusableComponents.length;
    this.emitFocus();
  }

  focusPrevious(): void {
    if (this.focusableComponents.length === 0) return;
    this.emitBlur();
    this.focusIndex = (this.focusIndex - 1 + this.focusableComponents.length) % this.focusableComponents.length;
    this.emitFocus();
  }

  handleKeyEvent(event: KeyEvent): void {
    if (event.key === "tab" && !event.shift) {
      this.focusNext();
      return;
    }
    if (event.key === "tab" && event.shift) {
      this.focusPrevious();
      return;
    }

    const current = this.focused;
    if (current) {
      // Handle scroll on scrollable components
      if (current.scrollable) {
        if (event.key === "up") {
          current.scrollBy(-1);
          return;
        }
        if (event.key === "down") {
          current.scrollBy(1);
          return;
        }
        if (event.key === "left") {
          current.scrollByX(-1);
          return;
        }
        if (event.key === "right") {
          current.scrollByX(1);
          return;
        }
      }

      // Dispatch to focused component, then bubble up to parents
      this.dispatchWithBubbling(current, event);
    }
  }

  private dispatchWithBubbling(component: Component, event: KeyEvent): void {
    component.emit("keypress", event);

    // Bubble up if not handled
    if (!event.handled && component.parent) {
      this.dispatchWithBubbling(component.parent, event);
    }
  }

  private emitFocus(): void {
    const current = this.focused;
    if (current) {
      current.emit("focus");
      this.emit("focusChanged", current);
    }
  }

  private emitBlur(): void {
    const current = this.focused;
    if (current) {
      current.emit("blur");
    }
  }

  destroy(): void {
    this.emitBlur();
    this.focusableComponents = [];
    this.focusIndex = -1;
  }
}

export { FocusManager };
