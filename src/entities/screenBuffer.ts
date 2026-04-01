type Cell = {
  char: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
  underline?: boolean;
};

const EMPTY_CELL: Cell = { char: " " };

class ScreenBuffer {
  private _width: number;
  private _height: number;
  private _cells: Cell[][];

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
    this._cells = this.createGrid(width, height);
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  private createGrid(width: number, height: number): Cell[][] {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ ...EMPTY_CELL }))
    );
  }

  getCell(x: number, y: number): Cell | undefined {
    if (x < 0 || y < 0 || x >= this._width || y >= this._height) {
      return undefined;
    }
    return this._cells[y]![x];
  }

  write(x: number, y: number, content: string, style?: Omit<Cell, "char">): void {
    if (y < 0 || y >= this._height) return;

    for (let i = 0; i < content.length; i++) {
      const col = x + i;
      if (col < 0) continue;
      if (col >= this._width) break;

      this._cells[y]![col] = {
        char: content[i]!,
        fg: style?.fg,
        bg: style?.bg,
        bold: style?.bold,
        dim: style?.dim,
        underline: style?.underline,
      };
    }
  }

  clear(): void {
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        this._cells[y]![x] = { ...EMPTY_CELL };
      }
    }
  }

  clearRegion(x: number, y: number, width: number, height: number): void {
    for (let row = y; row < y + height && row < this._height; row++) {
      if (row < 0) continue;
      for (let col = x; col < x + width && col < this._width; col++) {
        if (col < 0) continue;
        this._cells[row]![col] = { ...EMPTY_CELL };
      }
    }
  }

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this._cells = this.createGrid(width, height);
  }

  diff(other: ScreenBuffer): { x: number; y: number; cell: Cell }[] {
    const changes: { x: number; y: number; cell: Cell }[] = [];

    const maxH = Math.min(this._height, other._height);
    const maxW = Math.min(this._width, other._width);

    for (let y = 0; y < maxH; y++) {
      for (let x = 0; x < maxW; x++) {
        const a = this._cells[y]![x]!;
        const b = other._cells[y]![x]!;

        if (
          a.char !== b.char ||
          a.fg !== b.fg ||
          a.bg !== b.bg ||
          a.bold !== b.bold ||
          a.dim !== b.dim ||
          a.underline !== b.underline
        ) {
          changes.push({ x, y, cell: { ...a } });
        }
      }
    }

    return changes;
  }

  clone(): ScreenBuffer {
    const copy = new ScreenBuffer(this._width, this._height);
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const cell = this._cells[y]![x]!;
        copy._cells[y]![x] = { ...cell };
      }
    }
    return copy;
  }
}

export type { Cell };
export { ScreenBuffer, EMPTY_CELL };
