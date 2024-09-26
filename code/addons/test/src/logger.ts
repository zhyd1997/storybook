import chalk from 'chalk';

import { ADDON_ID } from './constants';

export const log = (message: any) => {
  console.log(`${chalk.magenta(ADDON_ID)}: ${message.toString().trim()}`);
};
