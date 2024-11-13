import React, { type FC, type SyntheticEvent, useCallback } from 'react';

import { Button, type ListItem } from 'storybook/internal/components';
import { useStorybookApi } from 'storybook/internal/manager-api';
import { useTheme } from 'storybook/internal/theming';
import { type API_HashEntry, type Addon_TestProviderState } from 'storybook/internal/types';

import { PlayIcon } from '@storybook/icons';

import { TEST_PROVIDER_ID } from '../constants';
import type { TestResult } from '../node/reporter';

const ContextMenuItem: FC<{
  context: API_HashEntry;
  state: Addon_TestProviderState<{
    testResults: TestResult[];
  }>;
  ListItem: typeof ListItem;
}> = ({ context, state, ListItem }) => {
  const api = useStorybookApi();

  const onClick = useCallback(
    (event: SyntheticEvent) => {
      event.stopPropagation();
      api.runTestprovider(TEST_PROVIDER_ID, { selection: [context.id] });
    },
    [api]
  );

  const theme = useTheme();

  return (
    <ListItem
      title={'Component tests'}
      right={
        <Button variant="ghost" padding="small" disabled={state.crashed || state.running}>
          <PlayIcon fill={theme.barTextColor} />
        </Button>
      }
      center={state.running ? 'Running...' : 'Run tests'}
      onClick={onClick}
    />
  );
};
