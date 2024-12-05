import { Meta } from '@storybook/react'
import type { StoryAnnotations } from 'storybook/internal/types';

declare global {
  // eslint-disable-next-line no-var
  var __vitest_browser__: boolean;
}

const Component = () => <button>test</button>

export default {
  title: 'Addons/Group/Other',
  component: Component,
} as Meta<typeof Component>;

export const Passes = {
} satisfies StoryAnnotations;

export const Fails = {
  play: async () => {
    throw new Error('Expected failure');
  },
  tags: ['fail-on-purpose'],
} satisfies StoryAnnotations;
