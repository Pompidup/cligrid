import { Component } from "../entities/component.js";
import type {
  RenderOutput,
  RenderContext,
  RenderLine,
  ComponentConfig,
  StyledSegment,
} from "../entities/component.js";

type CheckboxProps = {
  checked: boolean;
  label: string;
};

type CheckboxConfig = Omit<ComponentConfig<CheckboxProps>, "props"> & {
  props: CheckboxProps;
  onChange?: (checked: boolean) => void;
};

class Checkbox extends Component<CheckboxProps> {
  private _onChange?: (checked: boolean) => void;

  constructor(config: CheckboxConfig) {
    super(config);
    this._onChange = config.onChange;

    this.on("keypress", (event) => {
      if (event.key === " " || event.key === "enter") {
        const newChecked = !this.props.checked;
        this.setProps({ checked: newChecked });
        this._onChange?.(newChecked);
      }
    });
  }

  render(_context?: RenderContext): RenderOutput {
    const { checked, label } = this.props;

    const segments: StyledSegment[] = checked
      ? [
          { text: "[", style: {} },
          { text: "✓", style: { bold: true, fg: "green" } },
          { text: "] " },
          { text: label },
        ]
      : [
          { text: "[ ] " },
          { text: label },
        ];

    return { text: "", segments } as RenderLine;
  }
}

export { Checkbox };
export type { CheckboxProps, CheckboxConfig };
