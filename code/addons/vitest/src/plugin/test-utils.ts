/* eslint-disable @typescript-eslint/naming-convention */

/* eslint-disable no-underscore-dangle */
import type { RunnerTask, TaskContext, TaskMeta } from 'vitest';

import type { ComponentAnnotations, ComposedStoryFn } from 'storybook/internal/types';

import { isExportStory } from '@storybook/csf';

import type { UserOptions } from './types';
import { setViewport } from './viewports';

export { setViewport } from './viewports';

type TagsFilter = Required<UserOptions['tags']>;

export const shouldRun = (storyTags: string[], tagsFilter: TagsFilter) => {
  const isIncluded =
    tagsFilter?.include.length === 0 || tagsFilter?.include.some((tag) => storyTags.includes(tag));
  const isNotExcluded = tagsFilter?.exclude.every((tag) => !storyTags.includes(tag));

  return isIncluded && isNotExcluded;
};

export const shouldSkip = (storyTags: string[], tagsFilter: TagsFilter) => {
  return (
    !shouldRun(storyTags, tagsFilter) || tagsFilter?.skip.some((tag) => storyTags.includes(tag))
  );
};

export const isValidTest = (
  story: ComposedStoryFn,
  meta: ComponentAnnotations,
  tagsFilter: TagsFilter
) => {
  const isValidStory = isExportStory(story.storyName, meta);
  return isValidStory && shouldRun(story.tags, tagsFilter);
};

export const testStory = (Story: ComposedStoryFn, tagsFilter: TagsFilter) => {
  return async ({ task, skip }: TaskContext) => {
    if (Story === undefined || shouldSkip(Story.tags, tagsFilter)) {
      skip();
    }

    const _task = task as RunnerTask & {
      meta: TaskMeta & { storyId: string; hasPlayFunction: boolean };
    };
    _task.meta.storyId = Story.id;
    await setViewport(Story.parameters.viewport);
    await Story.run();
  };
};
