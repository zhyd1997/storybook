import { hasVitePlugins } from '@storybook/builder-vite';

import type { BabelOptions, Options as ReactOptions } from '@vitejs/plugin-react';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

import type { FrameworkOptions, StorybookConfig } from './types';

function reactNativeWeb(
  reactOptions: Omit<ReactOptions, 'babel'> & { babel?: BabelOptions }
): Plugin {
  const plugin: Plugin = {
    name: 'vite:react-native-web',
    enforce: 'pre',
    config(_userConfig, env) {
      return {
        plugins: [
          react({
            jsxRuntime: 'automatic',
            ...reactOptions,
          }),
        ],
        define: {
          // reanimated support
          'global.__x': {},
          _frameTimestamp: undefined,
          _WORKLET: false,
          __DEV__: `${env.mode === 'development'}`,
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || env.mode),
        },
        optimizeDeps: {
          include: [],
          esbuildOptions: {
            jsx: 'transform',
            resolveExtensions: [
              '.web.js',
              '.web.ts',
              '.web.tsx',
              '.js',
              '.jsx',
              '.json',
              '.ts',
              '.tsx',
              '.mjs',
            ],
            loader: {
              '.js': 'jsx',
            },
          },
        },
        resolve: {
          extensions: [
            '.web.js',
            '.web.ts',
            '.web.tsx',
            '.js',
            '.jsx',
            '.json',
            '.ts',
            '.tsx',
            '.mjs',
          ],
          alias: {
            'react-native': 'react-native-web',
          },
        },
      };
    },
  };

  return plugin;
}

export const viteFinal: StorybookConfig['viteFinal'] = async (config, options) => {
  const { pluginReactOptions = {} } =
    await options.presets.apply<FrameworkOptions>('frameworkOptions');

  const { plugins = [] } = config;

  if (!(await hasVitePlugins(plugins, ['vite:react-native-web']))) {
    plugins.push(reactNativeWeb(pluginReactOptions));
  }

  return config;
};

export const core = {
  builder: '@storybook/builder-vite',
  renderer: '@storybook/react',
};
