import type { Channel } from 'storybook/internal/channels';
import type { Options } from 'storybook/internal/types';

import { bootTestRunner } from './node/boot-test-runner';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const experimental_serverChannel = async (channel: Channel, options: Options) => {
  bootTestRunner(channel);
  return channel;
};
