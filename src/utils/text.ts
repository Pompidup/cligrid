import type { OverflowMode } from "../entities/style.js";

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

export { applyOverflow, wrapCharacter, wrapWord };
