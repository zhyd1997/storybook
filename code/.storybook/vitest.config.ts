import { defineConfig, mergeConfig, defaultExclude } from 'vitest/config';
import { vitestCommonConfig } from '../vitest.workspace';

export default mergeConfig(
  vitestCommonConfig,
  defineConfig({
    plugins: [
      import('@storybook/experimental-vitest-plugin').then(({ storybookTest }) =>
        storybookTest({
          renderer: 'react',
        })
      ),
    ],
    test: {
      name: 'storybook-ui',
      include: [
        './core/**/*.{story,stories}.?(c|m)[jt]s?(x)',
        './addons/**/*.{story,stories}.?(c|m)[jt]s?(x)',
      ],
      exclude: [
        ...defaultExclude, 
        '../node_modules/**',
        '../**/__mockdata__/**'
      ],
      browser: {
        enabled: false,
        name: 'chromium',
        provider: 'playwright',
        headless: true,
      },
      setupFiles: ['.storybook/storybook.setup.ts'],
      environment: 'happy-dom',
      reporters: ['default', 'junit'],
      outputFile: {
        junit: './vitest-report.xml',
      },
    },
  })
);
