import { addons } from '@storybook/manager-api';
import { global } from '@storybook/global';
import type { Tag } from '@storybook/types';

const TAG_FILTERS = 'tag-filters';
const STATIC_FILTER = 'static-filter';
const UI_FILTER = 'ui-filter';

const parseTags = (tags?: string) => {
  if (!tags) return undefined;
  return tags.split(',').reduce((acc, tag) => {
    tag.trim();
    acc[tag] = true;
    return acc;
  }, {} as Record<Tag, boolean>);
};

addons.register(TAG_FILTERS, (api) => {
  // FIXME: this ensures the filter is applied after the first render
  //        to avoid a strange race condition in Webkit only.
  const staticExludeTags = Object.entries(global.TAGS_OPTIONS ?? {}).reduce((acc, entry) => {
    const [tag, option] = entry;
    if ((option as any).excludeFromSidebar) {
      acc[tag] = true;
    }
    return acc;
  }, {} as Record<string, boolean>);

  api.experimental_setFilter(STATIC_FILTER, (item) => {
    const tags = item.tags || [];
    return tags.filter((tag) => staticExludeTags[tag]).length === 0;
  });

  api.experimental_setFilter(UI_FILTER, (item) => {
    const tags = item.tags || [];
    const { queryParams } = api.getUrlState();
    const tagToInclude = parseTags(queryParams.tagsFilter);

    if (!tagToInclude) return true;

    let include = true;
    include = tags.some((tag) => tagToInclude[tag));

    if (excludeTags) {
      include = !tags.some((tag) => excludeTags.includes(tag));
    }
    return include;
  });
});
