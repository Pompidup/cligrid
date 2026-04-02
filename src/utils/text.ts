import type { OverflowMode } from "../entities/style.js";
import type { StyledSegment, TextAlign } from "../entities/component.js";
import { stringWidth, graphemeSplit, graphemeSliceByWidth } from "./stringWidth.js";

// --- Existing string-based overflow (kept for backward compat) ---

function applyOverflow(
  lines: string[],
  width: number,
  mode: OverflowMode
): string[] {
  if (width <= 0) return [];

  switch (mode) {
    case "hidden":
      return lines.map((line) =>
        stringWidth(line) > width ? graphemeSliceByWidth(line, width) : line
      );

    case "ellipsis":
      return lines.map((line) => {
        if (stringWidth(line) <= width) return line;
        if (width <= 3) return graphemeSliceByWidth(line, width);
        return graphemeSliceByWidth(line, width - 3) + "...";
      });

    case "wrap":
      return wrapCharacter(lines, width);

    case "wrap-word":
      return wrapWord(lines, width);
  }
}

function wrapCharacter(lines: string[], width: number): string[] {
  const result: string[] = [];
  for (const line of lines) {
    if (stringWidth(line) <= width) {
      result.push(line);
    } else {
      const graphemes = graphemeSplit(line);
      let current = "";
      let currentWidth = 0;
      for (const g of graphemes) {
        const gw = stringWidth(g);
        if (currentWidth + gw > width) {
          if (current.length > 0) result.push(current);
          current = g;
          currentWidth = gw;
        } else {
          current += g;
          currentWidth += gw;
        }
      }
      if (current.length > 0) result.push(current);
    }
  }
  return result;
}

function wrapWord(lines: string[], width: number): string[] {
  const result: string[] = [];
  for (const line of lines) {
    if (stringWidth(line) <= width) {
      result.push(line);
      continue;
    }

    const words = line.split(" ");
    let current = "";
    let currentWidth = 0;

    for (const word of words) {
      const wordWidth = stringWidth(word);
      if (currentWidth === 0) {
        if (wordWidth > width) {
          // Word itself is longer than width, break it by grapheme
          const graphemes = graphemeSplit(word);
          let part = "";
          let partWidth = 0;
          for (const g of graphemes) {
            const gw = stringWidth(g);
            if (partWidth + gw > width) {
              if (part.length > 0) result.push(part);
              part = g;
              partWidth = gw;
            } else {
              part += g;
              partWidth += gw;
            }
          }
          current = part;
          currentWidth = partWidth;
        } else {
          current = word;
          currentWidth = wordWidth;
        }
      } else if (currentWidth + 1 + wordWidth <= width) {
        current += " " + word;
        currentWidth += 1 + wordWidth;
      } else {
        result.push(current);
        if (wordWidth > width) {
          const graphemes = graphemeSplit(word);
          let part = "";
          let partWidth = 0;
          for (const g of graphemes) {
            const gw = stringWidth(g);
            if (partWidth + gw > width) {
              if (part.length > 0) result.push(part);
              part = g;
              partWidth = gw;
            } else {
              part += g;
              partWidth += gw;
            }
          }
          current = part;
          currentWidth = partWidth;
        } else {
          current = word;
          currentWidth = wordWidth;
        }
      }
    }

    if (current.length > 0) {
      result.push(current);
    }
  }
  return result;
}

// --- Segment-based overflow ---

type SegmentLine = {
  segments: StyledSegment[];
  align?: TextAlign;
};

function segmentsWidth(segments: StyledSegment[]): number {
  let w = 0;
  for (const s of segments) w += stringWidth(s.text);
  return w;
}

function truncateSegments(segments: StyledSegment[], width: number): StyledSegment[] {
  const result: StyledSegment[] = [];
  let remaining = width;
  for (const seg of segments) {
    if (remaining <= 0) break;
    const segW = stringWidth(seg.text);
    if (segW <= remaining) {
      result.push(seg);
      remaining -= segW;
    } else {
      result.push({ text: graphemeSliceByWidth(seg.text, remaining), style: seg.style });
      remaining = 0;
    }
  }
  return result;
}

function truncateSegmentsEllipsis(segments: StyledSegment[], width: number): StyledSegment[] {
  const totalWidth = segmentsWidth(segments);
  if (totalWidth <= width) return segments;
  if (width <= 3) return truncateSegments(segments, width);

  const truncated = truncateSegments(segments, width - 3);
  const lastStyle = truncated.length > 0 ? truncated[truncated.length - 1]!.style : undefined;
  truncated.push({ text: "...", style: lastStyle });
  return truncated;
}

type StyledChar = { char: string; width: number; style?: Partial<import("../entities/style.js").Style> };

function segmentsToChars(segments: StyledSegment[]): StyledChar[] {
  const chars: StyledChar[] = [];
  for (const seg of segments) {
    const graphemes = graphemeSplit(seg.text);
    for (const g of graphemes) {
      chars.push({ char: g, width: stringWidth(g), style: seg.style });
    }
  }
  return chars;
}

