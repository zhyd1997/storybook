import { PARAM_KEY as KEY } from './constants';

export const initialGlobals = FEATURES?.viewportStoryGlobals
  ? {
      [KEY]: { value: 'reset', isRotated: false },
    }
  : { viewport: 'reset', viewportRotated: false };
