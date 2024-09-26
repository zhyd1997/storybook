import type { StoryAnnotations } from 'storybook/internal/types';

import { global as globalThis } from '@storybook/global';

export default {
  component: globalThis.Components.Button,
  args: {
    label: 'test',
    forceFailure: false,
  },
  argTypes: {
    forceFailure: {
      control: {
        type: 'boolean',
      },
    },
  },
  globals: {
    sb_theme: 'light',
  },
};

export const ExpectedFailure = {
  play: async (context) => {
    if (context.args.forceFailure) {
      throw new Error('Expected failure');
    }
  },
} satisfies StoryAnnotations;

export const ExpectedSuccess = {} satisfies StoryAnnotations;

export const LongRunning = {
  loaders: [async () => new Promise((resolve) => setTimeout(resolve, 2000))],
} satisfies StoryAnnotations;
