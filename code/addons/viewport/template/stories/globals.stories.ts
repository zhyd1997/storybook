import { global as globalThis } from '@storybook/global';
import { MINIMAL_VIEWPORTS } from '@storybook/addon-viewport';

const first = Object.keys(MINIMAL_VIEWPORTS)[0];

export default {
  component: globalThis.Components.Button,
  args: {
    label: 'Click Me!',
  },
  globals: {},
  parameters: {
    chromatic: { disable: true },
  },
};

export const Unset = {
  globals: {},
};
export const Selected = {
  globals: {
    viewport: first,
    viewportRotated: false,
  },
};

export const Orientation = {
  globals: {
    viewport: first,
    viewportRotated: true,
  },
};

export const Missing = {
  globals: {
    viewport: 'phone',
    viewportRotated: false,
  },
};
