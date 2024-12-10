import { spawn } from 'child_process';

export default async function postInstall() {
  await new Promise<void>((resolve) => {
    const child = spawn('npx', ['storybook', 'automigrate', 'addonA11yAddonTest'], {
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      resolve();
    });
  });
}
