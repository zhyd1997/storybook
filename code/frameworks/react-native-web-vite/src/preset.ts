import { viteFinal as reactViteFinal } from '@storybook/react-vite/preset';

import { esbuildFlowPlugin, flowPlugin } from '@bunchtogether/vite-plugin-flow';
import react from '@vitejs/plugin-react';
import type { InlineConfig, PluginOption } from 'vite';
import babel from 'vite-plugin-babel';
import tsconfigPaths from 'vite-tsconfig-paths';

import type { FrameworkOptions, StorybookConfig } from './types';

export function reactNativeWeb(): PluginOption {
  return {
    name: 'vite:react-native-web',
    config(_userConfig, env) {
      return {
        define: {
          // reanimated support
          'global.__x': {},
          _frameTimestamp: undefined,
          _WORKLET: false,
          __DEV__: `${env.mode === 'development'}`,
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || env.mode),
          // this is for the expo preset
          'process.env.EXPO_OS': JSON.stringify('web'),
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
}

export const viteFinal: StorybookConfig['viteFinal'] = async (config, options) => {
  const { mergeConfig } = await import('vite');

  const { pluginReactOptions = {} } =
    await options.presets.apply<FrameworkOptions>('frameworkOptions');

  const reactConfig = await reactViteFinal(config, options);

  const { plugins = [] } = reactConfig;

  plugins.unshift(
    tsconfigPaths(),
    flowPlugin({
      exclude: [/node_modules\/(?!react-native|@react-native)/],
    }),
    react({
      jsxRuntime: 'automatic',
      ...pluginReactOptions,
      babel: {
        ...pluginReactOptions.babel,
        babelrc: false,
        configFile: false,
        plugins: ['react-native-web', ...(pluginReactOptions.babel?.plugins || [])],
      },
    }),

    // we need to add this extra babel config because the react plugin doesn't allow
    // for transpiling node_modules. However we keep the react plugin to get the fast refresh
    // and other benefits
    babel({
      include: pluginReactOptions.include
        ? pluginReactOptions.include
        : [/node_modules\/(react-native|@react-native)/],
      // gesture handler is already transpiled
      exclude: pluginReactOptions.exclude
        ? pluginReactOptions.exclude
        : [/node_modules\/(react-native-gesture-handler)/],
      babelConfig: {
        ...pluginReactOptions.babel,
        babelrc: false,
        configFile: false,
        presets: [
          [
            'babel-preset-expo',
            {
              ...(pluginReactOptions.jsxImportSource
                ? { jsxImportSource: pluginReactOptions.jsxImportSource }
                : {}),
              ...(pluginReactOptions.jsxRuntime
                ? { jsxRuntime: pluginReactOptions.jsxRuntime }
                : {}),
            },
          ],
          ...(pluginReactOptions.babel?.presets || []),
        ],
        plugins: ['react-native-web', ...(pluginReactOptions.babel?.plugins || [])],
      },
    })
  );

  plugins.push(reactNativeWeb());

  return mergeConfig(reactConfig, {
    optimizeDeps: {
      esbuildOptions: {
        plugins: [esbuildFlowPlugin(new RegExp(/\.(flow|jsx?)$/), (_path: string) => 'jsx')],
      },
    },
  } satisfies InlineConfig);
};

export const core = {
  builder: '@storybook/builder-vite',
  renderer: '@storybook/react',
};
