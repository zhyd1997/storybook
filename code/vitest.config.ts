import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import { resolve } from 'path';

const threadCount = process.env.CI ? 8 : undefined;

export default defineConfig({
  test: {
    passWithNoTests: true,
    clearMocks: true,
    setupFiles: [resolve(__dirname, './vitest-setup.ts')],
    globals: true,
    testTimeout: 10000,
    environment: 'node',
    pool: 'threads',
    coverage: {
      exclude: [...coverageConfigDefaults.exclude, '**/dist/**', ''],
    },
    poolOptions: {
      threads: {
        minThreads: threadCount,
        maxThreads: threadCount,
      },
    },
  },
});
