import { defaultExclude, defineProject, mergeConfig } from 'vitest/config';

import Inspect from 'vite-plugin-inspect';

import { vitestCommonConfig } from '../vitest.workspace';

const extraPlugins: any[] = [];
if (process.env.INSPECT === 'true') {
  // this plugin assists in inspecting the Storybook Vitest plugin's transformation and sourcemaps
  extraPlugins.push(
    Inspect({
      outputDir: '../.vite-inspect',
      build: true,
      open: true,
      include: ['**/*.stories.*'],
    })
  );
}

export default mergeConfig(
  vitestCommonConfig,
  defineProject({
    plugins: [
      import('@storybook/experimental-addon-test/vitest-plugin').then(({ storybookTest }) =>
        storybookTest({
          configDir: process.cwd(),
        })
      ),
      ...extraPlugins,
    ],
    test: {
      name: 'storybook-ui',
      include: [
        // TODO: Can be reverted. Temporarily I am adding all stories so that I can trigger tests for all stories in the UI.
        '../{core,addons,lib}/**/{src,components,template}/**/*.{story,stories}.?(c|m)[jt]s?(x)',
      ],
      exclude: [
        ...defaultExclude,
        '../node_modules/**',
        '**/__mockdata__/**',
        // expected to fail in Vitest because of fetching /iframe.html to cause ECONNREFUSED
        '**/Zoom.stories.tsx',
      ],
      browser: {
        enabled: true,
        name: 'chromium',
        provider: 'playwright',
        headless: true,
        screenshotFailures: false,
      },
      setupFiles: ['./storybook.setup.ts'],
      environment: 'happy-dom',
    },
  })
);
