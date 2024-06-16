import React, { useState, useEffect } from 'react';
import { IconButton, WithTooltip } from '@storybook/components';
import { FilterIcon } from '@storybook/icons';
import type { API } from '@storybook/manager-api';
import type { Tag, API_IndexHash } from '@storybook/types';
import { TagsFilterPanel } from './TagsFilterPanel';

const TAGS_FILTER = 'tags-filter';

export interface TagsFilterProps {
  api: API;
  index: API_IndexHash;
  updateQueryParams: (params: Record<string, string | null>) => void;
  initialSelectedTags?: Tag[];
}

export const TagsFilter = ({
  api,
  index,
  updateQueryParams,
  initialSelectedTags = [],
}: TagsFilterProps) => {
  const [selectedTags, setSelectedTags] = useState(initialSelectedTags);
  const [exclude, setExclude] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const tagsActive = selectedTags.length > 0;

  useEffect(() => {
    api.experimental_setFilter(TAGS_FILTER, (item) => {
      const tags = item.tags ?? [];
      return exclude
        ? !selectedTags.some((tag) => tags.includes(tag))
        : selectedTags.every((tag) => tags.includes(tag));
    });

    const tagsParam = selectedTags.join(',');
    const [includeTags, excludeTags] = exclude ? [null, tagsParam] : [tagsParam, null];
    updateQueryParams({ includeTags, excludeTags });
  }, [api, selectedTags, exclude, updateQueryParams]);

  const allTags = Object.values(index).reduce((acc, entry) => {
    if (entry.type === 'story') {
      entry.tags.forEach((tag: Tag) => acc.add(tag));
    }
    return acc;
  }, new Set<Tag>());

  return (
    <WithTooltip
      placement="bottom"
      trigger="click"
      onVisibleChange={setExpanded}
      tooltip={() => (
        <TagsFilterPanel
          allTags={Array.from(allTags)}
          selectedTags={selectedTags}
          exclude={exclude}
          toggleTag={(tag) => {
            if (selectedTags.includes(tag)) {
              setSelectedTags(selectedTags.filter((t) => t !== tag));
            } else {
              setSelectedTags([...selectedTags, tag]);
            }
          }}
          toggleExclude={() => setExclude(!exclude)}
        />
      )}
    >
      <IconButton
        key="tags"
        title="Tag filters"
        active={tagsActive}
        onClick={(event) => {
          event.preventDefault();
          setExpanded(!expanded);
        }}
      >
        <FilterIcon />
      </IconButton>
    </WithTooltip>
  );
};
