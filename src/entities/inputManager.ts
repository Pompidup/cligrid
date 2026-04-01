import EventEmitter from "node:events";

type KeyEvent = {
  key: string;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  raw: Buffer;
  handled?: boolean;
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

  start(): void {
    if (this.dataHandler) return;

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    this.dataHandler = (data: Buffer) => {
      const str = data.toString();
      const event = this.parseKey(str, data);
      this.emit("keypress", event);
    };

    process.stdin.on("data", this.dataHandler);
  }

  destroy(): void {
    if (this.dataHandler) {
      process.stdin.removeListener("data", this.dataHandler);
      this.dataHandler = null;
    }

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
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

export type { KeyEvent };
export { InputManager };
