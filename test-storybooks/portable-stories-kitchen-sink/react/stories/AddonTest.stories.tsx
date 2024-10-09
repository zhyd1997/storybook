import { expect } from '@storybook/test'
import type { StoryAnnotations } from 'storybook/internal/types';

const Component = () => <button>test</button>

export default {
  title: 'Addons/Test',
  component: Component,
};

export const ExpectedFailure = {
  args: {
    forceFailure: false,
  },
  play: async (context) => {
    await expect(1).toBe(1)
    if (context.args.forceFailure) {
      throw new Error('Expected failure');
    }
  }
} satisfies StoryAnnotations;

export const ExpectedSuccess = {
  play: async () => {
    await expect(1).toBe(1)
  }
} satisfies StoryAnnotations;

export const LongRunning = {
  loaders: [async () => new Promise((resolve) => setTimeout(resolve, 800))],
} satisfies StoryAnnotations;
