import React, { useCallback, useEffect, useState } from 'react';

import { Badge, IconButton, WithTooltip } from '@storybook/core/components';
import { styled } from '@storybook/core/theming';
import { FilterIcon } from '@storybook/icons';
import type { StoryIndex, Tag } from '@storybook/types';

import type { API } from '@storybook/core/manager-api';

import { TagsFilterPanel } from './TagsFilterPanel';

const TAGS_FILTER = 'tags-filter';

const Wrapper = styled.div({
  position: 'relative',
});

const Count = styled(Badge)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  transform: 'translate(50%, -50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 3,
  height: 15,
  minWidth: 15,
  lineHeight: '15px',
  fontSize: theme.typography.size.s1 - 1,
  background: theme.color.secondary,
  color: theme.color.lightest,
}));

export interface TagsFilterProps {
  api: API;
  indexJson: StoryIndex;
  updateQueryParams: (params: Record<string, string | null>) => void;
  initialSelectedTags?: Tag[];
}

export const TagsFilter = ({
  api,
  indexJson,
  updateQueryParams,
  initialSelectedTags = [],
}: TagsFilterProps) => {
  const [selectedTags, setSelectedTags] = useState(initialSelectedTags);
  const [expanded, setExpanded] = useState(false);
  const tagsActive = selectedTags.length > 0;

  useEffect(() => {
    api.experimental_setFilter(TAGS_FILTER, (item) => {
      if (selectedTags.length === 0) {
        return true;
      }

      return selectedTags.some((tag) => item.tags?.includes(tag));
    });

    const includeTags = selectedTags.join(',');
    updateQueryParams({ includeTags });
  }, [api, selectedTags, updateQueryParams]);

  const allTags = Object.values(indexJson.entries).reduce((acc, entry) => {
    entry.tags?.forEach((tag: Tag) => acc.add(tag));
    return acc;
  }, new Set<Tag>());

  const toggleTag = useCallback(
    (tag: string) => {
      if (selectedTags.includes(tag)) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      } else {
        setSelectedTags([...selectedTags, tag]);
      }
    },
    [selectedTags, setSelectedTags]
  );

  const handleToggleExpand = useCallback(
    (event: React.SyntheticEvent<Element, Event>): void => {
      event.preventDefault();
      setExpanded(!expanded);
    },
    [expanded, setExpanded]
  );

  return (
    <WithTooltip
      placement="bottom"
      trigger="click"
      onVisibleChange={setExpanded}
      tooltip={() => (
        <TagsFilterPanel
          allTags={Array.from(allTags)}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
        />
      )}
    >
      <Wrapper>
        <IconButton key="tags" title="Tag filters" active={tagsActive} onClick={handleToggleExpand}>
          <FilterIcon />
        </IconButton>
        {selectedTags.length > 0 && <Count>{selectedTags.length}</Count>}
      </Wrapper>
    </WithTooltip>
  );
};
