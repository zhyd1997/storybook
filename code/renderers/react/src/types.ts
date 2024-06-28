import type { ComponentType } from 'react';
import type { Canvas, WebRenderer } from '@storybook/types';

export type { RenderContext, StoryContext } from '@storybook/types';

export interface ReactRenderer extends WebRenderer {
  component: ComponentType<this['T']>;
  storyResult: StoryFnReactReturnType;
  mount: (ui?: JSX.Element) => Promise<Canvas>;
}

export interface ShowErrorArgs {
  title: string;
  description: string;
}

export type StoryFnReactReturnType = JSX.Element;
