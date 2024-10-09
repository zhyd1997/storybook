import { instrument } from '@storybook/instrumenter'
import type { StoryAnnotations } from 'storybook/internal/types';

const Component = () => <button>test</button>

export default {
  title: 'Addons/Test',
  component: Component,
};

const { pass } = instrument({
  pass: async () => {},
}, { intercept: true })

export const ExpectedFailure = {
  args: {
    forceFailure: false,
  },
  play: async (context) => {
    await pass();
    if (context.args.forceFailure) {
      throw new Error('Expected failure');
    }
  }
} satisfies StoryAnnotations;

export const ExpectedSuccess = {
  play: async () => {
    await pass();
  }
} satisfies StoryAnnotations;

export const LongRunning = {
  loaders: [async () => new Promise((resolve) => setTimeout(resolve, 800))],
} satisfies StoryAnnotations;