function charsToSegments(chars: StyledChar[]): StyledSegment[] {
  if (chars.length === 0) return [];
  const segments: StyledSegment[] = [];
  let current = { text: chars[0]!.char, style: chars[0]!.style };

  for (let i = 1; i < chars.length; i++) {
    const ch = chars[i]!;
    if (sameStyle(ch.style, current.style)) {
      current.text += ch.char;
    } else {
      segments.push(current);
      current = { text: ch.char, style: ch.style };
    }
  }
  segments.push(current);
  return segments;
}

function sameStyle(
  a?: Partial<import("../entities/style.js").Style>,
  b?: Partial<import("../entities/style.js").Style>
): boolean {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.fg === b.fg && a.bg === b.bg && a.bold === b.bold && a.dim === b.dim && a.underline === b.underline && a.italic === b.italic && a.strikethrough === b.strikethrough && a.inverse === b.inverse;
}

function charsWidth(chars: StyledChar[]): number {
  let w = 0;
  for (const c of chars) w += c.width;
  return w;
}

function wrapSegmentsCharacter(lines: SegmentLine[], width: number): SegmentLine[] {
  const result: SegmentLine[] = [];

  for (const line of lines) {
    const chars = segmentsToChars(line.segments);
    if (chars.length === 0) {
      result.push({ segments: [], align: line.align });
      continue;
    }

    let start = 0;
    while (start < chars.length) {
      const lineChars: StyledChar[] = [];
      let lineW = 0;
      let i = start;
      while (i < chars.length && lineW + chars[i]!.width <= width) {
        lineChars.push(chars[i]!);
        lineW += chars[i]!.width;
        i++;
      }
      if (lineChars.length === 0 && i < chars.length) {
        // Single char wider than width — include it anyway to avoid infinite loop
        lineChars.push(chars[i]!);
        i++;
      }
      result.push({
        segments: charsToSegments(lineChars),
        align: line.align,
      });
      start = i;
    }
  }

  return result;
}

function wrapSegmentsWord(lines: SegmentLine[], width: number): SegmentLine[] {
  const result: SegmentLine[] = [];

  for (const line of lines) {
    const chars = segmentsToChars(line.segments);
    if (chars.length === 0) {
      result.push({ segments: [], align: line.align });
      continue;
    }

    // Split into tokens (words and spaces)
    type Token = { chars: StyledChar[]; isSpace: boolean };
    const tokens: Token[] = [];
    let current: StyledChar[] = [chars[0]!];
    let isSpace = chars[0]!.char === " ";

    for (let i = 1; i < chars.length; i++) {
      const ch = chars[i]!;
      if ((ch.char === " ") === isSpace) {
        current.push(ch);
      } else {
        tokens.push({ chars: current, isSpace });
        current = [ch];
        isSpace = ch.char === " ";
      }
    }
    tokens.push({ chars: current, isSpace });

    // Layout tokens into lines
    let currentLine: StyledChar[] = [];
    let lineWidth = 0;

    for (const token of tokens) {
      if (token.isSpace) {
        const tokenW = charsWidth(token.chars);
        if (lineWidth > 0 && lineWidth + tokenW <= width) {
          currentLine.push(...token.chars);
          lineWidth += tokenW;
        }
        continue;
      }

      // Word token
      const tokenW = charsWidth(token.chars);
      if (tokenW > width) {
        // Word longer than width — break by character
        for (const ch of token.chars) {
          if (lineWidth + ch.width > width) {
            if (currentLine.length > 0) {
              result.push({ segments: charsToSegments(currentLine), align: line.align });
            }
            currentLine = [];
            lineWidth = 0;
          }
          currentLine.push(ch);
          lineWidth += ch.width;
        }
      } else if (lineWidth + tokenW <= width) {
        currentLine.push(...token.chars);
        lineWidth += tokenW;
      } else {
        // Word doesn't fit on current line
        if (currentLine.length > 0) {
          // Trim trailing spaces from current line
          while (currentLine.length > 0 && currentLine[currentLine.length - 1]!.char === " ") {
            currentLine.pop();
          }
          result.push({ segments: charsToSegments(currentLine), align: line.align });
        }
        currentLine = [...token.chars];
        lineWidth = tokenW;
      }
    }

    // Trim trailing spaces
    while (currentLine.length > 0 && currentLine[currentLine.length - 1]!.char === " ") {
      currentLine.pop();
    }
    result.push({ segments: charsToSegments(currentLine), align: line.align });
  }

  return result;
}

function applySegmentOverflow(
  lines: SegmentLine[],
  width: number,
  mode: OverflowMode
): SegmentLine[] {
  if (width <= 0) return [];

  switch (mode) {
    case "hidden":
      return lines.map((line) => ({
        segments: truncateSegments(line.segments, width),
        align: line.align,
      }));

    case "ellipsis":
      return lines.map((line) => ({
        segments: truncateSegmentsEllipsis(line.segments, width),
        align: line.align,
      }));

    case "wrap":
      return wrapSegmentsCharacter(lines, width);

    case "wrap-word":
      return wrapSegmentsWord(lines, width);
  }
}

export type { SegmentLine };
export { applyOverflow, applySegmentOverflow, segmentsWidth, wrapCharacter, wrapWord };
