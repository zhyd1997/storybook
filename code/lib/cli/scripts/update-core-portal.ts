import { join } from 'node:path';
import { sortPackageJson } from '../../../../scripts/node_modules/sort-package-json';

import { readJSON, writeFile, ensureFile } from 'fs-extra';
import dedent from 'ts-dedent';

const write = async (location: string, data: string) => {
  await ensureFile(location);
  return writeFile(location, data);
};

const mapCoreExportToSelf = (map: Record<string, string>) => {
  return Object.entries(map).reduce<Record<string, string>>((acc, [key, input]) => {
    const value = input.replace('.js', '.mjs').replace('./dist/', './core/').replace('.cjs', '.js');
    acc[key] = value;

    return acc;
  }, {});
};

const generateMapperContent = (input: string) => {
  const value = input
    .replace('./core/', '')
    .replace('/index', '')
    .replace('.cjs', '')
    .replace('.d.ts', '')
    .replace('.mjs', '')
    .replace('.js', '');
  if (input.endsWith('.mjs')) {
    return `export * from '@storybook/core/${value}';\n`;
  }
  if (input.endsWith('.js')) {
    return `module.exports = require('@storybook/core/${value}');\n`;
  }
  if (input.endsWith('.d.ts')) {
    return dedent`
      export * from '@storybook/core/${value}';
      export type * from '@storybook/core/${value}';\n
    `;
  }
  // eslint-disable-next-line local-rules/no-uncategorized-errors
  throw new Error(`Unexpected input: ${input}`);
};

async function run() {
  const selfPackageJson = await readJSON(join(__dirname, '../package.json'));
  const corePackageJson = await readJSON(join(__dirname, '../../../core/package.json'));

  await Promise.all(
    Object.entries<Record<string, string>>(corePackageJson.exports).map(async ([key, input]) => {
      const value = mapCoreExportToSelf(input);
      if (key === './package.json') {
        return;
      }
      if (key.startsWith('./dist')) {
        return;
      }
      if (key === '.') {
        selfPackageJson.exports['./core'] = value;

        await Promise.all(
          Object.values(value).map(async (v) => {
            return write(join(__dirname, '..', v), generateMapperContent(v));
          })
        );
      } else {
        selfPackageJson.exports[key] = value;
        await Promise.all(
          Object.values(value).map(async (v) => {
            return write(join(__dirname, '..', v), generateMapperContent(v));
          })
        );
      }
    })
  );

  selfPackageJson.typesVersions = {
    '*': {
      ...Object.entries(corePackageJson.typesVersions['*']).reduce<Record<string, string[]>>(
        (acc, [key, value]) => {
          acc[key] = value.map((v) => v.replace('./dist/', './core/'));
          return acc;
        },
        {}
      ),
      '*': ['./dist/index.d.ts'],
      'core-path': ['./dist/core-path.d.ts'],

      core: ['./core/index.d.ts'],
    },
  };

  await write(
    join(__dirname, '../package.json'),
    JSON.stringify(sortPackageJson(selfPackageJson), null, 2)
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
