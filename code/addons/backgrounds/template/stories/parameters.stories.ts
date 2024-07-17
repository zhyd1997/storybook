import { global as globalThis } from '@storybook/global';
import { img } from './img';

const COLORS = [
  { name: 'red', value: '#FB001D' },
  { name: 'orange', value: '#FB8118' },
  { name: 'yellow', value: '#FCFF0C' },
  { name: 'green', value: '#1AB408' },
  { name: 'blue', value: '#0F0084' },
  { name: 'purple', value: '#620073' },
];

export default {
  component: globalThis.Components.Button,
  args: {
    label: 'Click Me!',
  },
  parameters: {
    backgrounds: {
      values: COLORS,
    },
    chromatic: { disable: true },
  },
};

export const Default = {
  parameters: {
    backgrounds: {
      default: COLORS[0].name,
    },
  },
};

export const StorySpecific = {
  parameters: {
    backgrounds: {
      default: 'pink',
      values: [
        { name: 'white', value: '#F9F5F1' },
        { name: 'pink', value: '#F99CB4' },
        { name: 'teal', value: '#67CDE8' },
        { name: 'brown', value: '#4D2C10' },
        { name: 'black', value: '#000400' },
      ],
    },
  },
};

export const Gradient = {
  parameters: {
    backgrounds: {
      default: 'gradient',
      values: [
        {
          name: 'gradient',
          value: 'linear-gradient(90deg, #CA005E 0%, #863783 50%, #112396)',
        },
      ],
    },
  },
};

export const Image = {
  parameters: {
    backgrounds: {
      default: 'component-driven',
      values: [
        {
          name: 'component-driven',
          value: `#000 center / cover no-repeat url(data:image/svg+xml;base64,${img})`,
        },
      ],
    },
  },
};

export const Disabled = {
  parameters: {
    backgrounds: { disable: true },
  },
};
