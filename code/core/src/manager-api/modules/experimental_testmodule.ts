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

const STORAGE_KEY = '@storybook/manager/test-providers';

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
  getTestproviderState(id: string): TestProviderState | undefined;
  updateTestproviderState(id: TestProviderId, update: Partial<TestProviderState>): void;
  clearTestproviderState(id: TestProviderId): void;
  runTestprovider(id: TestProviderId, options?: RunOptions): void;
  cancelTestprovider(id: TestProviderId): void;
};

export const init: ModuleFn = ({ store, fullAPI }) => {
  let sessionState: TestProviders = {};
  try {
    sessionState = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch (_) {
    //
  }

  const state: SubState = {
    testProviders: sessionState,
  };

  const api: SubAPI = {
    getTestproviderState(id) {
      const { testProviders } = store.getState();

      return testProviders?.[id];
    },
    updateTestproviderState(id, update) {
      return store.setState(
        ({ testProviders }) => {
          return { testProviders: { ...testProviders, [id]: { ...testProviders[id], ...update } } };
        },
        { persistence: 'session' }
      );
    },
    clearTestproviderState(id) {
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
    runTestprovider(id, options) {
      if (options?.selection) {
        const listOfFiles = [];
        // fullAPI.emit(TESTING_MODULE_RUN_REQUEST, { providerId: id, selection: [] });
      } else {
        fullAPI.emit(TESTING_MODULE_RUN_ALL_REQUEST, { providerId: id });
      }

      return () => api.cancelTestprovider(id);
    },
    cancelTestprovider(id) {
      api.updateTestproviderState(id, { cancelling: true });
      fullAPI.emit(TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, { providerId: id });
    },
  };

  const initModule = async () => {
    const initialState = Object.fromEntries(
      Object.entries(fullAPI.getElements(Addon_TypesEnum.experimental_TEST_PROVIDER)).map(
        ([id, config]) => [id, { ...config, ...initialTestProviderState, ...sessionState[id] }]
      )
    );

    store.setState({ testProviders: initialState }, { persistence: 'session' });
  };

  return { init: initModule, state, api };
};
