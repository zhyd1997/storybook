/* eslint-disable no-underscore-dangle */
import { join } from 'node:path';
import type { Plugin } from 'vitest/config';
import { createRequire } from 'node:module';
import { transform } from './transformer';
import type { InternalOptions, UserOptions } from './types';
import { log } from './utils';

const DEFAULT_CONFIG_DIR = '.storybook';

const require = createRequire(import.meta.url);

const defaultOptions: UserOptions = {
  storybookScript: undefined,
  configDir: undefined,
  storybookUrl: 'http://localhost:6006',
  snapshot: false,
  skipRunningStorybook: false,
  tags: {
    skip: [],
    exclude: [],
    include: ['test'],
  },
};

export const storybookTest = (options?: UserOptions): Plugin => {
  const finalOptions = {
    ...defaultOptions,
    ...options,
    tags: {
      ...defaultOptions.tags,
      ...options?.tags,
    },
  } as InternalOptions;

  if (process.env.DEBUG) {
    finalOptions.debug = true;
  }

  const storybookUrl = finalOptions.storybookUrl || defaultOptions.storybookUrl;

  // To be accessed by the global setup file
  process.env.__STORYBOOK_URL__ = storybookUrl;
  process.env.__STORYBOOK_SCRIPT__ = finalOptions.storybookScript;

  return {
    name: 'vite-plugin-storybook-test',
    enforce: 'pre',
    async configureServer() {
      // this might be useful in the future
      if (!finalOptions.configDir) {
        finalOptions.configDir = join(process.cwd(), options?.configDir ?? DEFAULT_CONFIG_DIR);
      }
    },
    async config(config) {
      // If we end up needing to know if we are running in browser mode later
      // const isRunningInBrowserMode = config.plugins.find((plugin: Plugin) =>
      //   plugin.name?.startsWith('vitest:browser')
      // )
      config.test ??= {};

      config.test.env ??= {};
      config.test.env = {
        ...config.test.env,
        // To be accessed by the setup file
        __STORYBOOK_URL__: storybookUrl,
      };

      config.resolve ??= {};
      config.resolve.conditions ??= [];
      config.resolve.conditions.push('storybook', 'stories', 'test');

      config.test.setupFiles ??= [];
      if (typeof config.test.setupFiles === 'string') {
        config.test.setupFiles = [config.test.setupFiles];
      }
      config.test.setupFiles.push('@storybook/experimental-addon-vitest/internal/setup-file');

      // when a Storybook script is provided, we spawn Storybook for the user when in watch mode
      if (finalOptions.storybookScript) {
        config.test.globalSetup = config.test.globalSetup ?? [];
        if (typeof config.test.globalSetup === 'string') {
          config.test.globalSetup = [config.test.globalSetup];
        }
        config.test.globalSetup.push('@storybook/experimental-addon-vitest/internal/global-setup');
      }

      config.test.server ??= {};
      config.test.server.deps ??= {};
      config.test.server.deps.inline ??= [];
      if (Array.isArray(config.test.server.deps.inline)) {
        config.test.server.deps.inline.push('@storybook/experimental-addon-vitest');
      }

      log('Final plugin options:', finalOptions);

      return config;
    },
    async transform(code, id) {
      if (process.env.VITEST !== 'true') {
        return code;
      }

      if (id.match(/(story|stories)\.[cm]?[jt]sx?$/)) {
        return transform({
          code,
          id,
          options: finalOptions,
        });
      }
    },
  };
};

export default storybookTest;
