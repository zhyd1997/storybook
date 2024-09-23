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

const MAX_RESTART_ATTEMPTS = 2;

// This path is a bit confusing, but essentially `boot-test-runner` gets bundled into the preset bundle
// which is at the root. Then, from the root, we want to load `node/vitest.js`
const vitestModulePath = join(__dirname, 'node', 'vitest.js');

export const bootTestRunner = (channel: Channel, initEvent?: string, initArgs?: any[]) =>
  new Promise((resolve, reject) => {
    let attempts = 0;
    let child: null | ChildProcess;

    const forwardRun = (...args: any[]): void => {
      child?.send({ type: TESTING_MODULE_RUN_REQUEST, args, from: 'server' });
    };
    const forwardRunAll = (...args: any[]): void => {
      child?.send({ type: TESTING_MODULE_RUN_ALL_REQUEST, args, from: 'server' });
    };
    const forwardWatchMode = (...args: any[]): void => {
      child?.send({ type: TESTING_MODULE_WATCH_MODE_REQUEST, args, from: 'server' });
    };
    const forwardCancel = (...args: any[]): void => {
      child?.send({ type: TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, args, from: 'server' });
    };

    const startChildProcess = () => {
      child = fork(vitestModulePath, [], {
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
        switch (result.type) {
          case 'ready': {
            attempts = 0;
            child?.send({ type: initEvent, args: initArgs, from: 'server' });
            channel.on(TESTING_MODULE_RUN_REQUEST, forwardRun);
            channel.on(TESTING_MODULE_RUN_ALL_REQUEST, forwardRunAll);
            channel.on(TESTING_MODULE_WATCH_MODE_REQUEST, forwardWatchMode);
            channel.on(TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, forwardCancel);
            channel.emit(result.type, ...(result.args || []));
            resolve(result);
            return;
          }

          case 'error': {
            channel.off(TESTING_MODULE_RUN_REQUEST, forwardRun);
            channel.off(TESTING_MODULE_RUN_ALL_REQUEST, forwardRunAll);
            channel.off(TESTING_MODULE_WATCH_MODE_REQUEST, forwardWatchMode);
            channel.off(TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, forwardCancel);

            child?.kill();
            child = null;

            if (result.message) {
              log(result.message);
            }
            if (result.error) {
              log(result.error);
            }

            if (attempts >= MAX_RESTART_ATTEMPTS) {
              log(`Aborting test runner process after ${MAX_RESTART_ATTEMPTS} restart attempts`);
              channel.emit(
                'error',
                `Aborting test runner process after ${MAX_RESTART_ATTEMPTS} restart attempts`
              );
              reject(new Error('Test runner process failed to start'));
            } else {
              attempts += 1;
              log(`Restarting test runner process (attempt ${attempts}/${MAX_RESTART_ATTEMPTS})`);
              setTimeout(startChildProcess, 500);
            }
            return;
          }
        }
      });
    };

    startChildProcess();

    process.on('exit', () => {
      child?.kill();
      process.exit(0);
    });
    process.on('SIGINT', () => {
      child?.kill();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      child?.kill();
      process.exit(0);
    });
  });
