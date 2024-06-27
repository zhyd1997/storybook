/* eslint-disable @typescript-eslint/naming-convention,storybook/prefer-pascal-case */
import { expect, within } from '@storybook/test';

const meta = {
  component: globalThis.Components.Button,
  args: { label: 'Button' },
};

export default meta;

export const canvas_is_equal_to_within_canvas_element = {
  parameters: { chromatic: { disable: true } },
  async play({ canvas, canvasElement }) {
    const oldCanvas = within(canvasElement);
    await expect(canvas satisfies typeof oldCanvas).toEqual(within(canvasElement));
  },
};
