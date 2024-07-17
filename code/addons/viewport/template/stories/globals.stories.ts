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
    viewport: {
      viewports: MINIMAL_VIEWPORTS,
    },
    chromatic: { disable: true },
  },
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

export const Custom = {
  globals: {
    viewport: 'phone',
    viewportRotated: false,
  },
  parameters: {
    viewport: {
      viewports: {
        phone: {
          name: 'Phone Width',
          styles: {
            height: '600px',
            width: '100vh',
          },
          type: 'mobile',
        },
      },
    },
  },
};
