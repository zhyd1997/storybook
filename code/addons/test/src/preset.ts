import type { Channel } from 'storybook/internal/channels';
import {
  TESTING_MODULE_RUN_ALL_REQUEST,
  TESTING_MODULE_RUN_REQUEST,
  TESTING_MODULE_WATCH_MODE_REQUEST,
} from 'storybook/internal/core-events';
import type { Options } from 'storybook/internal/types';

import { bootTestRunner } from './node/boot-test-runner';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const experimental_serverChannel = async (channel: Channel, options: Options) => {
  let booting = false;
  let booted = false;
  const start =
    (eventName: string) =>
    (...args: any[]) => {
      if (!booted && !booting) {
        booting = true;
        bootTestRunner(channel, eventName, args)
          .then(() => {
            booted = true;
          })
          .catch(() => {
            booted = false;
          })
          .finally(() => {
            booting = false;
          });
      }
    };

  channel.on(TESTING_MODULE_RUN_ALL_REQUEST, start(TESTING_MODULE_RUN_ALL_REQUEST));
  channel.on(TESTING_MODULE_RUN_REQUEST, start(TESTING_MODULE_RUN_REQUEST));
  channel.on(TESTING_MODULE_WATCH_MODE_REQUEST, (payload) => {
    if (payload.watchMode) {
      start(TESTING_MODULE_WATCH_MODE_REQUEST)(payload);
    }
  });

  return channel;
};

// TODO:
// 1 - Do not boot Vitest on Storybook boot, but rather on the first test run
// 2 - Handle cases where Vitest is already booted, so we dont boot it again
// 3 - Upon crash, provide a notification to the user
