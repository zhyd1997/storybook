import { expect, test } from '@playwright/test';

import { SbPage } from '../../../../code/e2e-tests/util';

const storybookUrl = 'http://localhost:6006';

test.describe('component testing', () => {
  test('should execute tests via testing module UI', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', `Skipping tests for ${browserName}`);

    await page.goto(storybookUrl);
    const sbPage = new SbPage(page, expect);

    await sbPage.waitUntilLoaded();
    await sbPage.navigateToStory('addons/test', 'Expected Failure');

    // For whatever reason, sometimes it takes longer for the story to load
    const storyElement = sbPage.getCanvasBodyElement().getByRole('button', { name: 'test' });
    await expect(storyElement).toBeVisible({ timeout: 10000 });

    // Change controls to force a failure in the story
    await sbPage.viewAddonPanel('Controls');
    const toggle = sbPage.panelContent().locator('input[name=forceFailure]');
    await expect(toggle).not.toBeChecked();

    await toggle.check();

    // Save controls
    await sbPage.panelContent().locator('[data-short-label="Unsaved changes"]').isVisible();
    await sbPage.panelContent().locator('button').getByText('Update story').click();
    await expect(sbPage.page.getByTitle('Story saved')).toBeVisible();

    await page.locator('#addons').getByRole('button').nth(2).click();

    // Wait for test results to appear
    const errorFilter = page.getByRole('button', { name: '1 Error' });
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
});
