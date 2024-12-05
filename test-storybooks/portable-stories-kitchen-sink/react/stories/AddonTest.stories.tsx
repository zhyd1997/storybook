import { expect } from '@storybook/test';
import { Meta, type StoryObj } from '@storybook/react'
import { instrument } from '@storybook/instrumenter'
import type { StoryAnnotations } from 'storybook/internal/types';

declare global {
  // eslint-disable-next-line no-var
  var __vitest_browser__: boolean;
}

const Component = () => <button>test</button>

const meta = {
  title: 'Addons/Group/Test',
  component: Component,
} as Meta<typeof Component>;

export default meta;

type Story = StoryObj<typeof meta>;

const { pass } = instrument({
  pass: async () => {},
}, { intercept: true })

export const ExpectedFailure = {
  args: {
    forceFailure: false,
  },
  play: async ({ args }) => {
    await pass();
    if(args.forceFailure) {
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

// Tests will pass in browser, but fail in CLI
export const MismatchFailure = {
  play: async () => {
    await pass();
    if(!globalThis.__vitest_browser__) {
      throw new Error('Expected failure');
    }
  }
} satisfies StoryAnnotations;

// Tests will fail in browser, but pass in CLI
export const MismatchSuccess = {
  play: async () => {
    await pass();
    if(globalThis.__vitest_browser__) {
      throw new Error('Unexpected success');
    }
  },
  tags: ['fail-on-purpose'],
} satisfies StoryAnnotations;

export const PreviewHeadTest: Story = {
  play: async () => {
    const styles = window.getComputedStyle(document.body);
    // set in preview-head.html
    expect(styles.backgroundColor).toBe('rgb(250, 250, 210)');
    // set in main.js#previewHead
    expect(styles.borderColor).toBe('rgb(255, 0, 0)');
  }
};
