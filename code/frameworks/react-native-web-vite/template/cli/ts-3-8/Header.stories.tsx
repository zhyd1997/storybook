import type { Meta, StoryObj } from '@storybook/react';

import { Header } from './Header';

const meta: Meta<typeof Header> = {
  component: Header,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const LoggedIn: Story = {
  args: {
    user: {},
    onLogin: () => {},
    onLogout: () => {},
    onCreateAccount: () => {},
  },
};

export const LoggedOut: Story = {
  args: {
    onLogin: () => {},
    onLogout: () => {},
    onCreateAccount: () => {},
  },
};
