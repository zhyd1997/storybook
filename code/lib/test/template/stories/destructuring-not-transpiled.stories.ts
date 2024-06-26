import { expect } from '@storybook/test';
import { global as globalThis } from '@storybook/global';

export default {
  component: globalThis.Components.Button,
  args: { label: 'Button' },
};

async function fn({ destructure }) {
  console.log(destructure);
}

// We must not transpile destructuring, to make sure that we can analyze the context properties that are used in play.
// See: https://github.com/storybookjs/storybook/discussions/27389
export const DestructureNotTranspiled = {
  async play() {
    await expect(fn.toString()).toBe('async function fn({ destructure }) {}');
  },
};
