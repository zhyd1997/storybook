import type { Channel } from 'storybook/internal/channels';
import {
  TESTING_MODULE_RUN_ALL_REQUEST,
  TESTING_MODULE_RUN_PROGRESS_RESPONSE,
  TESTING_MODULE_RUN_REQUEST,
  TESTING_MODULE_WATCH_MODE_REQUEST,
  type TestingModuleRunAllRequestPayload,
  type TestingModuleRunProgressPayload,
  type TestingModuleRunRequestPayload,
  type TestingModuleWatchModeRequestPayload,
} from 'storybook/internal/core-events';

import { TEST_PROVIDER_ID } from '../constants';
import { VitestManager } from './vitest-manager';

export class TestManager {
  private options: {
    onError: (message: string, error: Error) => void;
    onReady: () => void;
  };

  private vitestManager: VitestManager;

  watchMode = false;

  constructor(
    private channel: Channel,
    options: typeof TestManager.prototype.options
  ) {
    process.env.TEST = 'true';
    process.env.VITEST = 'true';
    process.env.NODE_ENV ??= 'test';

    this.options = options;
    this.vitestManager = new VitestManager(channel, this);

    this.channel.on(TESTING_MODULE_RUN_REQUEST, this.handleRunRequest.bind(this));
    this.channel.on(TESTING_MODULE_RUN_ALL_REQUEST, this.handleRunAllRequest.bind(this));
    this.channel.on(TESTING_MODULE_WATCH_MODE_REQUEST, this.handleWatchModeRequest.bind(this));

    this.vitestManager.startVitest().then(options.onReady);
  }

  async restartVitest(watchMode = false) {
    await this.vitestManager.closeVitest();
    await this.vitestManager.startVitest(watchMode);
  }

  async handleWatchModeRequest(request: TestingModuleWatchModeRequestPayload) {
    try {
      if (request.providerId !== TEST_PROVIDER_ID) {
        return;
      }

      if (this.watchMode !== request.watchMode) {
        this.watchMode = request.watchMode;
        await this.restartVitest(this.watchMode);
      }
    } catch (e) {
      this.reportFatalError('Failed to change watch mode', e);
    }
  }

  async handleRunRequest(request: TestingModuleRunRequestPayload) {
    try {
      if (request.providerId !== TEST_PROVIDER_ID) {
        return;
      }

      await this.vitestManager.runTests(request.payload);
    } catch (e) {
      this.reportFatalError('Failed to run tests', e);
    }
  }

  async handleRunAllRequest(request: TestingModuleRunAllRequestPayload) {
    try {
      if (request.providerId !== TEST_PROVIDER_ID) {
        return;
      }

      await this.vitestManager.runAllTests();
    } catch (e) {
      this.reportFatalError('Failed to run all tests', e);
    }
  }

  async sendProgressReport(payload: TestingModuleRunProgressPayload) {
    this.channel.emit(TESTING_MODULE_RUN_PROGRESS_RESPONSE, payload);
  }

  async reportFatalError(message: string, error: Error | any) {
    this.options.onError(message, error);
  }
}
