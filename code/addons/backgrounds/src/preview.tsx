import type { Addon_DecoratorFunction } from 'storybook/internal/types';
import { withBackground } from './legacy/withBackgroundLegacy';
import { withGrid } from './legacy/withGridLegacy';
import { PARAM_KEY } from './constants';
import { withBackgroundAndGrid } from './modern/decorator';

export const decorators: Addon_DecoratorFunction[] = FEATURES?.backgroundsStoryGlobals
  ? [withBackgroundAndGrid]
  : [withGrid, withBackground];
export const parameters = FEATURES?.backgroundsStoryGlobals
  ? {}
  : {
      [PARAM_KEY]: {
        grid: {
          cellSize: 20,
          opacity: 0.5,
          cellAmount: 5,
        },
        values: [
          { name: 'light', value: '#F8F8F8' },
          { name: 'dark', value: '#333333' },
        ],
      },
    };

export const globalTypes = FEATURES?.backgroundsStoryGlobals
  ? {
      grid: { defaultValue: 0 },
      backgrounds: {},
    }
  : {};

export const initialGlobals = {
  [PARAM_KEY]: null as any,
};
