import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import * as path from 'node:path';

import {
  JsPackageManagerFactory,
  extractProperFrameworkName,
  loadAllPresets,
  loadMainConfig,
} from 'storybook/internal/common';
import { logger } from 'storybook/internal/node-logger';

import { findUp } from 'find-up';
import c from 'tinyrainbow';
import dedent from 'ts-dedent';

import { type PostinstallOptions } from '../../../lib/cli-storybook/src/add';

export default async function postInstall(options: PostinstallOptions) {
  const packageManager = JsPackageManagerFactory.getPackageManager({
    force: options.packageManager,
  });

  const info = await getFrameworkInfo(options);

  if (
    info.frameworkPackageName !== '@storybook/nextjs' &&
    info.builderPackageName !== '@storybook/builder-vite'
  ) {
    logger.info('The vitest addon can only be used with a vite framework or nextjs.');
    return;
  }

  const annotationsImport = [
    '@storybook/nextjs',
    '@storybook/experimental-nextjs-vite',
    '@storybook/sveltekit',
  ].includes(info.frameworkPackageName)
    ? info.frameworkPackageName
    : ['@storybook/react', '@storybook/svelte', '@storybook/vue3'].includes(
          info.rendererPackageName
        )
      ? info.rendererPackageName
      : null;

  if (!annotationsImport) {
    logger.info('The vitest addon cannot yet be used with: ' + info.frameworkPackageName);
    return;
  }

  const vitestInfo = getVitestPluginInfo(info.frameworkPackageName);

  const packages = ['vitest@latest', '@vitest/browser@latest', 'playwright@latest'];
  logger.info(c.bold('Installing packages...'));
  logger.info(packages.join(', '));
  await packageManager.addDependencies({ installAsDevDependencies: true }, packages);

  logger.info(c.bold('Executing npx playwright install chromium --with-deps ...'));
  await packageManager.executeCommand({
    command: 'npx',
    args: ['playwright', 'install', 'chromium', '--with-deps'],
  });

  logger.info(c.bold('Writing .storybook/vitest.setup.ts file...'));
  await writeFile(
    resolve(options.configDir, 'vitest.setup.ts'),
    dedent`
      import { beforeAll } from 'vitest'
      import { setProjectAnnotations } from '${annotationsImport}'
      import * as projectAnnotations from './preview'
      
      const project = setProjectAnnotations(projectAnnotations)
      
      beforeAll(project.beforeAll)
    `
  );

  const extensions = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'];
  const configFiles = extensions.map((ext) => 'vitest.config' + ext);

  const rootConfig = await findUp(configFiles, {
    cwd: process.cwd(),
  });

  if (rootConfig) {
    const extname = rootConfig ? path.extname(rootConfig) : 'ts';
    const browserWorkspaceFile = resolve(dirname(rootConfig), `vitest.workspace${extname}`);
    if (existsSync(browserWorkspaceFile)) {
      logger.info(
        'A workspace file already exists. Check our docs how to configure vitest to test stories: https://storybook.js.org/docs/configure/vitest'
      );
      return;
    }
    logger.info(c.bold('Writing vitest.workspace.ts file...'));
    await writeFile(
      browserWorkspaceFile,
      dedent`
        import { defineWorkspace } from 'vitest/config'

        export default defineWorkspace([
          'vitest.config.ts',
          {
            extends: 'vitest.config${extname}',
            plugins: [
              storybookTest(),${vitestInfo.frameworkPluginCall ? '\n' + vitestInfo.frameworkPluginCall : ''}
            ],
            test: {
              include: ['**/*.stories.?(m)[jt]s?(x)'],
              browser: {
                enabled: true,
                name: 'chromium',
                provider: 'playwright',
                headless: true,
              },
              isolate: false,
              setupFiles: ['./.storybook/vitest.setup.ts'],
            },
          },
        ])
      `
    );
    return;
  }
  logger.info(c.bold('Writing vitest.config.ts file...'));
  await writeFile(
    resolve('vitest.config.ts'),
    dedent`
      import { defineConfig } from "vitest/config";
      import { storybookTest } from "@storybook/experimental-addon-vitest/plugin";
      ${vitestInfo.frameworkPluginImport ? vitestInfo.frameworkPluginImport + '\n' : ''}
      export default defineConfig({
        plugins: [
          storybookTest(),${vitestInfo.frameworkPluginCall ? '\n' + vitestInfo.frameworkPluginCall : ''}
        ],
        test: {
          include: ['**/*.stories.?(m)[jt]s?(x)'],
          browser: {
            enabled: true,
            name: 'chromium',
            provider: 'playwright',
            headless: true,
          },
          isolate: false,
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      })
    `
  );
}

const getVitestPluginInfo = (framework: string) => {
  let frameworkPluginImport = '';
  let frameworkPluginCall = '';

  if (framework === '@storybook/nextjs') {
    frameworkPluginImport = "import vitePluginNext from 'vite-plugin-storybook-nextjs'";
    frameworkPluginCall = 'vitePluginNext()';
  }

  if (framework === '@storybook/sveltekit') {
    frameworkPluginImport = "import { storybookSveltekitPlugin } from '@storybook/sveltekit/vite'";
    frameworkPluginCall = 'storybookSveltekitPlugin()';
  }

  return { frameworkPluginImport, frameworkPluginCall };
};

async function getFrameworkInfo({ configDir, packageManager: pkgMgr }: PostinstallOptions) {
  const packageManager = JsPackageManagerFactory.getPackageManager({ force: pkgMgr });
  const packageJson = await packageManager.retrievePackageJson();

  const config = await loadMainConfig({ configDir, noCache: true });
  const { framework } = config;

  const frameworkName = typeof framework === 'string' ? framework : framework?.name;

  if (!frameworkName) {
    throw new Error('Could not detect your storybook framework.');
  }

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

  if (!builder || !renderer) {
    throw new Error('Could not detect your storybook framework.');
  }

  const builderPackageJson = await fs.readFile(
    `${typeof builder === 'string' ? builder : builder.name}/package.json`,
    'utf8'
  );
  const builderPackageName = JSON.parse(builderPackageJson).name;

  const rendererPackageJson = await fs.readFile(`${renderer}/package.json`, 'utf8');
  const rendererPackageName = JSON.parse(rendererPackageJson).name;

  return {
    frameworkPackageName,
    builderPackageName,
    rendererPackageName,
  };
}
