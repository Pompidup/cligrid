import { Component } from "../entities/component.js";
import type { RenderOutput, RenderContext, RenderLine, ComponentConfig } from "../entities/component.js";

type SpinnerStyle = "dots" | "line" | "arc" | "bouncingBar";

type SpinnerProps = {
  label?: string;
  style?: SpinnerStyle;
  frameIndex?: number;
};

type SpinnerConfig = Omit<ComponentConfig<SpinnerProps>, "props"> & {
  props?: SpinnerProps;
};

const SPINNER_FRAMES: Record<SpinnerStyle, string[]> = {
  dots: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  line: ["-", "\\", "|", "/"],
  arc: ["◜", "◠", "◝", "◞", "◡", "◟"],
  bouncingBar: ["[    ]", "[=   ]", "[==  ]", "[=== ]", "[ ===]", "[  ==]", "[   =]", "[    ]"],
};

class Spinner extends Component<SpinnerProps> {
  private _interval?: ReturnType<typeof setInterval>;

  constructor(config: SpinnerConfig) {
    super({
      ...config,
      props: config.props ?? {},
    });

    this.on("mount", () => {
      this.startAnimation();
    });

    this.on("destroy", () => {
      this.stopAnimation();
    });
  }

  private startAnimation(): void {
    if (this._interval) return;
    this._interval = setInterval(() => {
      this.nextFrame();
    }, 80);
  }

  private stopAnimation(): void {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  nextFrame(): void {
    const style = this.props.style ?? "dots";
    const frames = SPINNER_FRAMES[style];
    const current = this.props.frameIndex ?? 0;
    this.setProps({ frameIndex: (current + 1) % frames.length });
  }

  getFrames(): string[] {
    const style = this.props.style ?? "dots";
    return SPINNER_FRAMES[style];
  }

  render(_context?: RenderContext): RenderOutput {
    const style = this.props.style ?? "dots";
    const frames = SPINNER_FRAMES[style];
    const frameIndex = this.props.frameIndex ?? 0;
    const frame = frames[frameIndex % frames.length]!;
    const label = this.props.label;

    const text = label ? `${frame} ${label}` : frame;
    return { text } as RenderLine;
  }
}

export { Spinner, SPINNER_FRAMES };
export type { SpinnerProps, SpinnerConfig, SpinnerStyle };
