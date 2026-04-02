import EventEmitter from "node:events";

type KeyEvent = {
  key: string;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  raw: Buffer;
  handled?: boolean;
};

type MouseButton = "left" | "right" | "middle" | "none";
type MouseEventType = "click" | "release" | "move" | "scroll-up" | "scroll-down";

type MouseEvent = {
  x: number;
  y: number;
  button: MouseButton;
  type: MouseEventType;
};

const KEY_SEQUENCES: Record<string, string> = {
  "\x1b[A": "up",
  "\x1b[B": "down",
  "\x1b[C": "right",
  "\x1b[D": "left",
  "\x1b[H": "home",
  "\x1b[F": "end",
  "\x1b[5~": "pageup",
  "\x1b[6~": "pagedown",
  "\x1b[3~": "delete",
  "\x1b[2~": "insert",
  "\r": "enter",
  "\n": "enter",
  "\t": "tab",
  "\x1b": "escape",
  "\x7f": "backspace",
  "\x08": "backspace",
  " ": "space",
};

class InputManager extends EventEmitter {
  private dataHandler: ((data: Buffer) => void) | null = null;
  private _mouseEnabled = false;
  mouseX = -1;
  mouseY = -1;

  start(): void {
    if (this.dataHandler) return;

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    this.dataHandler = (data: Buffer) => {
      const str = data.toString();

      // Try parsing as mouse event first
      const mouseEvent = this.parseMouse(str);
      if (mouseEvent) {
        this.mouseX = mouseEvent.x;
        this.mouseY = mouseEvent.y;
        this.emit("mouse", mouseEvent);
        return;
      }

      const event = this.parseKey(str, data);
      this.emit("keypress", event);
    };

    process.stdin.on("data", this.dataHandler);
  }

  enableMouse(): void {
    if (this._mouseEnabled) return;
    this._mouseEnabled = true;
    // Enable any-event tracking + SGR extended mode
    process.stdout.write("\x1b[?1003h\x1b[?1006h");
  }

  disableMouse(): void {
    if (!this._mouseEnabled) return;
    this._mouseEnabled = false;
    process.stdout.write("\x1b[?1003l\x1b[?1006l");
  }

  get mouseEnabled(): boolean {
    return this._mouseEnabled;
  }

  destroy(): void {
    if (this._mouseEnabled) {
      this.disableMouse();
    }

    if (this.dataHandler) {
      process.stdin.removeListener("data", this.dataHandler);
      this.dataHandler = null;
    }

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  }

  parseMouse(str: string): MouseEvent | null {
    const match = str.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/);
    if (!match) return null;

    const cb = parseInt(match[1]!, 10);
    const cx = parseInt(match[2]!, 10) - 1; // convert to 0-based
    const cy = parseInt(match[3]!, 10) - 1; // convert to 0-based
    const isRelease = match[4] === "m";

    // Decode button code
    const baseCb = cb & 3; // lower 2 bits for button
    const isMotion = (cb & 32) !== 0;
    const isScroll = (cb & 64) !== 0;

    if (isScroll) {
      return {
        x: cx,
        y: cy,
        button: "none",
        type: baseCb === 0 ? "scroll-up" : "scroll-down",
      };
    }

    if (isMotion) {
      let button: MouseButton = "none";
      if (baseCb === 0) button = "left";
      else if (baseCb === 1) button = "middle";
      else if (baseCb === 2) button = "right";
      return { x: cx, y: cy, button, type: "move" };
    }

    let button: MouseButton;
    if (baseCb === 0) button = "left";
    else if (baseCb === 1) button = "middle";
    else if (baseCb === 2) button = "right";
    else button = "none";

    return {
      x: cx,
      y: cy,
      button,
      type: isRelease ? "release" : "click",
    };
  }

  private parseKey(str: string, raw: Buffer): KeyEvent {
    const ctrl = str.length === 1 && str.charCodeAt(0) < 27 && str !== "\r" && str !== "\n" && str !== "\t";
    const shift = str === "\x1b[Z"; // Shift+Tab

    if (shift) {
      return { key: "tab", ctrl: false, shift: true, meta: false, raw };
    }

    const mapped = KEY_SEQUENCES[str];
    if (mapped) {
      return { key: mapped, ctrl: false, shift: false, meta: false, raw };
    }

    if (ctrl) {
      const letter = String.fromCharCode(str.charCodeAt(0) + 96);
      return { key: letter, ctrl: true, shift: false, meta: false, raw };
    }

    return { key: str, ctrl: false, shift: false, meta: false, raw };
  }
}

export type { KeyEvent, MouseEvent, MouseButton, MouseEventType };
export { InputManager };
