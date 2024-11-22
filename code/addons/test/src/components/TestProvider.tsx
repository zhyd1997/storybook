import React, { useState } from 'react';

import { Button, Link as LinkComponent } from 'storybook/internal/components';
import {
  TESTING_MODULE_RUN_ALL_REQUEST,
  type TestProviderConfig,
} from 'storybook/internal/core-events';
import type { API } from 'storybook/internal/manager-api';
import { styled } from 'storybook/internal/theming';

import { EyeIcon, PlayHollowIcon, StopAltHollowIcon } from '@storybook/icons';
import type { Addon_TestProviderState } from '@storybook/types';

import { TEST_PROVIDER_ID } from '../constants';
import type { Details } from '../manager';
import { GlobalErrorModal } from './GlobalErrorModal';
import { RelativeTime } from './RelativeTime';

const Info = styled.div({
  display: 'flex',
  flexDirection: 'column',
  marginLeft: 6,
});

const SidebarContextMenuTitle = styled.div<{ crashed?: boolean }>(({ crashed, theme }) => ({
  fontSize: theme.typography.size.s1,
  fontWeight: crashed ? 'bold' : 'normal',
  color: crashed ? theme.color.negativeText : theme.color.defaultText,
}));

const Description = styled.div(({ theme }) => ({
  fontSize: theme.typography.size.s1,
  color: theme.barTextColor,
}));

const Actions = styled.div({
  display: 'flex',
  gap: 6,
});

interface TestProviderProps {
  api: API;
  state: TestProviderConfig & Addon_TestProviderState<Details>;
}

export const TestProvider = ({ api, state }: TestProviderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const title = state.crashed || state.failed ? 'Component tests failed' : 'Component tests';
  const errorMessage = state.error?.message;
  let description: string | React.ReactNode = 'Not run';

  if (state.running) {
    description = state.progress
      ? `Testing... ${state.progress.numPassedTests}/${state.progress.numTotalTests}`
      : 'Starting...';
  } else if (state.failed && !errorMessage) {
    description = '';
  } else if (state.crashed || (state.failed && errorMessage)) {
    description = (
      <>
        <LinkComponent
          isButton
          onClick={() => {
            setIsModalOpen(true);
          }}
        >
          {state.error?.name || 'View full error'}
        </LinkComponent>
      </>
    );
  } else if (state.progress?.finishedAt) {
    description = (
      <RelativeTime
        timestamp={new Date(state.progress.finishedAt)}
        testCount={state.progress.numTotalTests}
      />
    );
  } else if (state.watching) {
    description = 'Watching for file changes';
  }

  return (
    <>
      <Info>
        <SidebarContextMenuTitle crashed={state.crashed} id="testing-module-title">
          {title}
        </SidebarContextMenuTitle>
        <Description id="testing-module-description">{description}</Description>
      </Info>

      <Actions>
        {state.watchable && (
          <Button
            aria-label={`${state.watching ? 'Disable' : 'Enable'} watch mode for ${state.name}`}
            variant="ghost"
            padding="small"
            active={state.watching}
            onClick={() => api.setTestProviderWatchMode(state.id, !state.watching)}
            disabled={state.crashed || state.running}
          >
            <EyeIcon />
          </Button>
        )}
        {state.runnable && (
          <>
            {state.running && state.cancellable ? (
              <Button
                aria-label={`Stop ${state.name}`}
                variant="ghost"
                padding="small"
                onClick={() => api.cancelTestProvider(state.id)}
                disabled={state.cancelling}
              >
                <StopAltHollowIcon />
              </Button>
            ) : (
              <Button
                aria-label={`Start ${state.name}`}
                variant="ghost"
                padding="small"
                onClick={() => api.runTestProvider(state.id)}
                disabled={state.crashed || state.running}
              >
                <PlayHollowIcon />
              </Button>
            )}
          </>
        )}
      </Actions>

      <GlobalErrorModal
        error={errorMessage}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onRerun={() => {
          setIsModalOpen(false);
          api.getChannel().emit(TESTING_MODULE_RUN_ALL_REQUEST, { providerId: TEST_PROVIDER_ID });
        }}
      />
    </>
  );
};
