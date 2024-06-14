import React, { useState, useEffect } from 'react';
import type { API } from '@storybook/manager-api';
import type { Tag, API_IndexHash } from '@storybook/types';
import { IconButton } from '@storybook/components';
import { FilterIcon } from '@storybook/icons';

interface TagsFilterProps {
  api: API;
  index: API_IndexHash;
}

const UI_FILTER = 'ui-filter';

export const TagsFilter = ({ api }: TagsFilterProps) => {
  const [includeTags, setIncludeTags] = useState([]);
  const [excludeTags, setExcludeTags] = useState([]);
  const tagsActive = includeTags.length + excludeTags.length > 0;

  const updateTag = (tag: Tag, selected: boolean, include: boolean) => {
    const [filter, setFilter, queryParam] = include
      ? [includeTags, setIncludeTags, 'includeTags']
      : [excludeTags, setExcludeTags, 'excludeTags'];

    // no change needed for state/url if the tag is already in the correct state
    if ((selected && filter.includes(tag)) || (!selected && !filter.includes(tag))) return;

    // update state
    const newFilter = selected ? [...filter, tag] : filter.filter((t) => t !== tag);
    setFilter(newFilter);

    // update URL
    const url = new URL(window.location.href);
    if (newFilter.length === 0) {
      url.searchParams.delete(queryParam);
    } else {
      url.searchParams.set(queryParam, newFilter.join(','));
    }
    window.history.pushState({}, '', url);
  };

  const toggleTags = () => {
    // updateTag('bar', !includeTags.includes('bar'), true);
    updateTag('bar', !excludeTags.includes('bar'), false);
  };

  useEffect(() => {
    api.experimental_setFilter(UI_FILTER, (item) => {
      const tags = item.tags ?? [];
      if (excludeTags.some((tag) => tags.includes(tag))) return false;
      if (!includeTags.every((tag) => tags.includes(tag))) return false;
      return true;
    });
  }, [api, includeTags, excludeTags]);

  return (
    <IconButton key="tags" title="Tag filters" active={tagsActive} onClick={toggleTags}>
      <FilterIcon />
    </IconButton>
  );
};
