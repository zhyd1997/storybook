import type { ArgTypesEnhancer, DecoratorFunction } from '@storybook/core/types';
import { SourceType, enhanceArgTypes } from '@storybook/core/docs-tools';

import { sourceDecorator } from './docs/sourceDecorator';
import type { HtmlRenderer } from './types';

export const decorators: DecoratorFunction<HtmlRenderer>[] = [sourceDecorator];

export const parameters = {
  docs: {
    story: { inline: true },
    source: {
      type: SourceType.DYNAMIC,
      language: 'html',
      code: undefined,
      excludeDecorators: undefined,
    },
  },
};

export const argTypesEnhancers: ArgTypesEnhancer[] = [enhanceArgTypes];
