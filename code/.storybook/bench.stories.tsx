import React from 'react';

import type { Meta } from '@storybook/react';

// @ts-expect-error - TS doesn't know about import.meta.glob from Vite
const allMetafiles = import.meta.glob(
  [
    '../../bench/esbuild-metafiles/**/*.json',
    // the core metafile is too big to be loaded automatically in the iframe
    '!../../bench/esbuild-metafiles/core/core.json',
  ],
  {
    // eagerly loading is not ideal because it imports all metafiles upfront,
    // but it's the only way to create the argTypes from this list,
    // as otherwise it would be an async operation
    eager: true,
  }
);

const METAFILES_DIR = '../../bench/esbuild-metafiles/';
const PACKAGES_WITHOUT_ORG = ['storybook', 'sb', 'create-storybook'];

// allows the metafile path to be used in the URL hash
const safeMetafileArg = (path: string) =>
  path
    .replace(METAFILES_DIR, '')
    .replaceAll('/', '__')
    .replace(/(\w*).json/, '$1');

export default {
  title: 'Bench',
  parameters: {
    layout: 'fullscreen',
    chromatic: { disableSnapshot: true },
  },
  argTypes: {
    metafile: {
      options: Object.keys(allMetafiles).concat('core - core').map(safeMetafileArg).sort(),
      mapping: Object.fromEntries(
        Object.keys(allMetafiles).map((path) => [safeMetafileArg(path), path])
      ),
      control: {
        type: 'select',
        labels: Object.fromEntries(
          Object.keys(allMetafiles)
            .map((path) => {
              const [, dirName, subEntry] = /esbuild-metafiles\/(.+)\/(.+).json/.exec(path)!;
              const pkgName = PACKAGES_WITHOUT_ORG.includes(dirName)
                ? dirName
                : `@storybook/${dirName}`;

              return [
                safeMetafileArg(path),
                subEntry !== 'metafile' ? `${pkgName} - ${subEntry}` : pkgName,
              ];
            })
            .concat([['core - core', '@storybook/core - core - TOO BIG PLEASE UPLOAD MANUALLY']])
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

export const ESBuildAnalyzer = {
  name: 'ESBuild Metafiles',
};
