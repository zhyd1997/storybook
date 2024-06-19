/* eslint-disable local-rules/no-uncategorized-errors */

import { watch } from 'node:fs';
import { rmdir } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import {
  esbuild,
  process,
  merge,
  measure,
  chalk,
  prettyTime,
  nodeInternals,
  dedent,
  sortPackageJson,
  limit,
  Bun,
  globalExternals,
} from '../../../scripts/prepare/tools';
import { getBundles, getEntries, getFinals } from './entries';

import { globalsModuleInfoMap } from '../src/manager/globals-module-info';

import pkg from '../package.json';
import { generateSourceFiles } from './helpers/sourcefiles';

const flags = process.argv.slice(2);
const cwd = process.cwd();

const isOptimized = flags.includes('--optimized');
const isWatch = flags.includes('--watch');
const isReset = flags.includes('--reset');

const external = [
  ...new Set([
    ...Object.keys(pkg.dependencies),
    ...Object.keys((pkg as any).peerDependencies || {}),
  ]),
];

if (isOptimized && isWatch) {
  throw new Error('Cannot watch and optimize at the same time');
}

if (isReset) {
  await rmdir(join(cwd, 'dist'), { recursive: true });
}

const entries = getEntries(cwd);
const bundles = getBundles(cwd);
const finals = getFinals(cwd);

type EsbuildContextOptions = Parameters<(typeof esbuild)['context']>[0];

const esbuildDefaultOptions = {
  absWorkingDir: cwd,
  bundle: true,
  outdir: 'dist',
  allowOverwrite: false,
  minifyIdentifiers: isOptimized,
  minifySyntax: isOptimized,
  minifyWhitespace: false,
  treeShaking: true,
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  lineLimit: 140,
  external: ['@storybook/core', ...external],
  metafile: true,
  sourcemap: false,
  legalComments: 'none',
  keepNames: true,
} satisfies EsbuildContextOptions;

console.log(isWatch ? 'Watching...' : 'Bundling...');

const files = measure(generateSourceFiles);
const packageJson = measure(generatePackageJsonFile);
const dist = files.then(() => measure(generateDistFiles));
const types = measure(() => generateTypesMapperFiles().then(() => generateTypesFiles()));

const [filesTime, packageJsonTime, distTime, typesTime] = await Promise.all([
  files,
  packageJson,
  dist,
  types,
]);

await modifyThemeTypes();

console.log('Files generated in', chalk.yellow(prettyTime(filesTime)));
console.log('Package.json generated in', chalk.yellow(prettyTime(packageJsonTime)));
console.log(isWatch ? 'Watcher started in' : 'Bundled in', chalk.yellow(prettyTime(distTime)));
console.log(
  isOptimized ? 'Generated types in' : 'Generated type mappers in',
  chalk.yellow(prettyTime(typesTime))
);

async function generateTypesMapperContent(filePath: string) {
  const upwards = relative(join(filePath, '..'), cwd);
  const downwards = relative(cwd, filePath);

  return dedent`
    // auto generated file from ${import.meta.filename}, do not edit
    export * from '${join(upwards, downwards)}';
    export type * from '${join(upwards, downwards)}';
  `;
}

function noExternals(entry: ReturnType<typeof getEntries>[0]): boolean {
  return entry.externals.length === 0 && entry.internals.length === 0;
}
function isNode(entry: ReturnType<typeof getEntries>[0]): boolean {
  return !!entry.node;
}
function isBrowser(entry: ReturnType<typeof getEntries>[0]): boolean {
  return !!entry.browser;
}

