import process from 'node:process';

import { Channel } from 'storybook/internal/channels';

import { TestManager } from './test-manager';

process.env.TEST = 'true';
process.env.VITEST = 'true';
process.env.NODE_ENV ??= 'test';

const channel: Channel = new Channel({
  async: true,
  transport: {
    send: (event) => {
      if (process.send) {
        process.send(event);
      }
    },
    setHandler: (handler) => {
      process.on('message', handler);
    },
  },
});

const testManager = new TestManager(channel);
testManager.restartVitest();

process.on('uncaughtException', (err) => {
  process.send?.({ type: 'error', message: 'Uncaught Exception', error: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  throw new Error(`Unhandled Rejection: ${reason}`);
});
