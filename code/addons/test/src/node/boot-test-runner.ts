import { type ChildProcess, fork } from 'node:child_process';
import { join } from 'node:path';

import type { Channel } from 'storybook/internal/channels';
import {
  TESTING_MODULE_CANCEL_TEST_RUN_REQUEST,
  TESTING_MODULE_RUN_ALL_REQUEST,
  TESTING_MODULE_RUN_REQUEST,
  TESTING_MODULE_WATCH_MODE_REQUEST,
} from 'storybook/internal/core-events';

import { log } from '../logger';

export function bootTestRunner(channel: Channel) {
  // This path is a bit confusing, but essentiall `boot-test-runner` gets bundled into the preset bundle
  // which is at the root. Then, from the root, we want to load `node/vitest.js`
  const sub = join(__dirname, 'node', 'vitest.js');

  let child: ChildProcess;

  function restartChildProcess() {
    child?.kill();
    log('Restarting Child Process...');
    child = startChildProcess();
  }

  function startChildProcess() {
    child = fork(sub, [], {
      // We want to pipe output and error
      // so that we can prefix the logs in the terminal
      // with a clear identifier
      stdio: ['inherit', 'pipe', 'pipe', 'ipc'],
      silent: true,
    });

    child.stdout?.on('data', (data) => {
      log(data);
    });

    child.stderr?.on('data', (data) => {
      log(data);
    });

    child.on('message', (result: any) => {
      if (result.type === 'error') {
        log(result.message);
        log(result.error);
        restartChildProcess();
      } else {
        channel.emit(result.type, ...(result.args || []));
      }
    });

    return child;
  }

  child = startChildProcess();

  channel.on(TESTING_MODULE_RUN_REQUEST, (...args) => {
    child.send({ type: TESTING_MODULE_RUN_REQUEST, args, from: 'server' });
  });

  channel.on(TESTING_MODULE_RUN_ALL_REQUEST, (...args) => {
    child.send({ type: TESTING_MODULE_RUN_ALL_REQUEST, args, from: 'server' });
  });

  channel.on(TESTING_MODULE_WATCH_MODE_REQUEST, (...args) => {
    child.send({ type: TESTING_MODULE_WATCH_MODE_REQUEST, args, from: 'server' });
  });

  channel.on(TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, (...args) => {
    child.send({ type: TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, args, from: 'server' });
  });
}
