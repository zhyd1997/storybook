import type { Renderer } from '@storybook/core/types';
import type { StoryStore } from '@storybook/core/preview-api';

declare global {
  interface Window {
    __STORYBOOK_STORY_STORE__: StoryStore<Renderer>;
  }
}
