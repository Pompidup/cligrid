import { Component } from "../entities/component.js";
import type { RenderOutput, RenderContext, ComponentConfig } from "../entities/component.js";

type TextBoxProps = {
  text: string;
};

type TextBoxConfig = Omit<ComponentConfig<TextBoxProps>, "props"> & {
  props: TextBoxProps;
};

class TextBox extends Component<TextBoxProps> {
  render(context?: RenderContext): RenderOutput {
    return this.props.text;
  }
}

export { TextBox };
export type { TextBoxProps, TextBoxConfig };
