import { global as globalThis } from '@storybook/global';
import { img } from './img';

export default {
  component: globalThis.Components.Button,
  args: {
    label: 'Click Me!',
  },
  parameters: {
    chromatic: { disable: true },
  },
};

export const Name = {
  globals: {
    backgrounds: { value: 'red' },
  },
};

export const Hex = {
  globals: {
    backgrounds: { value: '#F99CB4' },
  },
};

export const Gradient = {
  globals: {
    backgrounds: { value: 'linear-gradient(90deg, #CA005E 0%, #863783 50%, #112396)' },
  },
};

export const Image = {
  globals: {
    backgrounds: { value: `#000 center / cover no-repeat url(data:image/svg+xml;base64,${img})` },
  },
};
