import { spawn } from 'child_process';
import { versions } from '@storybook/core/common';

const args = process.argv.slice(2);

// Forward some commands to @storybook/toolbox
if (['dev', 'build'].includes(args[0])) {
  require('@storybook/core/cli/bin');
} else {
  const proxiedArgs =
    args[0] === 'init'
      ? [`create-storybook@${versions.storybook}`, ...args.slice(1)]
      : [`@storybook/toolbox@${versions.storybook}`, ...args];
  const command = ['npx', '--yes', ...proxiedArgs];
  console.log(command.join(' '));
  const child = spawn(command[0], command.slice(1), { stdio: 'inherit' });
  child.on('exit', (code) => {
    if (code != null) {
      process.exit(code);
    }
    process.exit(1);
  });
}
