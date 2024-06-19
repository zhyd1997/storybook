import type { WebRenderer } from '@storybook/core/types';
import type { AnyComponent } from 'preact';

export type { RenderContext } from '@storybook/core/types';

export type StoryFnPreactReturnType = string | Node | preact.JSX.Element;

export interface ShowErrorArgs {
  title: string;
  description: string;
}

export interface PreactRenderer extends WebRenderer {
  component: AnyComponent<any, any>;
  storyResult: StoryFnPreactReturnType;
}
