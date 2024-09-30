import React, { type SyntheticEvent, useCallback, useEffect } from 'react';

import { styled } from '@storybook/core/theming';
import { ContrastIcon, PointerHandIcon } from '@storybook/icons';
import type { API_FilterFunction, API_StatusUpdate, API_StatusValue } from '@storybook/types';

import {
  TESTING_MODULE_RUN_ALL_REQUEST,
  TESTING_MODULE_RUN_PROGRESS_RESPONSE,
  TESTING_MODULE_WATCH_MODE_REQUEST,
  type TestingModuleRunResponsePayload,
} from '@storybook/core/core-events';
import {
  type API,
  type State,
  useStorybookApi,
  useStorybookState,
} from '@storybook/core/manager-api';

import { TestingModule } from './TestingModule';

const filterNone: API_FilterFunction = () => true;
const filterWarn: API_FilterFunction = ({ status = {} }) =>
  Object.values(status).some((value) => value?.status === 'warn');
const filterError: API_FilterFunction = ({ status = {} }) =>
  Object.values(status).some((value) => value?.status === 'error');
const filterBoth: API_FilterFunction = ({ status = {} }) =>
  Object.values(status).some((value) => value?.status === 'warn' || value?.status === 'error');

const getFilter = (warningsActive = false, errorsActive = false) => {
  if (warningsActive && errorsActive) {
    return filterBoth;
  }

  if (warningsActive) {
    return filterWarn;
  }

  if (errorsActive) {
    return filterError;
  }
  return filterNone;
};

const Wrapper = styled.div({
  width: '100%',
  display: 'flex',
  gap: 6,
});

interface SidebarBottomProps {
  api: API;
  status: State['status'];
}

const statusMap: Record<any['status'], API_StatusValue> = {
  failed: 'error',
  passed: 'success',
  pending: 'pending',
};

function processTestReport(payload: TestingModuleRunResponsePayload) {
  const result: API_StatusUpdate = {};

  payload.testResults.forEach((testResult: any) => {
    testResult.results.forEach(({ storyId, status, failureMessages }: any) => {
      if (storyId) {
        result[storyId] = {
          title: 'Vitest',
          status: statusMap[status],
          description: failureMessages?.length ? failureMessages.join('\n') : '',
        };
      }
    });
  });

  return result;
}

export const SidebarBottomBase = ({ api, status = {} }: SidebarBottomProps) => {
  const [warningsActive, setWarningsActive] = React.useState(false);
  const [errorsActive, setErrorsActive] = React.useState(false);

  const warnings = Object.values(status).filter((statusByAddonId) =>
    Object.values(statusByAddonId).some((value) => value?.status === 'warn')
  );
  const errors = Object.values(status).filter((statusByAddonId) =>
    Object.values(statusByAddonId).some((value) => value?.status === 'error')
  );
  const hasWarnings = warnings.length > 0;
  const hasErrors = errors.length > 0;

  const toggleWarnings = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
    setWarningsActive((active) => !active);
  }, []);
  const toggleErrors = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
    setErrorsActive((active) => !active);
  }, []);
  const onRunTests = useCallback(
    (providerId?: string) => {
      api.emit(TESTING_MODULE_RUN_ALL_REQUEST, { providerId });
    },
    [api]
  );
  const onSetWatchMode = useCallback(
    (providerId: string, watchMode: boolean) => {
      api.emit(TESTING_MODULE_WATCH_MODE_REQUEST, { providerId, watchMode });
    },
    [api]
  );

  useEffect(() => {
    const filter = getFilter(hasWarnings && warningsActive, hasErrors && errorsActive);
    api.experimental_setFilter('sidebar-bottom-filter', filter);
  }, [api, hasWarnings, hasErrors, warningsActive, errorsActive]);

  const testProviders = [
    {
      id: 'component-tests',
      title: 'Component tests',
      description: 'Ran 2 seconds ago',
      icon: <PointerHandIcon />,
      runnable: true,
      watchable: true,
    },
    {
      id: 'visual-tests',
      title: 'Visual tests',
      description: 'Not run',
      icon: <ContrastIcon />,
      runnable: true,
    },
  ];

  if (!hasWarnings && !hasErrors && !testProviders.length) {
    return null;
  }

  return (
    <Wrapper id="sidebar-bottom-wrapper">
      <TestingModule
        {...{
          testProviders,
          errorCount: errors.length,
          warningCount: warnings.length,
          errorsActive,
          warningsActive,
          toggleErrors,
          toggleWarnings,
          onRunTests,
          onSetWatchMode,
        }}
      />
    </Wrapper>
  );
};

export const SidebarBottom = () => {
  const api = useStorybookApi();
  const { status } = useStorybookState();

  useEffect(() => {
    api.getChannel()?.on(TESTING_MODULE_RUN_PROGRESS_RESPONSE, (data) => {
      if ('payload' in data) {
        console.log('progress', data);
        // TODO clear statuses
        api.experimental_updateStatus('figure-out-id', processTestReport(data.payload));
      } else {
        // console.log('error', data);
      }
    });
  }, [api]);

  return <SidebarBottomBase api={api} status={status} />;
};
