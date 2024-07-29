import type { API_StatusObject, API_StatusState, API_StatusValue, StoryId } from '@storybook/types';
import { createContext, useContext } from 'react';
import type { ComponentEntry, GroupEntry, StoriesHash } from '../../../manager-api';
import { getDescendantIds } from '../../utils/tree';

export const StatusContext = createContext<{
  data?: StoriesHash;
  status?: API_StatusState;
  groupStatus?: Record<StoryId, API_StatusValue>;
}>({});

export const useStatusSummary = (item: GroupEntry | ComponentEntry) => {
  const { data, status, groupStatus } = useContext(StatusContext);
  if (
    !data ||
    !status ||
    !groupStatus ||
    !['pending', 'warn', 'error'].includes(groupStatus[item.id])
  ) {
    return { errors: {}, warnings: {} };
  }

  return getDescendantIds(data, item.id, false).reduce<{
    errors: Record<StoryId, API_StatusObject[]>;
    warnings: Record<StoryId, API_StatusObject[]>;
  }>(
    (acc, storyId) => {
      const statuses = Object.values(status[storyId] || {});
      const errs = statuses.filter((v) => v.status === 'error');
      const warns = statuses.filter((v) => v.status === 'warn');
      if (errs.length) acc.errors[storyId] = errs;
      if (warns.length) acc.warnings[storyId] = warns;
      return acc;
    },
    { errors: {}, warnings: {} }
  );
};
