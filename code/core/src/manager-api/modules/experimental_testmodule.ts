import { type API_StoryEntry, Addon_TypesEnum, type StoryId } from '@storybook/core/types';

import {
  TESTING_MODULE_CANCEL_TEST_RUN_REQUEST,
  TESTING_MODULE_RUN_ALL_REQUEST,
  TESTING_MODULE_RUN_REQUEST,
  TESTING_MODULE_WATCH_MODE_REQUEST,
  type TestProviderId,
  type TestProviderState,
  type TestProviders,
  type TestingModuleRunAllRequestPayload,
  type TestingModuleRunRequestPayload,
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
  entryId?: StoryId;
}

export type SubAPI = {
  getTestProviderState(id: string): TestProviderState | undefined;
  updateTestProviderState(id: TestProviderId, update: Partial<TestProviderState>): void;
  clearTestProviderState(id: TestProviderId): void;
  runTestProvider(id: TestProviderId, options?: RunOptions): () => void;
  setTestProviderWatchMode(id: TestProviderId, watchMode: boolean): void;
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
      console.log('LOG: runTestProvider', id, options);
      if (!options?.entryId) {
        console.log('LOG: runTestProvider: no entryId, running all tests');
        const payload: TestingModuleRunAllRequestPayload = { providerId: id };
        fullAPI.emit(TESTING_MODULE_RUN_ALL_REQUEST, payload);
        return () => api.cancelTestProvider(id);
      }

      const index = store.getState().index;
      if (!index) {
        throw new Error('no index?');
      }

      const entry = index[options.entryId];

      if (!entry) {
        throw new Error('no entry?');
      }

      if (entry.type === 'story') {
        console.log('LOG: runTestProvider: running single story', entry);
        const payload: TestingModuleRunRequestPayload = {
          providerId: id,
          payload: [
            {
              importPath: entry.importPath,
              stories: [
                {
                  id: entry.id,
                  name: entry.name,
                },
              ],
            },
          ],
        };
        fullAPI.emit(TESTING_MODULE_RUN_REQUEST, payload);
        return () => api.cancelTestProvider(id);
      }

      const payloads = new Set<TestingModuleRunRequestPayload['payload'][0]>();

      const findComponents = (entryId: StoryId) => {
        const foundEntry = index[entryId];
        console.log(`Processing entry: ${entryId}`, foundEntry);
        switch (foundEntry.type) {
          case 'component':
            console.log(`Adding component entry: ${entryId}`);
            const firstStoryId = foundEntry.children.find(
              (childId) => index[childId].type === 'story'
            );
            if (!firstStoryId) {
              // happens when there are only docs in the component
              return;
            }
            payloads.add({ importPath: (index[firstStoryId] as API_StoryEntry).importPath });
            return;
          case 'story': {
            // this shouldn't happen because we don't visit components' children.
            // so we never get to a story directly.
            // unless groups can have direct stories without components?
            console.log(`Adding story entry: ${entryId}`);
            payloads.add({
              importPath: foundEntry.importPath,
              stories: [
                {
                  id: foundEntry.id,
                  name: foundEntry.name,
                },
              ],
            });
            return;
          }
          case 'docs': {
            return;
          }
          default:
            console.log(`Processing children of entry: ${entryId}`);
            foundEntry.children.forEach(findComponents);
        }
      };
      console.log(`Starting to find components for entryId:`, options.entryId);
      findComponents(options.entryId);

      const payload: TestingModuleRunRequestPayload = {
        providerId: id,
        payload: Array.from(payloads),
      };
      console.log('LOG: payload', payload);
      fullAPI.emit(TESTING_MODULE_RUN_REQUEST, payload);

      return () => api.cancelTestProvider(id);
    },
    setTestProviderWatchMode(id, watchMode) {
      api.updateTestProviderState(id, { watching: watchMode });
      fullAPI.emit(TESTING_MODULE_WATCH_MODE_REQUEST, { providerId: id, watchMode });
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
