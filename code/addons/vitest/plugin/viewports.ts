/* eslint-disable no-underscore-dangle */
import type { BrowserPage } from '@vitest/browser/context';
import { INITIAL_VIEWPORTS } from '../../viewport/src/defaults';
declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention
  var __vitest_browser__: boolean;
}

type Styles = ViewportStyles | null;
// | ((s: ViewportStyles | undefined) => ViewportStyles)

interface Viewport {
  name: string;
  styles: Styles;
  type: 'desktop' | 'mobile' | 'tablet' | 'other';
}

interface ViewportStyles {
  height: string;
  width: string;
}

interface ViewportMap {
  [key: string]: Viewport;
}

interface ViewportsParam {
  defaultViewport: string;
  viewports: ViewportMap;
}

export const setViewport = async (viewportsParam: ViewportsParam = {} as ViewportsParam) => {
  const defaultViewport = viewportsParam.defaultViewport;
  if (!defaultViewport || !globalThis.__vitest_browser__) return null;

  let page: BrowserPage;
  try {
    const importPath = '/@id/__x00__@vitest/browser/context';
    const vitestContext = await import(/* @vite-ignore */ importPath);
    page = vitestContext.page;
  } catch (e) {
    return;
  }

  const viewports = {
    ...INITIAL_VIEWPORTS,
    ...viewportsParam.viewports,
  };

  if (defaultViewport in viewports) {
    const styles = viewports[defaultViewport].styles as ViewportStyles;
    if (styles?.width && styles?.height) {
      const { width, height } = {
        width: Number.parseInt(styles.width),
        height: Number.parseInt(styles.height),
      };
      await page.viewport(width, height);
    }
  }

  return null;
};
