import type { Meta, StoryObj } from '@storybook/react';

import { DiscrepancyEyebrow } from './Eyebrow';

type Story = StoryObj<typeof DiscrepancyEyebrow>;

export default {
  title: 'Eyebrow',
  component: DiscrepancyEyebrow,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<typeof DiscrepancyEyebrow>;

export const BrowserPassedCliFailed: Story = {
  args: {
    browserTestStatus: 'pass',
  },
};

export const CliFailedBrowserPassed: Story = {
  args: {
    browserTestStatus: 'error',
  },
};
