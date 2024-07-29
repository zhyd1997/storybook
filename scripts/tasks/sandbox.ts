import { pathExists, remove } from 'fs-extra';

import { join } from 'path';
import { promisify } from 'util';
import dirSize from 'fast-folder-size';
import type { Task } from '../task';
import { now, saveBench } from '../bench/utils';

const logger = console;

export const sandbox: Task = {
  description: 'Create the sandbox from a template',
  dependsOn: ({ template }, { link }) => {
    if ('inDevelopment' in template && template.inDevelopment) {
      return ['run-registry', 'generate'];
    }

    if (link) {
      return ['compile'];
    }

    return ['run-registry'];
  },
  async ready({ sandboxDir }) {
    return pathExists(sandboxDir);
  },
  async run(details, options) {
    if (options.link && details.template.inDevelopment) {
      logger.log(
        `The ${options.template} has inDevelopment property enabled, therefore the sandbox for that template cannot be linked. Enabling --no-link mode..`
      );

      options.link = false;
    }
    if (await this.ready(details)) {
      logger.info('🗑  Removing old sandbox dir');
      await remove(details.sandboxDir);
    }

    const {
      create,
      install,
      setupVitest,
      addStories,
      extendMain,
      init,
      addExtraDependencies,
      setImportMap,
    } =
      // @ts-expect-error esbuild for some reason exports a default object
      // eslint-disable-next-line import/extensions
      (await import('./sandbox-parts.ts')).default;

    let startTime = now();
    await create(details, options);
    const createTime = now() - startTime;
    const createSize = 0;

    startTime = now();
    await install(details, options);
    const generateTime = now() - startTime;
    const generateSize = await promisify(dirSize)(join(details.sandboxDir, 'node_modules'));

    startTime = now();
    await init(details, options);
    const initTime = now() - startTime;
    const initSize = await promisify(dirSize)(join(details.sandboxDir, 'node_modules'));

    await saveBench(
      'sandbox',
      {
        createTime,
        generateTime,
        initTime,
        createSize,
        generateSize,
        initSize,
        diffSize: initSize - generateSize,
      },
      { rootDir: details.sandboxDir }
    );

    if (!options.skipTemplateStories) {
      await addStories(details, options);
    }

    const extraDeps = details.template.modifications?.extraDependencies ?? [];

    if (
      (details.sandboxDir.includes('svelte-kit') ||
        details.sandboxDir.includes('vite') ||
        details.sandboxDir.includes('nextjs')) &&
      !details.sandboxDir.includes('html') &&
      !details.sandboxDir.includes('lit')
    ) {
      const renderer = details.template.expected.renderer.replace('@storybook/', '');

      // Remove numbers so that vue3 becomes vue
      const testingLibraryPackage = `@testing-library/${renderer.replace(/\d/g, '')}`;
      extraDeps.push(
        'happy-dom',
        'vitest',
        '@vitest/browser',
        '@storybook/experimental-vitest-plugin@0.0.1--canary.2.bbfa711.0',
        testingLibraryPackage
      );

      if (details.sandboxDir.includes('nextjs')) {
        extraDeps.push('vite-plugin-storybook-nextjs');
      }

      await setupVitest(details, { renderer, testingLibraryPackage });
    }

    await addExtraDependencies({
      cwd: details.sandboxDir,
      debug: options.debug,
      dryRun: options.dryRun,
      extraDeps,
    });

    await extendMain(details, options);

    await setImportMap(details.sandboxDir);

    logger.info(`✅ Storybook sandbox created at ${details.sandboxDir}`);
  },
};
