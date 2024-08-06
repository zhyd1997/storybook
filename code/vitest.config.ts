import { coverageConfigDefaults, defineConfig } from 'vitest/config';
const threadCount = process.env.CI ? 8 : undefined;

export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: threadCount,
        maxThreads: threadCount,
      },
    },
    coverage: {
      all: false,
      exclude: [...coverageConfigDefaults.exclude, '**/dist/**', ''],
    },
  },
});
