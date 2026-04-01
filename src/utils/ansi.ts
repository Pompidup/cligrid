const NAMED_COLORS: Record<string, string> = {
  black: "30", red: "31", green: "32", yellow: "33",
  blue: "34", magenta: "35", cyan: "36", white: "37",
  brightBlack: "90", brightRed: "91", brightGreen: "92", brightYellow: "93",
  brightBlue: "94", brightMagenta: "95", brightCyan: "96", brightWhite: "97",
};

const NAMED_BG_COLORS: Record<string, string> = {
  black: "40", red: "41", green: "42", yellow: "43",
  blue: "44", magenta: "45", cyan: "46", white: "47",
  brightBlack: "100", brightRed: "101", brightGreen: "102", brightYellow: "103",
  brightBlue: "104", brightMagenta: "105", brightCyan: "106", brightWhite: "107",
};

function parseHexColor(hex: string): [number, number, number] | undefined {
  const match = hex.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (!match) return undefined;
  return [parseInt(match[1]!, 16), parseInt(match[2]!, 16), parseInt(match[3]!, 16)];
}

function fgCode(color: string): string {
  const named = NAMED_COLORS[color];
  if (named) return `\x1b[${named}m`;

  const rgb = parseHexColor(color);
  if (rgb) return `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m`;

  return "";
}

function bgCode(color: string): string {
  const named = NAMED_BG_COLORS[color];
  if (named) return `\x1b[${named}m`;

  const rgb = parseHexColor(color);
  if (rgb) return `\x1b[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m`;

  return "";
}

type StyleAttrs = {
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
  underline?: boolean;
};

function stylize(text: string, style: StyleAttrs): string {
  let prefix = "";

  if (style.bold) prefix += "\x1b[1m";
  if (style.dim) prefix += "\x1b[2m";
  if (style.underline) prefix += "\x1b[4m";
  if (style.fg) prefix += fgCode(style.fg);
  if (style.bg) prefix += bgCode(style.bg);

  if (prefix.length === 0) return text;

  return `${prefix}${text}\x1b[0m`;
}

const RESET = "\x1b[0m";

export { fgCode, bgCode, stylize, RESET };
export type { StyleAttrs };
