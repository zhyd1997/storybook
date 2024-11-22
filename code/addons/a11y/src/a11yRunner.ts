import { addons } from 'storybook/internal/preview-api';

import { global } from '@storybook/global';

import { EVENTS } from './constants';
import type { A11yParameters } from './params';

const { document } = global;

const channel = addons.getChannel();

const defaultParameters = { config: {}, options: {} };

export const run = async (input: A11yParameters = defaultParameters) => {
  const { default: axe } = await import('axe-core');

  const { element = '#storybook-root', config, options = {} } = input;
  const htmlElement = document.querySelector(element as string) ?? document.body;

  if (!htmlElement) {
    return;
  }

  axe.reset();
  if (config) {
    axe.configure(config);
  }

  return axe.run(htmlElement, options);
};

channel.on(EVENTS.MANUAL, async (storyId: string, input: A11yParameters = defaultParameters) => {
  try {
    const result = await run(input);
    // Axe result contains class instances, which telejson deserializes in a
    // way that violates:
    //  Content Security Policy directive: "script-src 'self' 'unsafe-inline'".
    const resultJson = JSON.parse(JSON.stringify(result));
    channel.emit(EVENTS.RESULT, resultJson, storyId);
  } catch (error) {
    channel.emit(EVENTS.ERROR, error);
  }
});