async function generateDistFiles() {
  const compile = await Promise.all([
    esbuild.context(
      merge<EsbuildContextOptions>(esbuildDefaultOptions, {
        format: 'cjs',
        target: 'node18',
        entryPoints: entries
          .filter(isNode)
          .filter(noExternals)
          .map((e) => e.file),
        platform: 'neutral',
        mainFields: ['main', 'module', 'node'],
        outExtension: { '.js': '.cjs' },
        conditions: ['node', 'module', 'import', 'require'],
        external: [...nodeInternals, ...esbuildDefaultOptions.external],
      })
    ),
    esbuild.context(
      merge<EsbuildContextOptions>(esbuildDefaultOptions, {
        format: 'esm',
        target: ['chrome100', 'safari15', 'firefox91'],
        splitting: false,
        entryPoints: entries
          .filter(isBrowser)
          .filter(noExternals)
          .map((entry) => entry.file),
        platform: 'browser',
        alias: {
          process: require.resolve('process/browser.js'),
          assert: require.resolve('browser-assert'),
          util: require.resolve('util/util.js'),
        },
        conditions: ['browser', 'module', 'import', 'default'],
        outExtension: { '.js': '.js' },
      })
    ),
    esbuild.context(
      merge<EsbuildContextOptions>(esbuildDefaultOptions, {
        format: 'esm',
        target: 'node18',
        splitting: false,
        entryPoints: entries
          .filter(isNode)
          .filter(noExternals)
          .filter((i) => !isBrowser(i))
          .map((entry) => entry.file),
        platform: 'neutral',
        mainFields: ['main', 'module', 'node'],
        outExtension: { '.js': '.js' },
        conditions: ['node', 'module', 'import', 'require'],
        banner: {
          js: dedent`
            import Module from "node:module";
            const require = Module.createRequire(import.meta.url);
            const __dirname = require('path').dirname(new URL(import.meta.url).pathname);
          `,
        },
        external: [...nodeInternals, ...esbuildDefaultOptions.external],
      })
    ),
    ...bundles.flatMap((entry) => {
      const results = [];
      results.push(
        esbuild.context(
          merge<EsbuildContextOptions>(esbuildDefaultOptions, {
            format: 'esm',
            target: 'chrome100',
            splitting: false,
            outdir: dirname(entry.file).replace('src', 'dist'),
            entryPoints: [entry.file],
            conditions: ['browser', 'module', 'import', 'default'],
            outExtension: { '.js': '.js' },
            alias: {
              process: require.resolve('process/browser.js'),
              assert: require.resolve('browser-assert'),
              util: require.resolve('util/util.js'),
              '@storybook/core': join(cwd, 'src'),
              '@storybook/core/dist': join(cwd, 'src'),
              react: dirname(require.resolve('react/package.json')),
              'react-dom': dirname(require.resolve('react-dom/package.json')),
            },
            external: [],
          })
        )
      );

      return results;
    }),
    ...finals.flatMap((entry) => {
      const results = [];
      results.push(
        esbuild.context(
          merge<EsbuildContextOptions>(esbuildDefaultOptions, {
            format: 'esm',
            target: 'chrome100',
            splitting: false,
            outdir: dirname(entry.file).replace('src', 'dist'),
            entryPoints: [entry.file],
            conditions: ['browser', 'module', 'import', 'default'],
            outExtension: { '.js': '.js' },
            define: {
              'process.env.NODE_ENV': JSON.stringify('production'),
            },
            plugins: [globalExternals(globalsModuleInfoMap)],
            alias: {
              '@storybook/core/dist': join(cwd, 'src'),
              '@storybook/core': join(cwd, 'src'),
              react: dirname(require.resolve('react/package.json')),
              'react-dom/client': join(
                dirname(require.resolve('react-dom/package.json')),
                'client'
              ),
              'react-dom': dirname(require.resolve('react-dom/package.json')),
            },
            external: [],
          })
        )
      );

      return results;
    }),
    ...entries
      .filter((entry) => !noExternals(entry))
      .flatMap((entry) => {
        const results = [];
        if (entry.node) {
          results.push(
            esbuild.context(
              merge<EsbuildContextOptions>(esbuildDefaultOptions, {
                format: 'cjs',
                outdir: dirname(entry.file).replace('src', 'dist'),
                target: 'node18',
                platform: 'neutral',
                mainFields: ['main', 'module', 'node'],
                entryPoints: [entry.file],
                outExtension: { '.js': '.cjs' },
                conditions: ['node', 'module', 'import', 'require'],
                external: [
                  ...nodeInternals,
                  ...esbuildDefaultOptions.external,
                  ...entry.externals,
                ].filter((e) => !entry.internals.includes(e)),
              })
            )
          );
        }
        if (entry.browser) {
          results.push(
            esbuild.context(
              merge<EsbuildContextOptions>(esbuildDefaultOptions, {
                format: 'esm',
                target: 'chrome100',
                splitting: true,
                outdir: dirname(entry.file).replace('src', 'dist'),
                entryPoints: [entry.file],
                conditions: ['browser', 'module', 'import', 'default'],
                outExtension: { '.js': '.js' },
                external: [
                  ...nodeInternals,
                  ...esbuildDefaultOptions.external,
                  ...entry.externals,
                ].filter((e) => !entry.internals.includes(e)),
              })
            )
          );
        } else if (entry.node) {
          results.push(
            esbuild.context(
              merge<EsbuildContextOptions>(esbuildDefaultOptions, {
                format: 'esm',
                outdir: dirname(entry.file).replace('src', 'dist'),
                target: 'node18',
                platform: 'neutral',
                mainFields: ['main', 'module', 'node'],
                entryPoints: [entry.file],
                outExtension: { '.js': '.js' },
                conditions: ['node', 'module', 'import', 'require'],
                external: [
                  ...nodeInternals,
                  ...esbuildDefaultOptions.external,
                  ...entry.externals,
                ].filter((e) => !entry.internals.includes(e)),
              })
            )
          );
        }

        return results;
      }),
  ]);

  if (isWatch) {
    await Promise.all(
      compile.map(async (context) => {
        await context.watch();
      })
    );

    // show a log message when a file is compiled
    watch(join(cwd, 'dist'), { recursive: true }, (event, filename) => {
      console.log(`compiled ${chalk.cyan(filename)}`);
    });
  } else {
    await Promise.all(
      compile.map(async (context) => {
        const out = await context.rebuild();
        await context.dispose();

        // if (out.metafile) {
        //   await Bun.write('report/meta.json', JSON.stringify(out.metafile, null, 2));
        //   await Bun.write(
        //     'report/meta.txt',
        //     await esbuild.analyzeMetafile(out.metafile, { color: false, verbose: false })
        //   );
        //   console.log(await esbuild.analyzeMetafile(out.metafile, { color: true }));
        // }
      })
    );
  }
}

