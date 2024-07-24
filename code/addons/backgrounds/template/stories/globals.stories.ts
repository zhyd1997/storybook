import { global as globalThis } from '@storybook/global';

export default {
  component: globalThis.Components.Pre,
  args: {
    text: 'Testing the background',
  },
  parameters: {
    chromatic: { disable: true },
    backgrounds: {
      options: {
        red: { name: 'light', value: 'red' },
        darker: { name: 'darker', value: '#000' },
      },
    },
  },
};

export const Set = {
  globals: {
    backgrounds: { value: 'red' },
  },
};

export const SetAndCustom = {
  parameters: {
    backgrounds: {
      options: {
        pink: { value: '#F99CB4', name: 'pink' },
      },
    },
  },
  globals: {
    backgrounds: { value: 'pink' },
  },
};

export const UnsetCustom = {
  parameters: {
    backgrounds: {
      options: {
        pink: { value: '#d45a00', name: 'hot' },
      },
    },
  },
};

export const Disabled = {
  parameters: {
    backgrounds: {
      disabled: true,
    },
  },
};

export const Grid = {
  globals: {
    backgrounds: { grid: true },
  },
};

export const GridAndBackground = {
  globals: {
    backgrounds: { grid: true, value: 'darker' },
  },
};

export const GridConfig = {
  parameters: {
    backgrounds: {
      grid: {
        cellSize: 100,
        cellAmount: 10,
        opacity: 0.8,
      },
    },
  },
  globals: {
    backgrounds: { grid: true, value: 'light' },
  },
};

export const GridOffset = {
  parameters: {
    backgrounds: {
      grid: {
        cellSize: 100,
        cellAmount: 10,
        opacity: 0.8,
        offsetX: 50,
        offsetY: 50,
      },
    },
  },
  globals: {
    backgrounds: { grid: true, value: 'light' },
  },
};
