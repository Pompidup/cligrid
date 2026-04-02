import { Component } from "../entities/component.js";
import type {
  RenderOutput,
  RenderContext,
  RenderLine,
  ComponentConfig,
  StyledSegment,
  TextAlign,
} from "../entities/component.js";
import { stringWidth, graphemeSliceByWidth } from "../utils/stringWidth.js";

type TableColumn = {
  key: string;
  label: string;
  width?: number;
  align?: TextAlign;
};

type TableProps = {
  columns: TableColumn[];
  rows: Record<string, string>[];
};

type TableConfig = Omit<ComponentConfig<TableProps>, "props"> & {
  props: TableProps;
};

class Table extends Component<TableProps> {
  constructor(config: TableConfig) {
    super(config);
  }

  render(context?: RenderContext): RenderOutput {
    const { columns, rows } = this.props;
    const totalWidth = context?.width ?? 80;

    const colWidths = this.computeColumnWidths(columns, totalWidth);
    const lines: RenderLine[] = [];

    // Header line
    lines.push(this.renderHeader(columns, colWidths));

    // Separator line
    lines.push(this.renderSeparator(colWidths));

    // Data rows
    for (const row of rows) {
      lines.push(this.renderRow(columns, row, colWidths));
    }

    return lines;
  }

  private computeColumnWidths(columns: TableColumn[], totalWidth: number): number[] {
    const separatorWidth = columns.length > 1 ? (columns.length - 1) * 3 : 0; // " │ " = 3 chars
    const available = totalWidth - separatorWidth;

    const fixedTotal = columns.reduce((sum, col) => sum + (col.width ?? 0), 0);
    const autoColumns = columns.filter((col) => col.width === undefined);
    const autoWidth = autoColumns.length > 0
      ? Math.max(1, Math.floor((available - fixedTotal) / autoColumns.length))
      : 0;

    return columns.map((col) => col.width ?? autoWidth);
  }

  private padCell(text: string, width: number, align: TextAlign = "left"): string {
    const textW = stringWidth(text);
    const truncated = textW > width ? graphemeSliceByWidth(text, width) : text;
    const truncatedW = stringWidth(truncated);
    const padding = Math.max(0, width - truncatedW);

    if (align === "right") {
      return " ".repeat(padding) + truncated;
    }
    if (align === "center") {
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return " ".repeat(left) + truncated + " ".repeat(right);
    }
    return truncated + " ".repeat(padding);
  }

  private renderHeader(columns: TableColumn[], colWidths: number[]): RenderLine {
    const segments: StyledSegment[] = [];

    for (let i = 0; i < columns.length; i++) {
      if (i > 0) {
        segments.push({ text: " │ " });
      }
      segments.push({
        text: this.padCell(columns[i]!.label, colWidths[i]!, columns[i]!.align),
        style: { bold: true, underline: true },
      });
    }

    return { text: "", segments };
  }

  private renderSeparator(colWidths: number[]): RenderLine {
    const parts: string[] = colWidths.map((w) => "─".repeat(w));
    return { text: parts.join("─┼─") };
  }

  private renderRow(
    columns: TableColumn[],
    row: Record<string, string>,
    colWidths: number[],
  ): RenderLine {
    const segments: StyledSegment[] = [];

    for (let i = 0; i < columns.length; i++) {
      if (i > 0) {
        segments.push({ text: " │ " });
      }
      const col = columns[i]!;
      const value = row[col.key] ?? "";
      segments.push({
        text: this.padCell(value, colWidths[i]!, col.align),
      });
    }

    return { text: "", segments };
  }
}

export { Table };
export type { TableProps, TableConfig, TableColumn };
