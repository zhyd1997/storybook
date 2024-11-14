import React, { type FC, type SyntheticEvent, useCallback, useRef } from 'react';

import { Button, type ListItem } from 'storybook/internal/components';
import { useStorybookApi } from 'storybook/internal/manager-api';
import { useTheme } from 'storybook/internal/theming';
import { type API_HashEntry, type Addon_TestProviderState } from 'storybook/internal/types';

import { PlayHollowIcon, PlayIcon, StopAltHollowIcon } from '@storybook/icons';

import { TEST_PROVIDER_ID } from '../constants';
import type { TestResult } from '../node/reporter';

export const ContextMenuItem: FC<{
  context: API_HashEntry;
  state: Addon_TestProviderState<{
    testResults: TestResult[];
  }>;
  ListItem: typeof ListItem;
}> = ({ context, state, ListItem }) => {
  const api = useStorybookApi();
  const id = useRef(context.id);
  const cancelRun = useRef<() => void>();

  const Icon = state.running ? StopAltHollowIcon : PlayHollowIcon;

  id.current = context.id;

  const onClick = useCallback(
    (event: SyntheticEvent) => {
      event.stopPropagation();
      if (state.running) {
        cancelRun.current?.();
        return;
      } else {
        cancelRun.current = api.runTestProvider(TEST_PROVIDER_ID, { entryId: id.current });
      }
    },
    [api, state.running]
  );

  const theme = useTheme();

  return (
    <ListItem
      title={'Run local tests'}
      right={
        <Button onClick={onClick} variant="ghost" padding="small" disabled={state.crashed}>
          <Icon fill={theme.barTextColor} />
        </Button>
      }
    />
  );
};
