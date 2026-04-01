import { Component } from "../entities/component.js";
import type { RenderOutput, RenderContext, ComponentConfig } from "../entities/component.js";

type InputFieldProps = {
  value: string;
  placeholder?: string;
  cursorPos?: number;
};

type InputFieldConfig = Omit<ComponentConfig<InputFieldProps>, "props"> & {
  props: InputFieldProps;
  onSubmit?: (value: string) => void;
  onChange?: (value: string) => void;
};

class InputField extends Component<InputFieldProps> {
  private _onSubmit?: (value: string) => void;
  private _onChange?: (value: string) => void;

  constructor(config: InputFieldConfig) {
    super(config);
    this._onSubmit = config.onSubmit;
    this._onChange = config.onChange;

    if (this.props.cursorPos === undefined) {
      this.props = { ...this.props, cursorPos: this.props.value.length };
    }

    this.on("keypress", (event) => {
      const { value, cursorPos = value.length } = this.props;

      if (event.key === "enter") {
        this._onSubmit?.(value);
        return;
      }

      if (event.key === "backspace") {
        if (cursorPos > 0) {
          const newValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
          this.setProps({ value: newValue, cursorPos: cursorPos - 1 });
          this._onChange?.(newValue);
        }
        return;
      }

      if (event.key === "delete") {
        if (cursorPos < value.length) {
          const newValue = value.slice(0, cursorPos) + value.slice(cursorPos + 1);
          this.setProps({ value: newValue });
          this._onChange?.(newValue);
        }
        return;
      }

      if (event.key === "left") {
        if (cursorPos > 0) {
          this.setProps({ cursorPos: cursorPos - 1 });
        }
        return;
      }

      if (event.key === "right") {
        if (cursorPos < value.length) {
          this.setProps({ cursorPos: cursorPos + 1 });
        }
        return;
      }

      // Printable character (single char, no ctrl/meta)
      if (event.key.length === 1 && !event.ctrl && !event.meta) {
        const newValue = value.slice(0, cursorPos) + event.key + value.slice(cursorPos);
        this.setProps({ value: newValue, cursorPos: cursorPos + 1 });
        this._onChange?.(newValue);
      }
    });
  }

  render(context?: RenderContext): RenderOutput {
    const { value, placeholder, cursorPos = value.length } = this.props;
    const width = context?.width ?? 20;

    if (value.length === 0 && placeholder) {
      return { text: placeholder, style: { dim: true } };
    }

    // Insert a visual cursor marker
    const before = value.slice(0, cursorPos);
    const cursorChar = cursorPos < value.length ? value[cursorPos]! : " ";
    const after = value.slice(cursorPos + 1);
    const display = before + cursorChar + after;

    return [
      {
        text: display.length > width ? display.slice(0, width) : display,
      },
    ];
  }
}

export { InputField };
export type { InputFieldProps, InputFieldConfig };