async function generateTypesFiles() {
  // we ALWAYS generate these mapper files, even compiling type-definitions later (isOptimized).
  // because we can do this really fast, and it means we can generate the type definitions in parallel.
  // normally this would not be possible, because there's there are interdependencies between the files.
  const all = entries.filter((e) => e.dts).map((e) => e.file);

  if (isOptimized) {
    // Spawn each entry in it's own separate process, because they are slow & synchronous
    // ...this way we do not bog down the main process/esbuild and can run them in parallel
    // we limit the number of concurrent processes to 5, because otherwise we run out of memory
    // I've had a few occasions where a entry that would normally be fast (node-logger) where the process would close without it being done
    // TODO: figure out if this is a bug in bun or in the script, or how to ensure the script actually fails in that case
    // TODO: figure out what the best number is, this is likely to be different on different machines (CI)
    const limited = limit(3);
    let processes: ReturnType<(typeof Bun)['spawn']>[] = [];
    await Promise.all(
      all.map(async (fileName, index) => {
        return limited(async () => {
          const getDtsProcess = () =>
            Bun.spawn(['bun', './scripts/dts.ts', index.toString()], {
              cwd,
              stdio: ['ignore', 'pipe', 'inherit'],
            });
          let timer: ReturnType<typeof setTimeout> | undefined;
          let dtsProcess = getDtsProcess();
          processes.push(dtsProcess);
          await Promise.race([
            dtsProcess.exited.catch(async () => {
              await dtsProcess.kill();
              dtsProcess = getDtsProcess();
              return dtsProcess.exited;
            }),
            new Promise((_, reject) => {
              timer = setTimeout(() => {
                console.log(index, fileName);

                reject(new Error('timed out'));
              }, 60000);
            }),
          ]);
          if (timer) {
            clearTimeout(timer);
          }
          if (dtsProcess.exitCode !== 0) {
            processes.forEach((p) => p.kill());
            processes = [];
            console.log(index, fileName);
            process.exit(dtsProcess.exitCode || 1);
          } else {
            console.log('Generated types for', chalk.cyan(relative(cwd, all[index])));
          }
        });
      })
    );
  }
}

