import { Component } from "./component.js";
import type {
  Props,
  RenderOutput,
  RenderContext,
  ComponentConfig,
} from "./component.js";

type FunctionalComponentConfig<P extends Props = {}> = ComponentConfig<P> & {
  render: (props: P, context?: RenderContext) => RenderOutput;
  onMount?: () => void;
  onDestroy?: () => void;
};

function createComponent<P extends Props = {}>(
  config: FunctionalComponentConfig<P>
): Component<P> {
  const { render: renderFn, onMount, onDestroy, ...componentConfig } = config;

  class FunctionalComponent extends Component<P> {
    render(context?: RenderContext): RenderOutput {
      return renderFn(this.props, context);
    }
  }

  const instance = new FunctionalComponent(componentConfig as ComponentConfig<P>);

  if (onMount) {
    instance.on("mount", onMount);
  }
  if (onDestroy) {
    instance.on("destroy", onDestroy);
  }

  return instance;
}

export { createComponent };
export type { FunctionalComponentConfig };
