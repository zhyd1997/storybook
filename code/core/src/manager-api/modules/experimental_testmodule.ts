import { Addon_TypesEnum } from '@storybook/core/types';

import {
  TESTING_MODULE_CANCEL_TEST_RUN_REQUEST,
  TESTING_MODULE_RUN_ALL_REQUEST,
  type TestProviderId,
  type TestProviderState,
  type TestProviders,
} from '@storybook/core/core-events';

import type { ModuleFn } from '../lib/types';

export type SubState = {
  testProviders: TestProviders;
};

const initialTestProviderState: TestProviderState = {
  details: {} as { [key: string]: any },
  cancellable: false,
  cancelling: false,
  running: false,
  watching: false,
  failed: false,
  crashed: false,
};

interface RunOptions {
  selection?: string[];
}

export type SubAPI = {
  getTestProviderState(id: string): TestProviderState | undefined;
  updateTestProviderState(id: TestProviderId, update: Partial<TestProviderState>): void;
  clearTestProviderState(id: TestProviderId): void;
  runTestProvider(id: TestProviderId, options?: RunOptions): void;
  cancelTestProvider(id: TestProviderId): void;
};

export const init: ModuleFn = ({ store, fullAPI }) => {
  const state: SubState = {
    testProviders: store.getState().testProviders || {},
  };

  const api: SubAPI = {
    getTestProviderState(id) {
      const { testProviders } = store.getState();

      return testProviders?.[id];
    },
    updateTestProviderState(id, update) {
      return store.setState(
        ({ testProviders }) => {
          return { testProviders: { ...testProviders, [id]: { ...testProviders[id], ...update } } };
        },
        { persistence: 'session' }
      );
    },
    clearTestProviderState(id) {
      const update = {
        cancelling: false,
        running: true,
        failed: false,
        crashed: false,
        progress: undefined,
      };
      return store.setState(
        ({ testProviders }) => {
          return { testProviders: { ...testProviders, [id]: { ...testProviders[id], ...update } } };
        },
        { persistence: 'session' }
      );
    },
    runTestProvider(id, options) {
      if (options?.selection) {
        const listOfFiles: string[] = [];

        // TODO: get actual list and emit, this notification is for development purposes
        fullAPI.addNotification({
          id: 'testing-module',

          content: {
            headline: 'Running tests',
            subHeadline: `Running tests for ${listOfFiles} stories`,
          },
        });
        // fullAPI.emit(TESTING_MODULE_RUN_REQUEST, { providerId: id, selection: [] });
      } else {
        fullAPI.emit(TESTING_MODULE_RUN_ALL_REQUEST, { providerId: id });
      }

      return () => api.cancelTestProvider(id);
    },
    cancelTestProvider(id) {
      api.updateTestProviderState(id, { cancelling: true });
      fullAPI.emit(TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, { providerId: id });
    },
  };

  const initModule = async () => {
    const initialState: TestProviders = Object.fromEntries(
      Object.entries(fullAPI.getElements(Addon_TypesEnum.experimental_TEST_PROVIDER)).map(
        ([id, config]) => [
          id,
          {
            ...config,
            ...initialTestProviderState,
            ...(state?.testProviders?.[id] || {}),
          } as TestProviders[0],
        ]
      )
    );

    store.setState({ testProviders: initialState }, { persistence: 'session' });
  };

  return { init: initModule, state, api };
};
