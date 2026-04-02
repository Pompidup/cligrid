import { Component } from "../entities/component.js";
import type {
  RenderOutput,
  RenderContext,
  RenderLine,
  ComponentConfig,
  StyledSegment,
} from "../entities/component.js";
import type { Style } from "../entities/style.js";

type ModalButton = {
  label: string;
  action: () => void;
  style?: Partial<Style>;
};

type ModalProps = {
  title: string;
  body: string;
  buttons: ModalButton[];
  selectedButton?: number;
};

type ModalConfig = Omit<ComponentConfig<ModalProps>, "props"> & {
  props: ModalProps;
};

class Modal extends Component<ModalProps> {
  constructor(config: ModalConfig) {
    super(config);

    if (this.props.selectedButton === undefined) {
      this.setProps({ selectedButton: 0 });
    }

    this.on("keypress", (event) => {
      const { buttons, selectedButton = 0 } = this.props;
      if (buttons.length === 0) return;

      if (event.key === "left") {
        const newIndex = selectedButton === 0 ? buttons.length - 1 : selectedButton - 1;
        this.setProps({ selectedButton: newIndex });
      } else if (event.key === "right") {
        const newIndex = selectedButton === buttons.length - 1 ? 0 : selectedButton + 1;
        this.setProps({ selectedButton: newIndex });
      } else if (event.key === "enter") {
        buttons[selectedButton]?.action();
      } else if (event.key === "escape") {
        // Convention: last button is cancel/close
        buttons[buttons.length - 1]?.action();
      }
    });
  }

  render(context?: RenderContext): RenderOutput {
    const { title, body, buttons, selectedButton = 0 } = this.props;
    const width = context?.width ?? 30;
    const lines: RenderLine[] = [];

    // Title line (centered, bold)
    lines.push({
      text: title,
      style: { bold: true },
      align: "center",
    });

    // Empty line
    lines.push({ text: "" });

    // Body lines
    const bodyLines = body.split("\n");
    for (const line of bodyLines) {
      lines.push({ text: line });
    }

    // Empty line before buttons
    lines.push({ text: "" });

    // Buttons line with segments
    if (buttons.length > 0) {
      const segments: StyledSegment[] = [];
      for (let i = 0; i < buttons.length; i++) {
        if (i > 0) {
          segments.push({ text: "  " });
        }
        const btn = buttons[i]!;
        const isSelected = i === selectedButton;
        segments.push({
          text: `[ ${btn.label} ]`,
          style: isSelected
            ? { inverse: true, bold: true, ...(btn.style ?? {}) }
            : btn.style ?? {},
        });
      }
      lines.push({ text: "", segments, align: "center" });
    }

    return lines;
  }
}

export { Modal };
export type { ModalProps, ModalConfig, ModalButton };
