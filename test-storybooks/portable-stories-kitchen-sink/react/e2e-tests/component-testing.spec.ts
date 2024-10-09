import { promises as fs } from 'node:fs';
import path from 'node:path';

import { TESTING_MODULE_RUN_PROGRESS_RESPONSE } from 'storybook/internal/core-events';

import { expect, test } from '@playwright/test';

import { SbPage } from '../../../../code/e2e-tests/util';

const storybookUrl = 'http://localhost:6006';
const testStoryPath = path.resolve(__dirname, '..', 'stories/AddonTest.stories.tsx');

const setForceFailureFlag = async (value: boolean) => {
  // Read the story file content asynchronously
  const storyContent = (await fs.readFile(testStoryPath)).toString();

  // Create a regex to match 'forceFailure: true' or 'forceFailure: false'
  const forceFailureRegex = /forceFailure:\s*(true|false)/;

  // Replace the value of 'forceFailure' with the new value
  const updatedContent = storyContent.replace(forceFailureRegex, `forceFailure: ${value}`);

  // Write the updated content back to the file asynchronously
  await fs.writeFile(testStoryPath, updatedContent);
};

test.describe('component testing', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ page }) => {
    const sbPage = new SbPage(page, expect);

    await page.goto(storybookUrl);
    await page.evaluate(() => window.sessionStorage.clear());
    await sbPage.waitUntilLoaded();
  });

  test('should show discrepancy between test results', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', `Skipping tests for ${browserName}`);
    await setForceFailureFlag(true);

    // Emit a channel event so that statuses in the sidebar can be mocked.
    // leave the full mock object as it might be useful in the future (like when we display amount, timing, etc)
    const mockData = {
      status: 'success',
      payload: {
        numFailedTests: 1,
        numPassedTests: 2,
        numPendingTests: 0,
        numTotalTests: 3,
        testResults: [
          {
            results: [
              {
                status: 'failed',
                duration: 7,
                failureMessages: [
                  'Error: Expected failure\n    at play (http://localhost:5174/Users/yannbraga/open-source/storybook/test-storybooks/portable-stories-kitchen-sink/react/stories/AddonTest.stories.tsx?import&browserv=1728406664275:20:13)\n    at runStory (http://localhost:5174/node_modules/.vite/deps/@storybook_experimental-addon-test_internal_test-utils.js?v=d915d166:9220:11)\n    at async http://localhost:5174/node_modules/.vite/deps/@storybook_experimental-addon-test_internal_test-utils.js?v=d915d166:11524:5\n    at async runTest (http://localhost:5174/node_modules/@vitest/runner/dist/index.js?v=d915d166:969:11)\n    at async runSuite (http://localhost:5174/node_modules/@vitest/runner/dist/index.js?v=d915d166:1125:15)\n    at async runFiles (http://localhost:5174/node_modules/@vitest/runner/dist/index.js?v=d915d166:1182:5)\n    at async startTests (http://localhost:5174/node_modules/@vitest/runner/dist/index.js?v=d915d166:1191:3)\n    at async executeTests (http://localhost:5174/__vitest_browser__/tester-C7y_vb57.js:11959:9)',
                ],
                storyId: 'addons-test--expected-success',
              },
              {
                status: 'passed',
                duration: 1,
                storyId: 'addons-test--expected-failure',
              },
              {
                status: 'passed',
                duration: 803,
                storyId: 'addons-test--long-running',
              },
            ],
            startTime: 1728406664407,
            endTime: 1728406665218,
            status: 'failed',
          },
        ],
        success: true,
        progress: 0,
        startTime: 1728406628146,
      },
      providerId: 'storybook/test/test-provider',
    };

    const sbPage = new SbPage(page, expect);
    await sbPage.emitChannelEvent(TESTING_MODULE_RUN_PROGRESS_RESPONSE, mockData);

    await sbPage.navigateToStory('addons/test', 'Expected Failure');

    // For whatever reason, sometimes it takes longer for the story to load
    const storyElement = sbPage.getCanvasBodyElement().getByRole('button', { name: 'test' });
    await expect(storyElement).toBeVisible({ timeout: 10000 });

    await sbPage.viewAddonPanel('Component Tests');

    // For whatever reason, when visiting a story sometimes the story element is collapsed and that causes flake
    const testStoryElement = await page.getByRole('button', {
      name: 'Test',
      exact: true,
    });
    if ((await testStoryElement.getAttribute('aria-expanded')) !== 'true') {
      testStoryElement.click();
    }

    // Assert discrepancy: CLI pass + Browser fail
    const failingStoryElement = page.locator(
      '[data-item-id="addons-test--expected-failure"] [role="status"]'
    );
    await expect(failingStoryElement).toHaveAttribute('aria-label', 'Test status: success');
    await expect(sbPage.panelContent()).toContainText(
      /This component test passed in CLI, but the tests failed in this browser./
    );

    // Assert discrepancy: CLI fail + Browser pass
    await sbPage.navigateToStory('addons/test', 'Expected Success');
    const successfulStoryElement = page.locator(
      '[data-item-id="addons-test--expected-success"] [role="status"]'
    );
    await expect(successfulStoryElement).toHaveAttribute('aria-label', 'Test status: error');
    await expect(sbPage.panelContent()).toContainText(
      /This component test passed in this browser, but the tests failed in CLI/
    );
  });

  test('should execute tests via testing module UI', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', `Skipping tests for ${browserName}`);
    await setForceFailureFlag(true);

    const sbPage = new SbPage(page, expect);
    await sbPage.navigateToStory('addons/test', 'Expected Failure');

    // For whatever reason, sometimes it takes longer for the story to load
    const storyElement = sbPage.getCanvasBodyElement().getByRole('button', { name: 'test' });
    await expect(storyElement).toBeVisible({ timeout: 10000 });

    // TODO: This is just temporary, the UI will be different
    await page.locator('#addons').getByRole('button').nth(2).click();

    // Wait for test results to appear
    const errorFilter = page.getByLabel('Show errors');
    await expect(errorFilter).toBeVisible({ timeout: 30000 });

    // Assert for expected success
    const successfulStoryElement = page.locator(
      '[data-item-id="addons-test--expected-success"] [role="status"]'
    );
    await expect(successfulStoryElement).toHaveAttribute('aria-label', 'Test status: success');

    // Assert for expected failure
    const failingStoryElement = page.locator(
      '[data-item-id="addons-test--expected-failure"] [role="status"]'
    );
    await expect(failingStoryElement).toHaveAttribute('aria-label', 'Test status: error');

    // Assert that filter works as intended
    await errorFilter.click();

    const sidebarItems = page.locator(
      '.sidebar-item[data-ref-id="storybook_internal"][data-nodetype="component"]'
    );
    await expect(sidebarItems).toHaveCount(1);
  });

  test('should execute tests via testing module UI watch mode', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', `Skipping tests for ${browserName}`);
    await setForceFailureFlag(false);

    const sbPage = new SbPage(page, expect);
    await sbPage.navigateToStory('addons/test', 'Expected Failure');

    // For whatever reason, sometimes it takes longer for the story to load
    const storyElement = sbPage.getCanvasBodyElement().getByRole('button', { name: 'test' });
    await expect(storyElement).toBeVisible({ timeout: 10000 });

    await page.getByLabel('Toggle watch mode').click();

    // We shouldn't have to do an arbitrary wait, but because there is no UI for loading state yet, we have to
    await page.waitForTimeout(8000);

    await setForceFailureFlag(true);

    // Wait for test results to appear
    const errorFilter = page.getByLabel('Show errors');
    await expect(errorFilter).toBeVisible({ timeout: 30000 });

    // Assert for expected success
    const successfulStoryElement = page.locator(
      '[data-item-id="addons-test--expected-success"] [role="status"]'
    );
    await expect(successfulStoryElement).toHaveAttribute('aria-label', 'Test status: success');

    // Assert for expected failure
    const failingStoryElement = page.locator(
      '[data-item-id="addons-test--expected-failure"] [role="status"]'
    );
    await expect(failingStoryElement).toHaveAttribute('aria-label', 'Test status: error');

    // Assert that filter works as intended
    await errorFilter.click();

    const sidebarItems = page.locator(
      '.sidebar-item[data-ref-id="storybook_internal"][data-nodetype="component"]'
    );
    await expect(sidebarItems).toHaveCount(1);
  });
});