async function generateTypesMapperFiles() {
  const all = entries.filter((e) => e.dts).map((e) => e.file);

  await Promise.all(
    all.map(async (filePath) =>
      Bun.write(
        filePath.replace('src', 'dist').replace(/\.tsx?/, '.d.ts'),
        await generateTypesMapperContent(filePath)
      )
    )
  );
}

async function generatePackageJsonFile() {
  const location = join(cwd, 'package.json');
  const pkgJson = await Bun.file(location).json();
  pkgJson.exports = entries.reduce<Record<string, Record<string, string>>>((acc, entry) => {
    let main = './' + relative(cwd, entry.file).replace('src', 'dist');

    const content: Record<string, string> = {};
    if (entry.dts) {
      content.types = main.replace(/\.tsx?/, '.d.ts');
    }
    if (entry.browser) {
      content.import = main.replace(/\.tsx?/, '.js');
    }
    if (entry.node && !entry.browser) {
      content.import = main.replace(/\.tsx?/, '.js');
    }
    if (entry.node) {
      content.require = main.replace(/\.tsx?/, '.cjs');
    }
    if (main === './dist/index.ts' || main === './dist/index.tsx') {
      main = '.';
    }
    acc[
      main
        .replace(/\/index\.tsx?/, '')
        .replace(/\.tsx?/, '')
        .replace('dist/', '')
    ] = content;
    acc[main.replace(/\/index\.tsx?/, '').replace(/\.tsx?/, '')] = content;
    return acc;
  }, {});

  pkgJson.exports['./package.json'] = './package.json';

  pkgJson.typesVersions = {
    '*': {
      '*': ['./dist/index.d.ts'],
      ...entries.reduce<Record<string, string[]>>((acc, entry) => {
        let main = relative(cwd, entry.file).replace('src', 'dist');
        if (main === './dist/index.ts' || main === './dist/index.tsx') {
          main = '.';
        }
        const key = main.replace(/\/index\.tsx?/, '').replace(/\.tsx?/, '');

        if (key === 'dist') {
          return acc;
        }

        const content = ['./' + main.replace(/\.tsx?/, '.d.ts')];
        acc[key.replace('dist/', '')] = content;
        acc[key] = content;
        return acc;
      }, {}),
    },
  };

  await Bun.write(location, `${sortPackageJson(JSON.stringify(pkgJson, null, 2))}\n`, {});
}

async function modifyThemeTypes() {
  const target = join(import.meta.dirname, '..', 'dist', 'theming', 'index.d.ts');
  const contents = await Bun.file(target).text();

  const footer = contents.includes('// auto generated file')
    ? `export { StorybookTheme as Theme } from '../src/index';`
    : dedent`
        interface Theme extends StorybookTheme {}
        export type { Theme };
      `;

  const newContents = dedent`
    ${contents}
    ${footer}
  `;

  await Bun.write(target, newContents);
}
