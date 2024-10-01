import { type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

import type { Channel } from 'storybook/internal/channels';
import {
  TESTING_MODULE_CANCEL_TEST_RUN_REQUEST,
  TESTING_MODULE_CRASH_REPORT,
  TESTING_MODULE_RUN_ALL_REQUEST,
  TESTING_MODULE_RUN_REQUEST,
  TESTING_MODULE_WATCH_MODE_REQUEST,
} from 'storybook/internal/core-events';

import { execaNode } from 'execa';

import { log } from '../logger';

const MAX_START_ATTEMPTS = 3;
const MAX_START_TIME = 8000;

// This path is a bit confusing, but essentially `boot-test-runner` gets bundled into the preset bundle
// which is at the root. Then, from the root, we want to load `node/vitest.mjs`
const vitestModulePath = join(__dirname, 'node', 'vitest.mjs');

export const bootTestRunner = async (channel: Channel, initEvent?: string, initArgs?: any[]) => {
  let aborted = false;
  let child: null | ChildProcess;

  const forwardRun = (...args: any[]) =>
    child?.send({ args, from: 'server', type: TESTING_MODULE_RUN_REQUEST });
  const forwardRunAll = (...args: any[]) =>
    child?.send({ args, from: 'server', type: TESTING_MODULE_RUN_ALL_REQUEST });
  const forwardWatchMode = (...args: any[]) =>
    child?.send({ args, from: 'server', type: TESTING_MODULE_WATCH_MODE_REQUEST });
  const forwardCancel = (...args: any[]) =>
    child?.send({ args, from: 'server', type: TESTING_MODULE_CANCEL_TEST_RUN_REQUEST });

  const killChild = () => {
    channel.off(TESTING_MODULE_RUN_REQUEST, forwardRun);
    channel.off(TESTING_MODULE_RUN_ALL_REQUEST, forwardRunAll);
    channel.off(TESTING_MODULE_WATCH_MODE_REQUEST, forwardWatchMode);
    channel.off(TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, forwardCancel);
    child?.kill();
    child = null;
  };

  const exit = (code = 0) => {
    killChild();
    process.exit(code);
  };

  process.on('exit', exit);
  process.on('SIGINT', () => exit(0));
  process.on('SIGTERM', () => exit(0));

  const startChildProcess = (attempt = 1) =>
    new Promise<void>((resolve, reject) => {
      child = execaNode(vitestModulePath);
      child.stdout?.on('data', log);
      child.stderr?.on('data', (data) => {
        const message = data.toString();
        // TODO: improve this error handling. Example use case is Playwright is not installed
        if (message.includes('Error: browserType.launch')) {
          channel.emit(TESTING_MODULE_CRASH_REPORT, message);
        }

        log(data);
      });

      child.on('message', (result: any) => {
        if (result.type === 'ready') {
          // Resend the event that triggered the boot sequence, now that the child is ready to handle it
          if (initEvent && initArgs) {
            child?.send({ type: initEvent, args: initArgs, from: 'server' });
          }

          // Forward all events from the channel to the child process
          channel.on(TESTING_MODULE_RUN_REQUEST, forwardRun);
          channel.on(TESTING_MODULE_RUN_ALL_REQUEST, forwardRunAll);
          channel.on(TESTING_MODULE_WATCH_MODE_REQUEST, forwardWatchMode);
          channel.on(TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, forwardCancel);

          resolve();
        } else if (result.type === 'error') {
          killChild();

          if (result.message) {
            log(result.message);
          }
          if (result.error) {
            log(result.error);
          }

          if (attempt >= MAX_START_ATTEMPTS) {
            log(`Aborting test runner process after ${attempt} restart attempts`);
            reject();
          } else if (!aborted) {
            log(`Restarting test runner process (attempt ${attempt}/${MAX_START_ATTEMPTS})`);
            setTimeout(() => startChildProcess(attempt + 1).then(resolve, reject), 1000);
          }
        } else {
          channel.emit(result.type, ...result.args);
        }
      });
    });

  const timeout = new Promise((_, reject) =>
    setTimeout(reject, MAX_START_TIME, new Error('Aborting test runner process due to timeout'))
  );

  await Promise.race([startChildProcess(), timeout]).catch((e) => {
    log(e.message);
    aborted = true;
    throw e;
  });
};
