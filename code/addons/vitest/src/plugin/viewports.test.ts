/* eslint-disable no-underscore-dangle */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { page } from '@vitest/browser/context';

import { DEFAULT_VIEWPORT_DIMENSIONS, type ViewportsParam, setViewport } from './viewports';

vi.mock('@vitest/browser/context', () => ({
  page: {
    viewport: vi.fn(),
  },
}));

describe('setViewport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__vitest_browser__ = true;
  });

  afterEach(() => {
    globalThis.__vitest_browser__ = false;
  });

  it('should do nothing if __vitest_browser__ is false', async () => {
    globalThis.__vitest_browser__ = false;

    await setViewport();
    expect(page.viewport).not.toHaveBeenCalled();
  });

  it('should set the viewport to the specified dimensions from INITIAL_VIEWPORTS', async () => {
    const viewportsParam: any = {
      // supported by default in addon viewports
      defaultViewport: 'ipad',
    };

    await setViewport(viewportsParam);
    expect(page.viewport).toHaveBeenCalledWith(768, 1024);
  });

  it('should set the viewport to the specified dimensions if defaultViewport is valid', async () => {
    const viewportsParam: ViewportsParam = {
      defaultViewport: 'small',
      viewports: {
        small: {
          name: 'Small screen',
          type: 'mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
      },
    };

    await setViewport(viewportsParam);
    expect(page.viewport).toHaveBeenCalledWith(375, 667);
  });

  it('should set the viewport to DEFAULT_VIEWPORT_DIMENSIONS if defaultViewport has unparseable styles', async () => {
    const viewportsParam: ViewportsParam = {
      defaultViewport: 'oddSizes',
      viewports: {
        oddSizes: {
          name: 'foo',
          type: 'other',
          styles: {
            width: 'calc(100vw - 20px)',
            height: '100%',
          },
        },
      },
    };

    await setViewport(viewportsParam);
    expect(page.viewport).toHaveBeenCalledWith(
      DEFAULT_VIEWPORT_DIMENSIONS.width,
      DEFAULT_VIEWPORT_DIMENSIONS.height
    );
  });

  it('should merge provided viewports with initial viewports', async () => {
    const viewportsParam: ViewportsParam = {
      defaultViewport: 'customViewport',
      viewports: {
        customViewport: {
          name: 'Custom Viewport',
          type: 'mobile',
          styles: {
            width: '800px',
            height: '600px',
          },
        },
      },
    };

    await setViewport(viewportsParam);
    expect(page.viewport).toHaveBeenCalledWith(800, 600);
  });

  it('should fallback to DEFAULT_VIEWPORT_DIMENSIONS if defaultViewport does not exist', async () => {
    const viewportsParam: any = {
      defaultViewport: 'nonExistentViewport',
    };

    await setViewport(viewportsParam);
    expect(page.viewport).toHaveBeenCalledWith(1200, 900);
  });
});
