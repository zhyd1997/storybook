import { expect } from '@storybook/test';

export default {};

async function bla({ destructure }) {
  console.log(destructure);
}

// We must not transpile destructuring, to make sure that we can analyze the context properties that are used in play.
// See: https://github.com/storybookjs/storybook/discussions/27389
export const DestructureNotTranspiled = {
  async play() {
    await expect(bla.toString()).toBe('async function bla({ destructure }) {}');
  },
};
