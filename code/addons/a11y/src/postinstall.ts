// eslint-disable-next-line depend/ban-dependencies
import { execa } from 'execa';

const $ = execa({
  preferLocal: true,
  stdio: 'inherit',
  // we stream the stderr to the console
  reject: false,
});

export default async function postInstall() {
  await $`storybook automigrate addonA11yAddonTest`;
}
