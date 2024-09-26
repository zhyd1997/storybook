import path from 'node:path';

import type { TestProject, TestSpecification, Vitest, WorkspaceProject } from 'vitest/node';

import type { Channel } from 'storybook/internal/channels';
import type { TestingModuleRunRequestPayload } from 'storybook/internal/core-events';

import { StorybookReporter } from './reporter';
import type { TestManager } from './test-manager';

export class VitestManager {
  vitest: Vitest | null = null;

  vitestStartupCounter = 0;

  constructor(
    private channel: Channel,
    private testManager: TestManager
  ) {}

  async startVitest(watchMode = false) {
    const { createVitest } = await import('vitest/node');

    this.vitest = await createVitest('test', {
      watch: watchMode,
      passWithNoTests: true,
      standalone: true,
      changed: watchMode,
      // TODO:
      // Do we want to enable Vite's default reporter?
      // The output in the terminal might be too spamy and it might be better to
      // find a way to just show errors and warnings for example
      // Otherwise it might be hard for the user to discover Storybook related logs
      reporters: ['default', new StorybookReporter(this.testManager)],
      coverage: {
        enabled: false,
      },
    });

    // TODO what should happen if there's no projects?
    if (this.vitest?.projects.length) {
      await this.vitest.init();
    }
  }

  async runAllTests() {
    if (!this.vitest) {
      await this.startVitest();
    }

    const tests = await this.getStorybookTestSpecs();
    await this.cancelCurrentRun();
    await this.vitest!.runFiles(tests, true);
  }

  async runTests(testPayload: TestingModuleRunRequestPayload['payload']) {
    if (!this.vitest) {
      await this.startVitest();
    }

    // This list contains all the test files (story files) that need to be run
    // based on the test files that are passed in the tests array
    // This list does NOT contain any filtering of specific
    // test cases (story) within the test files
    const testList: TestSpecification[] = [];

    const storybookTests = await this.getStorybookTestSpecs();

    for (const storybookTest of storybookTests) {
      const match = testPayload.find((test) => {
        const absoluteImportPath = path.join(process.cwd(), test.importPath);
        return absoluteImportPath === storybookTest.moduleId;
      });
      if (match) {
        testList.push(storybookTest);
      }
    }

    await this.cancelCurrentRun();
    await this.vitest!.runFiles(testList, true);
  }

  async cancelCurrentRun() {
    await this.vitest?.cancelCurrentRun('keyboard-input');
    await this.vitest?.runningPromise;
  }

  async closeVitest() {
    await this.vitest?.close();
  }

  async getStorybookTestSpecs() {
    const globTestSpecs = (await this.vitest?.globTestSpecs()) ?? [];
    return (
      globTestSpecs.filter((workspaceSpec) => this.isStorybookProject(workspaceSpec.project)) ?? []
    );
  }

  isStorybookProject(project: TestProject | WorkspaceProject) {
    // eslint-disable-next-line no-underscore-dangle
    return !!project.config.env?.__STORYBOOK_URL__;
  }
}
