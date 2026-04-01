type Padding = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type BorderStyle = "single" | "double" | "rounded" | "none";

type Border = {
  style: BorderStyle;
  fg?: string;
};

type OverflowMode = "hidden" | "ellipsis" | "wrap" | "wrap-word";

type Style = {
  padding?: Padding;
  border?: Border;
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
  underline?: boolean;
  overflow?: OverflowMode;
};

const BORDER_CHARS: Record<Exclude<BorderStyle, "none">, {
  topLeft: string; topRight: string; bottomLeft: string; bottomRight: string;
  horizontal: string; vertical: string;
}> = {
  single: { topLeft: "┌", topRight: "┐", bottomLeft: "└", bottomRight: "┘", horizontal: "─", vertical: "│" },
  double: { topLeft: "╔", topRight: "╗", bottomLeft: "╚", bottomRight: "╝", horizontal: "═", vertical: "║" },
  rounded: { topLeft: "╭", topRight: "╮", bottomLeft: "╰", bottomRight: "╯", horizontal: "─", vertical: "│" },
};

function getBoxInsets(style?: Style): { top: number; right: number; bottom: number; left: number } {
  let top = 0, right = 0, bottom = 0, left = 0;

  if (style?.border && style.border.style !== "none") {
    top += 1;
    right += 1;
    bottom += 1;
    left += 1;
  }

  if (style?.padding) {
    top += style.padding.top ?? 0;
    right += style.padding.right ?? 0;
    bottom += style.padding.bottom ?? 0;
    left += style.padding.left ?? 0;
  }

  return { top, right, bottom, left };
}

export type { Style, Padding, Border, BorderStyle, OverflowMode };
export { BORDER_CHARS, getBoxInsets };
