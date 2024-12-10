import { JsPackageManagerFactory } from 'storybook/internal/common';

import { type PostinstallOptions } from '../../../lib/cli-storybook/src/add';

export default async function postInstall(options: PostinstallOptions) {
  const packageManager = JsPackageManagerFactory.getPackageManager({
    force: options.packageManager,
  });

  await packageManager.executeCommand({
    command: 'npx',
    args: ['storybook', 'automigrate', 'addonA11yAddonTest'],
  });
}
