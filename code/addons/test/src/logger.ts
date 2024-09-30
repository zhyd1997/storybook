import c from 'tinyrainbow';

import { ADDON_ID } from './constants';

export const log = (message: any) => {
  console.log(`${c.magenta(ADDON_ID)}: ${message.toString().trim()}`);
};
