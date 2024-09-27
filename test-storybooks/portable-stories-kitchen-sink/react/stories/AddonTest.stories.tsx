import type { StoryAnnotations } from 'storybook/internal/types';

const Component = () => <button>test</button>

export default {
  title: 'Addons/Test',
  component: Component,
};

export const ExpectedSuccess = {} satisfies StoryAnnotations;

export const LongRunning = {
  loaders: [async () => new Promise((resolve) => setTimeout(resolve, 800))],
} satisfies StoryAnnotations;

export const ExpectedFailure = {
  argTypes: {
    forceFailure: {
      control: {
        type: 'boolean',
      },
    },
  },
  args: {
    forceFailure: false,
  },
  play: async (context) => {
    if (context.args.forceFailure) {
      throw new Error('Expected failure');
    }
  }
} satisfies StoryAnnotations;