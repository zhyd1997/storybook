import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import * as path from 'node:path';

import {
  JsPackageManagerFactory,
  extractProperFrameworkName,
  loadAllPresets,
  loadMainConfig,
  validateFrameworkName,
} from 'storybook/internal/common';
import { colors, logger } from 'storybook/internal/node-logger';

import { findUp } from 'find-up';
import { satisfies } from 'semver';
import c from 'tinyrainbow';
import dedent from 'ts-dedent';

import { type PostinstallOptions } from '../../../lib/cli-storybook/src/add';
import { printError, printInfo, printSuccess, step } from './postinstall-logger';

const addonName = '@storybook/experimental-addon-vitest';
const dependencies = ['vitest', '@vitest/browser', 'playwright'];
const optionalDependencies = ['@vitest/coverage-istanbul', '@vitest/coverage-v8'];
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.cts', '.mts', '.cjs', '.mjs'];

const findFile = async (basename: string) => findUp(extensions.map((ext) => basename + ext));

export default async function postInstall(options: PostinstallOptions) {
  printSuccess(
    '👋 Howdy!',
    dedent`
      I'm the installation helper for ${colors.pink.bold(addonName)}

      Hold on for a moment while I look at your project and get you all set up...
    `
  );

  const packageManager = JsPackageManagerFactory.getPackageManager({
    force: options.packageManager,
  });

  const info = await getFrameworkInfo(options);

  const annotationsImport = [
    '@storybook/nextjs',
    '@storybook/experimental-nextjs-vite',
    '@storybook/sveltekit',
  ].includes(info.frameworkPackageName)
    ? info.frameworkPackageName
    : info.rendererPackageName &&
        ['@storybook/react', '@storybook/svelte', '@storybook/vue3'].includes(
          info.rendererPackageName
        )
      ? info.rendererPackageName
      : null;

  const prerequisiteCheck = async () => {
    const reasons = [];

    if (
      info.frameworkPackageName !== '@storybook/nextjs' &&
      info.builderPackageName !== '@storybook/builder-vite'
    ) {
      reasons.push(
        'The Vitest addon can only be used with a Vite-based Storybook framework or Next.js.'
      );
    }

    if (!annotationsImport) {
      reasons.push(dedent`
        The Vitest addon cannot yet be used with ${colors.pink.bold(info.frameworkPackageName)}
      `);
    }

    const vitestVersion = await packageManager.getInstalledVersion('vitest');
    if (vitestVersion && !satisfies(vitestVersion, '>=2.0.0')) {
      reasons.push(`
        The Vitest addon requires Vitest 2.0.0 or later.
        Please update your ${colors.pink.bold('vitest')} dependency and try again.
      `);
    } else {
      const depRanges = await packageManager.getAllDependencies();
      const checkDependencies = [...dependencies, ...optionalDependencies];
      const latestVersions = await packageManager.getVersions(...checkDependencies);
      const latestPackages = checkDependencies.map(
        (pkg, index) => [pkg, latestVersions[index].replace('^', '')] as const
      );

      let hasInconsistentPackageVersions = false;
      for (const [pkg, latestVersion] of latestPackages) {
        if (depRanges[pkg]) {
          if (!dependencies.includes(pkg)) {
            // Add found optional dependency so it will be updated to the latest version
            dependencies.push(pkg);
          }

          if (!satisfies(latestVersion, depRanges[pkg])) {
            hasInconsistentPackageVersions = true;
            reasons.push(dedent`
              The package ${colors.pink.bold(pkg)} is already installed and cannot be updated to ${colors.pink.bold(latestVersion)} because it would not satisfy "${colors.pink.bold(depRanges[pkg])}".
            `);
          }
        }
      }

      if (hasInconsistentPackageVersions) {
        reasons.push(
          'Update your dependencies and try again, or manually install the Vitest addon.'
        );
      }
    }

    if (info.frameworkPackageName === '@storybook/nextjs') {
      const nextVersion = await packageManager.getInstalledVersion('next');
      if (!nextVersion) {
        reasons.push(dedent`
          It seems like you are using ${colors.pink.bold('@storybook/nextjs')} without having ${colors.pink.bold('next')} installed.
          Please install "next" or use a different Storybook framework integration and try again.
        `);
      }
    }

    if (reasons.length > 0) {
      reasons.unshift(
        'The Test addon is incompatible with your current set up and cannot be installed:'
      );
      reasons.push(
        dedent`
          To roll back the installation, remove ${colors.pink.bold(addonName)} from the "addons" array
          in your main Storybook config file and remove the dependency from your package.json file.
        `
      );
      reasons.push(
        dedent`
          Please check the documentation for more information about its requirements and installation:
          ${c.cyan`https://storybook.js.org/docs/writing-tests/test-runner-with-vitest`}
        `
      );
      return reasons.map((r) => r.trim()).join('\n\n');
    }

    return null;
  };

  const result = await prerequisiteCheck();

  if (result) {
    printError('⛔️ Sorry!', result);
    logger.line(1);
    return;
  }

  const vitestInfo = getVitestPluginInfo(info.frameworkPackageName);

  if (info.frameworkPackageName === '@storybook/nextjs') {
    printInfo(
      '🍿 Just so you know...',
      dedent`
        It looks like you're using Next.js.

        I'll add ${colors.pink.bold(`@storybook/experimental-nextjs-vite/vite-plugin`)} so you can use it with Vitest.
      `
    );
    try {
      const storybookVersion = await packageManager.getInstalledVersion('storybook');
      dependencies.push(`@storybook/experimental-nextjs-vite@^${storybookVersion}`);
    } catch (e) {
      console.error(
        'Failed to install @storybook/experimental-nextjs-vite. Please install it manually'
      );
    }
  }

  logger.line(1);
  logger.plain(`${step} Installing dependencies:`);
  logger.plain(colors.gray('  ' + dependencies.join(', ')));

  await packageManager.addDependencies(
    { installAsDevDependencies: true },
    dependencies.map((p) => `${p}@latest`)
  );

  logger.line(1);
  logger.plain(`${step} Configuring Playwright with Chromium:`);
  logger.plain(colors.gray('  npx playwright install chromium --with-deps'));

  await packageManager.executeCommand({
    command: 'npx',
    args: ['playwright', 'install', 'chromium', '--with-deps'],
  });

  const vitestSetupFile = join(options.configDir, 'vitest.setup.ts');
  if (existsSync(vitestSetupFile)) {
    printError(
      '🚨 Oh no!',
      dedent`
        Found an existing Vitest setup file:
        ${colors.gray(vitestSetupFile)}

        Please refer to the documentation to complete the setup manually:
        ${c.cyan`https://storybook.js.org/docs/writing-tests/test-runner-with-vitest#manual`}
      `
    );
    logger.line(1);
    return;
  }

  logger.line(1);
  logger.plain(`${step} Creating a Vitest setup file for Storybook:`);
  logger.plain(colors.gray(`  ${vitestSetupFile}`));

  const previewExists = extensions
    .map((ext) => path.resolve(options.configDir, `preview${ext}`))
    .some((config) => existsSync(config));

  await writeFile(
    vitestSetupFile,
    dedent`
      import { beforeAll } from 'vitest'
      import { setProjectAnnotations } from '${annotationsImport}'
      ${previewExists ? `import * as projectAnnotations from './preview'` : ''}

      // More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
      const project = setProjectAnnotations(${previewExists ? 'projectAnnotations' : '[]'})

      beforeAll(project.beforeAll)
    `
  );

  // Check for existing Vitest workspace. We can't extend it so manual setup is required.
  const vitestWorkspaceFile = await findFile('vitest.workspace');
  if (vitestWorkspaceFile) {
    printError(
      '🚨 Oh no!',
      dedent`
        Found an existing Vitest workspace file:
        ${colors.gray(vitestWorkspaceFile)}

        I cannot safely extend your existing workspace file automatically.

        Please refer to the documentation to complete the setup manually:
        ${c.cyan`https://storybook.js.org/docs/writing-tests/test-runner-with-vitest#manual`}
      `
    );
    logger.line(1);
    return;
  }

  // Check for an existing config file. Can be from Vitest (preferred) or Vite (with `test` option).
  const viteConfigFile = await findFile('vite.config');
  if (viteConfigFile) {
    const viteConfig = await fs.readFile(viteConfigFile, 'utf8');
    if (viteConfig.match(/\Wtest:\s*{/)) {
      printError(
        '🚨 Oh no!',
        dedent`
          You seem to have an existing test configuration in your Vite config file:
          ${colors.gray(vitestWorkspaceFile)}

          I cannot safely extend your test configuration automatically.

          Please refer to the documentation to complete the setup manually:
          ${c.cyan`https://storybook.js.org/docs/writing-tests/test-runner-with-vitest#manual`}
        `
      );
      logger.line(1);
      return;
    }
  }

  const vitestConfigFile = await findFile('vitest.config');
  const rootConfig = vitestConfigFile || viteConfigFile;

  if (rootConfig) {
    // If there's an existing config, we create a workspace file so we can run Storybook tests alongside.
    const extname = path.extname(rootConfig);
    const browserWorkspaceFile = path.resolve(dirname(rootConfig), `vitest.workspace${extname}`);

    logger.line(1);
    logger.plain(`${step} Creating a Vitest project workspace file:`);
    logger.plain(colors.gray(`  ${browserWorkspaceFile}`));

    await writeFile(
      browserWorkspaceFile,
      dedent`
        import { defineWorkspace } from 'vitest/config';
        import { storybookTest } from '@storybook/experimental-addon-test/vite-plugin';
        ${vitestInfo.frameworkPluginImport ? vitestInfo.frameworkPluginImport + '\n' : ''}

        // More info at: https://storybook.js.org/docs/writing-tests/test-runner-with-vitest
        export default defineWorkspace([
          '${relative(dirname(browserWorkspaceFile), rootConfig)}',
          {
            extends: '${viteConfigFile ? relative(dirname(browserWorkspaceFile), viteConfigFile) : ''}',
            plugins: [
              storybookTest(),${vitestInfo.frameworkPluginCall ? '\n      ' + vitestInfo.frameworkPluginDocs + vitestInfo.frameworkPluginCall : ''}
            ],
            test: {
              name: 'storybook',
              browser: {
                enabled: true,
                headless: true,
                name: 'chromium',
                provider: 'playwright',
              },
              include: ['**/*.stories.?(m)[jt]s?(x)'],
              setupFiles: ['./.storybook/vitest.setup.ts'],
            },
          },
        ]);
      `.replace(/\s+extends: '',/, '')
    );
  } else {
    // If there's no existing Vitest/Vite config, we create a new Vitest config file.
    logger.line(1);
    logger.plain(`${step} Creating a Vitest project config file:`);
    logger.plain(colors.gray(`  vitest.config.ts`));

    await writeFile(
      'vitest.config.ts',
      dedent`
        import { defineConfig } from "vitest/config";
        import { storybookTest } from "@storybook/experimental-addon-test/vite-plugin";
        ${vitestInfo.frameworkPluginImport ? vitestInfo.frameworkPluginImport + '\n' : ''}

        // More info at: https://storybook.js.org/docs/writing-tests/test-runner-with-vitest
        export default defineConfig({
          plugins: [
            storybookTest(),${vitestInfo.frameworkPluginCall ? '\n      ' + vitestInfo.frameworkPluginDocs + vitestInfo.frameworkPluginCall : ''}
          ],
          test: {
            browser: {
              enabled: true,
              headless: true,
              name: 'chromium',
              provider: 'playwright',
            },
            include: ['**/*.stories.?(m)[jt]s?(x)'],
            setupFiles: ['./.storybook/vitest.setup.ts'],
          },
        });
      `
    );
  }

  printSuccess(
    '🎉 All done!',
    dedent`
      The Test addon is now configured and you're ready to run your tests!

      Check the documentation for more information about its features and options at:
      ${c.cyan`https://storybook.js.org/docs/writing-tests/test-runner-with-vitest`}
    `
  );
  logger.line(1);
}

const getVitestPluginInfo = (framework: string) => {
  let frameworkPluginImport = '';
  let frameworkPluginCall = '';
  let frameworkPluginDocs = '';

  if (framework === '@storybook/nextjs') {
    frameworkPluginImport =
      "import { storybookNextJsPlugin } from '@storybook/experimental-nextjs-vite/vite-plugin'";
    frameworkPluginCall = 'storybookNextJsPlugin()';
    frameworkPluginDocs =
      '// More info at: https://github.com/storybookjs/vite-plugin-storybook-nextjs\n      ';
  }

  if (framework === '@storybook/sveltekit') {
    frameworkPluginImport =
      "import { storybookSveltekitPlugin } from '@storybook/sveltekit/vite-plugin'";
    frameworkPluginCall = 'storybookSveltekitPlugin()';
  }

  if (framework === '@storybook/vue3-vite') {
    frameworkPluginImport = "import { storybookVuePlugin } from '@storybook/vue3-vite/vite-plugin'";
    frameworkPluginCall = 'storybookVuePlugin()';
  }

  return { frameworkPluginImport, frameworkPluginCall, frameworkPluginDocs };
};

async function getFrameworkInfo({ configDir, packageManager: pkgMgr }: PostinstallOptions) {
  const packageManager = JsPackageManagerFactory.getPackageManager({ force: pkgMgr });
  const packageJson = await packageManager.retrievePackageJson();

  const config = await loadMainConfig({ configDir, noCache: true });
  const { framework } = config;

  const frameworkName = typeof framework === 'string' ? framework : framework?.name;
  validateFrameworkName(frameworkName);
  const frameworkPackageName = extractProperFrameworkName(frameworkName);

  const presets = await loadAllPresets({
    corePresets: [join(frameworkName, 'preset')],
    overridePresets: [
      require.resolve('@storybook/core/core-server/presets/common-override-preset'),
    ],
    configDir,
    packageJson,
    isCritical: true,
  });

  const core = await presets.apply('core', {});

  const { builder, renderer } = core;

  if (!builder) {
    throw new Error('Could not detect your Storybook builder.');
  }

  const builderPackageJson = await fs.readFile(
    `${typeof builder === 'string' ? builder : builder.name}/package.json`,
    'utf8'
  );
  const builderPackageName = JSON.parse(builderPackageJson).name;

  let rendererPackageName: string | undefined;
  if (renderer) {
    const rendererPackageJson = await fs.readFile(`${renderer}/package.json`, 'utf8');
    rendererPackageName = JSON.parse(rendererPackageJson).name;
  }

  return {
    frameworkPackageName,
    builderPackageName,
    rendererPackageName,
  };
}
