import type { StoryAnnotations } from 'storybook/internal/types';

import { global as globalThis } from '@storybook/global';

export default {
  component: globalThis.Components.Button,
  globals: {
    sb_theme: 'light',
  },
};

export const ExpectedFailure = {
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
  play: async (context) => {
    if (context.args.forceFailure) {
      throw new Error('Expected failure');
    }
  },
} satisfies StoryAnnotations;

export const ExpectedSuccess = {} satisfies StoryAnnotations;

export const LongRunning = {
  loaders: [async () => new Promise((resolve) => setTimeout(resolve, 800))],
} satisfies StoryAnnotations;
