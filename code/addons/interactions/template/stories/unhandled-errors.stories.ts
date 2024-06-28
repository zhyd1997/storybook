import { global as globalThis } from '@storybook/global';

export default {
  component: globalThis.Components.Button,
  args: {
    label: 'Button',
  },
  argTypes: {
    onClick: { type: 'function' },
  },
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    chromatic: { disable: true },
  },
};

export const Default = {
  play: async (context) => {
    const { userEvent, canvas } = context;
    await userEvent.click(canvas.getByRole('button'));
  },
};
