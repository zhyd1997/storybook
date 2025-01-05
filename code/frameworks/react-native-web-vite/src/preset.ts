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

  const isDevelopment = options.configType !== 'PRODUCTION';

  const reactConfig = await reactViteFinal(config, options);

  const { plugins = [] } = reactConfig;

  plugins.unshift(
    tsconfigPaths(),
    flowPlugin({
      exclude: [/node_modules\/(?!react-native|@react-native)/],
    }),
    react({
      ...pluginReactOptions,
      jsxRuntime: pluginReactOptions.jsxRuntime || 'automatic',
      babel: {
        babelrc: false,
        configFile: false,
        ...pluginReactOptions.babel,
      },
    }),

    // we need to add this extra babel config because the react plugin doesn't allow
    // for transpiling node_modules. However we keep the react plugin to get the fast refresh
    // and other benefits
    babel({
      include: pluginReactOptions.include || [/node_modules\/(react-native|@react-native)/],
      exclude: pluginReactOptions.exclude,
      babelConfig: {
        ...pluginReactOptions.babel,
        babelrc: false,
        configFile: false,
        presets: [
          [
            // we use require instead of just the name to resolve the version of the plugin in our package.json
            require('@babel/preset-react'),
            {
              development: isDevelopment,
              jsxRuntime: pluginReactOptions.jsxRuntime || 'automatic',
              jsxImportSource: pluginReactOptions.jsxImportSource || 'react',
            },
          ],
          ...(pluginReactOptions.babel?.presets || []),
        ],
        plugins: [
          [
            // this is a fix for reanimated not working in production
            // we use require instead of just the name to resolve the version of the plugin in our package.json
            require('@babel/plugin-transform-modules-commonjs'),
            {
              strict: false,
              strictMode: false, // prevent "use strict" injections
              allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
            },
          ],
          ...(pluginReactOptions.babel?.plugins || []),
        ],
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
