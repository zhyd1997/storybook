import React, { type FC, Fragment, useState } from 'react';

import { Button } from 'storybook/internal/components';
import {
  TESTING_MODULE_RUN_ALL_REQUEST,
  type TestProviderConfig,
  type TestProviderState,
} from 'storybook/internal/core-events';
import type { API } from 'storybook/internal/manager-api';
import { styled } from 'storybook/internal/theming';

import { EyeIcon, PlayHollowIcon, StopAltHollowIcon } from '@storybook/icons';

import { type Details, TEST_PROVIDER_ID } from '../constants';
import { Description } from './Description';
import { GlobalErrorModal } from './GlobalErrorModal';

const Info = styled.div({
  display: 'flex',
  flexDirection: 'column',
  marginLeft: 6,
});

const Title2 = styled.div<{ crashed?: boolean }>(({ crashed, theme }) => ({
  fontSize: theme.typography.size.s1,
  fontWeight: crashed ? 'bold' : 'normal',
  color: crashed ? theme.color.negativeText : theme.color.defaultText,
}));

export const DescriptionStyle = styled.div(({ theme }) => ({
  fontSize: theme.typography.size.s1,
  color: theme.barTextColor,
}));

const Actions = styled.div({
  display: 'flex',
  gap: 6,
});

const Head = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 6,
});

export const TestProviderRender: FC<{
  api: API;
  state: TestProviderConfig & TestProviderState<Details>;
}> = ({ state, api }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const title = state.crashed || state.failed ? 'Component tests failed' : 'Component tests';
  const errorMessage = state.error?.message;
  return (
    <Fragment>
      <Head>
        <Info>
          <Title2 crashed={state.crashed} id="testing-module-title">
            {title}
          </Title2>
          <Description errorMessage={errorMessage} setIsModalOpen={setIsModalOpen} state={state} />
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
      </Head>

      {!state.details.editing ? (
        <Fragment>
          {state.details?.options?.a11y ? <div>A11Y</div> : null}
          {state.details?.options?.coverage ? <div>COVERAGE</div> : null}
        </Fragment>
      ) : (
        <Fragment>
          <div>EDITING A11Y</div>
          <div>EDITING COVERAGE</div>
        </Fragment>
      )}

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
    </Fragment>
  );
};
