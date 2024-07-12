import chalk from 'chalk';
import { readFile } from 'node:fs/promises';
import { dedent } from 'ts-dedent';

import type { Fix } from '../types';
import { getStorybookVersionSpecifier } from '../../helpers';

const logger = console;

type PackageUsage = Record<string, string[]>;

interface MissingStorybookDependenciesOptions {
  packageUsage: PackageUsage;
}

const consolidatedPackages = [
  '@storybook/channels',
  '@storybook/client-logger',
  '@storybook/core-common',
  '@storybook/core-events',
  '@storybook/csf-tools',
  '@storybook/docs-tools',
  '@storybook/node-logger',
  '@storybook/preview-api',
  '@storybook/router',
  '@storybook/telemetry',
  '@storybook/theming',
  '@storybook/types',
  '@storybook/manager-api',
  '@storybook/manager',
  '@storybook/preview',
  '@storybook/core-server',
  '@storybook/builder-manager',
  '@storybook/components',
];

/**
 * Find usage of Storybook packages in the project files which are not present in the dependencies.
 */
export const missingStorybookDependencies: Fix<MissingStorybookDependenciesOptions> = {
  id: 'missingStorybookDependencies',
  promptType: 'auto',
  versionRange: ['*', '*'],

  async check({ packageManager }) {
    // Dynamically import globby because it is a pure ESM module
    const { globby } = await import('globby');

    const result = await packageManager.findInstallations(consolidatedPackages);
    if (!result) {
      return null;
    }

    const installedDependencies = Object.keys(result.dependencies);
    const dependenciesToCheck = consolidatedPackages.filter(
      (pkg) => !installedDependencies.includes(pkg)
    );

    const patterns = ['**/.storybook/*', '**/*.stories.*', '**/*.story.*'];

    const files = await globby(patterns, {
      ignore: ['**/node_modules/**'],
    });
    const packageUsage: PackageUsage = {};

    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      dependenciesToCheck.forEach((pkg) => {
        // match imports like @storybook/theming or @storybook/theming/create
        const regex = new RegExp(`['"]${pkg}(/[^'"]*)?['"]`);
        if (regex.test(content)) {
          if (!packageUsage[pkg]) {
            packageUsage[pkg] = [];
          }
          packageUsage[pkg].push(file);
        }
      });
    }

    return Object.keys(packageUsage).length > 0 ? { packageUsage } : null;
  },

  prompt({ packageUsage }) {
    return dedent`
      Found usage of the following Storybook packages, but they are not present in your project dependencies:
      ${Object.entries(packageUsage)
        .map(
          ([pkg, files]) =>
            `- ${chalk.cyan(pkg)}: (${files.length} ${files.length === 1 ? 'file' : 'files'})`
        )
        .join('\n')}

      Not having them directly installed will cause breakage in your project, and we can fix this by adding them to your dependencies.
    `;
  },

  async run({ result: { packageUsage }, dryRun, packageManager }) {
    logger.info(
      `✅ Installing the following packages as devDependencies: ${Object.keys(packageUsage)}`
    );
    if (!dryRun) {
      const dependenciesToInstall = Object.keys(packageUsage);
      const versionToInstall = getStorybookVersionSpecifier(
        await packageManager.retrievePackageJson()
      );
      await packageManager.addDependencies(
        { installAsDevDependencies: true },
        dependenciesToInstall.map((pkg) => `${pkg}@${versionToInstall}`)
      );
    }
  },
};
