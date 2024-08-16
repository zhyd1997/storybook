/* eslint-disable no-underscore-dangle */
import { page } from '@vitest/browser/context';

import { INITIAL_VIEWPORTS } from '../../../viewport/src/defaults';
import type { ViewportMap, ViewportStyles } from '../../../viewport/src/types';

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention
  var __vitest_browser__: boolean;
}

export interface ViewportsParam {
  defaultViewport: string;
  viewports: ViewportMap;
}

export const DEFAULT_VIEWPORT_DIMENSIONS = {
  width: 1200,
  height: 900,
};

export const setViewport = async (viewportsParam: ViewportsParam = {} as ViewportsParam) => {
  const defaultViewport = viewportsParam.defaultViewport;

  if (!page || !globalThis.__vitest_browser__ || !defaultViewport) {
    return null;
  }

  const viewports = {
    ...INITIAL_VIEWPORTS,
    ...viewportsParam.viewports,
  };

  let viewportWidth = DEFAULT_VIEWPORT_DIMENSIONS.width;
  let viewportHeight = DEFAULT_VIEWPORT_DIMENSIONS.height;

  if (defaultViewport in viewports) {
    const styles = viewports[defaultViewport].styles as ViewportStyles;
    if (styles?.width && styles?.height) {
      const validPixelOrNumber = /^\d+(px)?$/;

      // if both dimensions are not valid numbers e.g. 'calc(100vh - 10px)' or '100%', use the default dimensions instead
      if (validPixelOrNumber.test(styles.width) && validPixelOrNumber.test(styles.height)) {
        viewportWidth = Number.parseInt(styles.width, 10);
        viewportHeight = Number.parseInt(styles.height, 10);
      }
    }
  }

  return page.viewport(viewportWidth, viewportHeight);
};
