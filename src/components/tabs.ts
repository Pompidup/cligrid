import { Component } from "../entities/component.js";
import type {
  RenderOutput,
  RenderContext,
  RenderLine,
  ComponentConfig,
  StyledSegment,
} from "../entities/component.js";

type Tab = {
  label: string;
  id: string;
};

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
};

type TabsConfig = Omit<ComponentConfig<TabsProps>, "props"> & {
  props: TabsProps;
  onTabChange?: (id: string) => void;
};

class Tabs extends Component<TabsProps> {
  private _onTabChange?: (id: string) => void;

  constructor(config: TabsConfig) {
    super(config);
    this._onTabChange = config.onTabChange;

    this.on("keypress", (event) => {
      const { tabs, activeTab } = this.props;
      const currentIndex = tabs.findIndex((t) => t.id === activeTab);
      if (currentIndex === -1) return;

      if (event.key === "left") {
        const newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        const newTab = tabs[newIndex]!;
        this.setProps({ activeTab: newTab.id });
        this._onTabChange?.(newTab.id);
      } else if (event.key === "right") {
        const newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
        const newTab = tabs[newIndex]!;
        this.setProps({ activeTab: newTab.id });
        this._onTabChange?.(newTab.id);
      }
    });
  }

  render(_context?: RenderContext): RenderOutput {
    const { tabs, activeTab } = this.props;
    const segments: StyledSegment[] = [];

    for (let i = 0; i < tabs.length; i++) {
      if (i > 0) {
        segments.push({ text: " │ " });
      }

      const tab = tabs[i]!;
      const isActive = tab.id === activeTab;

      segments.push({
        text: ` ${tab.label} `,
        style: isActive
          ? { bold: true, underline: true }
          : { dim: true },
      });
    }

    return { text: "", segments } as RenderLine;
  }
}

export { Tabs };
export type { TabsProps, TabsConfig, Tab };
