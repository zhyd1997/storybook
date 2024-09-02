import { logger } from 'storybook/internal/node-logger';

import boxen, { type Options } from 'boxen';

const baseOptions: Options = {
  borderStyle: 'round',
  padding: 1,
  titleAlignment: 'left',
};

export const print = (message: string, options: Options) => {
  logger.line(1);
  logger.plain(boxen(message, { ...baseOptions, ...options }));
  logger.line(1);
};

export const printInfo = (title: string, message: string, options?: Options) =>
  print(message, { borderColor: 'blue', title, ...options });

export const printWarning = (title: string, message: string, options?: Options) =>
  print(message, { borderColor: 'yellow', title, ...options });

export const printError = (title: string, message: string, options?: Options) =>
  print(message, { borderColor: 'red', title, ...options });

export const printSuccess = (title: string, message: string, options?: Options) =>
  print(message, { borderColor: 'green', title, ...options });
