import type { OverflowMode } from "../entities/style.js";
import type { StyledSegment, TextAlign } from "../entities/component.js";

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
        line.length > width ? line.slice(0, width) : line
      );

    case "ellipsis":
      return lines.map((line) => {
        if (line.length <= width) return line;
        if (width <= 3) return line.slice(0, width);
        return line.slice(0, width - 3) + "...";
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
    if (line.length <= width) {
      result.push(line);
    } else {
      let remaining = line;
      while (remaining.length > width) {
        result.push(remaining.slice(0, width));
        remaining = remaining.slice(width);
      }
      if (remaining.length > 0) {
        result.push(remaining);
      }
    }
  }
  return result;
}

function wrapWord(lines: string[], width: number): string[] {
  const result: string[] = [];
  for (const line of lines) {
    if (line.length <= width) {
      result.push(line);
      continue;
    }

    const words = line.split(" ");
    let current = "";

    for (const word of words) {
      if (current.length === 0) {
        // First word on a new line
        if (word.length > width) {
          // Word itself is longer than width, break it by char
          let remaining = word;
          while (remaining.length > width) {
            result.push(remaining.slice(0, width));
            remaining = remaining.slice(width);
          }
          current = remaining;
        } else {
          current = word;
        }
      } else if (current.length + 1 + word.length <= width) {
        current += " " + word;
      } else {
        result.push(current);
        if (word.length > width) {
          let remaining = word;
          while (remaining.length > width) {
            result.push(remaining.slice(0, width));
            remaining = remaining.slice(width);
          }
          current = remaining;
        } else {
          current = word;
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
  for (const s of segments) w += s.text.length;
  return w;
}

function truncateSegments(segments: StyledSegment[], width: number): StyledSegment[] {
  const result: StyledSegment[] = [];
  let remaining = width;
  for (const seg of segments) {
    if (remaining <= 0) break;
    if (seg.text.length <= remaining) {
      result.push(seg);
      remaining -= seg.text.length;
    } else {
      result.push({ text: seg.text.slice(0, remaining), style: seg.style });
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

type StyledChar = { char: string; style?: Partial<import("../entities/style.js").Style> };

function segmentsToChars(segments: StyledSegment[]): StyledChar[] {
  const chars: StyledChar[] = [];
  for (const seg of segments) {
    for (const ch of seg.text) {
      chars.push({ char: ch, style: seg.style });
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
      const end = Math.min(start + width, chars.length);
      result.push({
        segments: charsToSegments(chars.slice(start, end)),
        align: line.align,
      });
      start = end;
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
        if (lineWidth > 0 && lineWidth + token.chars.length <= width) {
          currentLine.push(...token.chars);
          lineWidth += token.chars.length;
        }
        continue;
      }

      // Word token
      if (token.chars.length > width) {
        // Word longer than width — break by character
        for (const ch of token.chars) {
          if (lineWidth >= width) {
            result.push({ segments: charsToSegments(currentLine), align: line.align });
            currentLine = [];
            lineWidth = 0;
          }
          currentLine.push(ch);
          lineWidth++;
        }
      } else if (lineWidth + token.chars.length <= width) {
        currentLine.push(...token.chars);
        lineWidth += token.chars.length;
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
        lineWidth = token.chars.length;
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
