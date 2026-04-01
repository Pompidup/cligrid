import { Component } from "../entities/component.js";
import type { RenderOutput, RenderContext, ComponentConfig } from "../entities/component.js";

type ProgressBarProps = {
  value: number; // 0 to 1
  label?: string;
};

type ProgressBarConfig = Omit<ComponentConfig<ProgressBarProps>, "props"> & {
  props: ProgressBarProps;
};

class ProgressBar extends Component<ProgressBarProps> {
  render(context?: RenderContext): RenderOutput {
    const { value, label } = this.props;
    const clamped = Math.max(0, Math.min(1, value));
    const width = context?.width ?? 20;

    const percent = `${Math.round(clamped * 100)}%`;
    const labelStr = label ? `${label} ` : "";
    const suffixStr = ` ${percent}`;
    const barWidth = Math.max(0, width - labelStr.length - suffixStr.length - 2);

    const filled = Math.round(clamped * barWidth);
    const empty = barWidth - filled;

    return labelStr + "[" + "█".repeat(filled) + "░".repeat(empty) + "]" + suffixStr;
  }
}

export { ProgressBar };
export type { ProgressBarProps, ProgressBarConfig };
