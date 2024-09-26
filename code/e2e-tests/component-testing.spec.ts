import { expect, test } from '@playwright/test';

import { SbPage } from './util';

const storybookUrl = process.env.STORYBOOK_URL || 'http://localhost:8001';
const type = process.env.STORYBOOK_TYPE || 'dev';

test.describe('component testing', () => {
  test.skip(type === 'build', `Skipping tests for production Storybooks`);
  test.beforeEach(async ({ page }) => {
    await page.goto(storybookUrl);
    await new SbPage(page).waitUntilLoaded();
  });

  test('should execute tests via testing module UI', async ({ page }) => {
    const sbPage = new SbPage(page);
    await sbPage.navigateToStory('addons/test/basics', 'Expected Failure');

    // Toggle watch mode
    await page.getByLabel('Watch Mode').check();

    /**
     * Wait a couple seconds for Vitest to spawn. Ideally we should test non-watch mode scenarios
     * first and then enable watch mode and test again. Currently, the vitest non-watch mode run is
     * caching and therefore not picking up arg changes. However, we don't have a way in the UI that
     * states that Vitest is ready, hence we do this arbitrary timeout (not great, I know!)
     * eslint-disable-next-line playwright/no-wait-for-timeout
     */
    // then enable watch mode and test again. Currently, the vitest non-watch mode run
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(2000);

    // Change controls to force a failure in the story
    await sbPage.viewAddonPanel('Controls');
    const toggle = sbPage.panelContent().locator('input[name=forceFailure]');
    await toggle.click();

    // Save controls
    await sbPage.panelContent().locator('[data-short-label="Unsaved changes"]').isVisible();
    await sbPage.panelContent().locator('button').getByText('Update story').click();
    await expect(sbPage.page.getByTitle('Story saved')).toBeVisible();

    // Wait for test results to appear
    const errorFilter = page.getByRole('button', { name: '1 Error' });
    await expect(errorFilter).toBeVisible();

    // Assert for expected success
    const successfulStoryElement = page.locator(
      '[data-item-id="addons-test-basics--expected-success"] [role="status"]'
    );
    await expect(successfulStoryElement).toHaveAttribute('aria-label', 'Test status: success');

    // Assert for expected failure
    const failingStoryElement = page.locator(
      '[data-item-id="addons-test-basics--expected-failure"] [role="status"]'
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
