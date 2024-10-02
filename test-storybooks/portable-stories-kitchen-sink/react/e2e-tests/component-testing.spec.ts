import { expect, test } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

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
  test.beforeEach(async ({ page }) => {
    const sbPage = new SbPage(page, expect);

    await page.goto(storybookUrl);
    await sbPage.waitUntilLoaded();
  });

  test('should execute tests via testing module UI', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', `Skipping tests for ${browserName}`);
    await setForceFailureFlag(true);

    const sbPage = new SbPage(page, expect);
    await sbPage.navigateToStory('addons/test', 'Expected Failure');

    // For whatever reason, sometimes it takes longer for the story to load
    const storyElement = sbPage.getCanvasBodyElement().getByRole('button', { name: 'test' });
    await expect(storyElement).toBeVisible({ timeout: 10000 });

    await page.locator('#addons').getByRole('button').nth(2).click();

    // Wait for test results to appear
    const errorFilter = page.getByLabel('Show errors');
    await expect(errorFilter).toBeVisible({ timeout: 20000 });

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

    // TODO: improve locators in the testing module elements
    await page.locator('#sidebar-bottom').getByRole('button').first().click();

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
