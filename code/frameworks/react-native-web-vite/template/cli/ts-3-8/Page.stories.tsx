import type { Meta, StoryObj } from '@storybook/react';
import * as HeaderStories from './Header.stories';
import { Page } from './Page';

const meta: Meta<typeof Page> = {
  component: Page,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const LoggedIn: Story = {
  args: HeaderStories.LoggedIn.args,
};

export const LoggedOut: Story = {
  args: HeaderStories.LoggedOut.args,
};
