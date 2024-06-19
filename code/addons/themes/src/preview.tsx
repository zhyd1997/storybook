import type { Renderer, ProjectAnnotations } from '@storybook/core/types';
import { GLOBAL_KEY } from './constants';

export const globals: ProjectAnnotations<Renderer>['globals'] = {
  // Required to make sure SB picks this up from URL params
  [GLOBAL_KEY]: '',
};
