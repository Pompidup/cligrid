import { Component } from "../entities/component.js";
import type { RenderOutput, RenderContext, RenderLine, ComponentConfig } from "../entities/component.js";

type SelectListProps = {
  items: string[];
  selectedIndex: number;
};

type SelectListConfig = Omit<ComponentConfig<SelectListProps>, "props"> & {
  props: SelectListProps;
  onSelect?: (index: number, item: string) => void;
};

class SelectList extends Component<SelectListProps> {
  private _onSelect?: (index: number, item: string) => void;

  constructor(config: SelectListConfig) {
    super(config);
    this._onSelect = config.onSelect;

    this.on("keypress", (event) => {
      const { items, selectedIndex } = this.props;
      if (event.key === "up" && selectedIndex > 0) {
        this.setProps({ selectedIndex: selectedIndex - 1 });
      } else if (event.key === "down" && selectedIndex < items.length - 1) {
        this.setProps({ selectedIndex: selectedIndex + 1 });
      } else if (event.key === "enter" && this._onSelect) {
        this._onSelect(selectedIndex, items[selectedIndex]!);
      }
    });
  }

  render(context?: RenderContext): RenderOutput {
    const { items, selectedIndex } = this.props;
    return items.map((item, i): RenderLine => {
      const prefix = i === selectedIndex ? "▸ " : "  ";
      return {
        text: prefix + item,
        style: i === selectedIndex ? { bold: true } : undefined,
      };
    });
  }
}

export { SelectList };
export type { SelectListProps, SelectListConfig };
