import React from 'react';

import type { Meta } from '@storybook/react';

// @ts-expect-error - TS doesn't know about import.meta.glob from Vite
const allMetafiles = import.meta.glob(
  [
    '../../bench/esbuild-metafiles/**/*.json',
    // the following metafiles are too big to be loaded automatically in the iframe
    '!**/core-cjs-0.json',
    '!**/core-esm-2.json',
  ],
  {
    // eagerly loading is not ideal because it imports all metafiles upfront,
    // but it's the only way to create the argTypes from this list,
    // as otherwise it would be an async operation
    eager: true,
  }
);

const METAFILES_DIR = '../../bench/esbuild-metafiles/';
const METAFILE_DIR_PKG_NAME_MAP = {
  cli: 'storybook',
  'cli-sb': 'sb',
  'cli-storybook': '@storybook/cli',
  docs: '@storybook/addon-docs',
  'addon-test': '@storybook/experimental-addon-test',
} as const;
const TOO_BIG_METAFILES = ['@storybook/core core-cjs-0', '@storybook/core core-esm-2'];

// allows the metafile path to be used in the URL hash
const safeMetafileArg = (path: string) =>
  path.replace(METAFILES_DIR, '').replaceAll('/', '_SLASH_').replaceAll('.', '_DOT_');

export default {
  title: 'Bench',
  parameters: {
    layout: 'fullscreen',
    chromatic: { disableSnapshot: true },
  },
  argTypes: {
    metafile: {
      options: Object.keys(allMetafiles).map(safeMetafileArg).concat(TOO_BIG_METAFILES),
      mapping: Object.fromEntries(
        Object.keys(allMetafiles).map((path) => [safeMetafileArg(path), path])
      ),
      control: {
        type: 'select',
        labels: Object.fromEntries(
          Object.keys(allMetafiles)
            .concat(TOO_BIG_METAFILES)
            .map((path) => {
              if (TOO_BIG_METAFILES.includes(path)) {
                return [path, `${path} - TOO BIG PLEASE UPLOAD MANUALLY`];
              }
              // example path: ../../bench/esbuild-metafiles/actions/previewEntries-esm.json

              const pkgDir = path.split('/').at(-2)!; // 'actions'
              const basename = path.split('/').at(-1)!.split('.').at(0)!; // 'previewEntries-esm'
              const entriesMatch = path.match(/\w+Entries/); // ['previewEntries']

              let pkgName;
              if (pkgDir in METAFILE_DIR_PKG_NAME_MAP) {
                pkgName = METAFILE_DIR_PKG_NAME_MAP[pkgDir];
              } else if (entriesMatch) {
                // only addons have specific xEntries files
                pkgName = `@storybook/addon-${pkgDir}`;
              } else {
                pkgName = `@storybook/${pkgDir}`;
              }

              let extraInfo = '';

              if (pkgDir === 'core') {
                extraInfo = `- ${basename} `;
              } else if (entriesMatch) {
                extraInfo = `- ${entriesMatch[0]} `;
              }
              const moduleType = path.includes('cjs') ? 'CJS' : 'ESM';

              return [safeMetafileArg(path), `${pkgName} ${extraInfo}- ${moduleType}`];
            })
        ),
      },
    },
  },
  render: (args) => {
    if (!args.metafile) {
      return (
        <div
          style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span>
            Select a metafile in the <code>metafile</code> Control
          </span>
        </div>
      );
    }
    const metafile = allMetafiles[args.metafile];
    const encodedMetafile = btoa(JSON.stringify(metafile));

    return (
      <iframe
        // esbuild analyzer has a hidden feature to load a base64-encoded metafile from the the URL hash
        // see https://github.com/esbuild/esbuild.github.io/blob/ccf70086543a034495834b4135e15e91a3ffceb8/src/analyze/index.ts#L113-L116
        src={`https://esbuild.github.io/analyze/#${encodedMetafile}`}
        style={{ border: 'none', width: '100%', height: '100vh' }}
        key={args.metafile} // force re-render on args change
      />
    );
  },
} satisfies Meta;

export const Metafiles = {};
