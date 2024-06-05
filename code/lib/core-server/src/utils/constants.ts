import { dirname, join } from 'path';

export const DEBOUNCE = 100;

export const defaultStaticDirs = [
  {
    from: join(dirname(require.resolve('@storybook/core/package.json')), 'assets', 'browser'),
    to: '/sb-common-assets',
  },
];
