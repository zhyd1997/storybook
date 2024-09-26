import React, { useCallback, useEffect } from 'react';

import { styled } from '@storybook/core/theming';
import type { API_FilterFunction, API_StatusUpdate, API_StatusValue } from '@storybook/types';

import {
  TESTING_MODULE_RUN_PROGRESS_RESPONSE,
  type TestingModuleRunProgressPayload,
  type TestingModuleRunResponsePayload,
} from '@storybook/core/core-events';
import {
  type API,
  type State,
  useStorybookApi,
  useStorybookState,
} from '@storybook/core/manager-api';
import { useChannel } from '@storybook/core/preview-api';

import { FilterToggle } from './FilterToggle';

const filterNone: API_FilterFunction = () => true;
const filterWarn: API_FilterFunction = ({ status = {} }) =>
  Object.values(status).some((value) => value?.status === 'warn');
const filterError: API_FilterFunction = ({ status = {} }) =>
  Object.values(status).some((value) => value?.status === 'error');
const filterBoth: API_FilterFunction = ({ status = {} }) =>
  Object.values(status).some((value) => value?.status === 'warn' || value?.status === 'error');

const getFilter = (showWarnings = false, showErrors = false) => {
  if (showWarnings && showErrors) {
    return filterBoth;
  }

  if (showWarnings) {
    return filterWarn;
  }

  if (showErrors) {
    return filterError;
  }
  return filterNone;
};

const Wrapper = styled.div({
  display: 'flex',
  gap: 5,
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
  const [showWarnings, setShowWarnings] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);

  const warnings = Object.values(status).filter((statusByAddonId) =>
    Object.values(statusByAddonId).some((value) => value?.status === 'warn')
  );
  const errors = Object.values(status).filter((statusByAddonId) =>
    Object.values(statusByAddonId).some((value) => value?.status === 'error')
  );
  const hasWarnings = warnings.length > 0;
  const hasErrors = errors.length > 0;

  const toggleWarnings = useCallback(() => setShowWarnings((shown) => !shown), []);
  const toggleErrors = useCallback(() => setShowErrors((shown) => !shown), []);

  useEffect(() => {
    const filter = getFilter(hasWarnings && showWarnings, hasErrors && showErrors);
    api.experimental_setFilter('sidebar-bottom-filter', filter);
  }, [api, hasWarnings, hasErrors, showWarnings, showErrors]);

  if (!hasWarnings && !hasErrors) {
    return null;
  }

  return (
    <Wrapper id="sidebar-bottom-wrapper">
      {hasErrors && (
        <FilterToggle
          id="errors-found-filter"
          active={showErrors}
          count={errors.length}
          label="Error"
          status="critical"
          onClick={toggleErrors}
        />
      )}
      {hasWarnings && (
        <FilterToggle
          id="warnings-found-filter"
          active={showWarnings}
          count={warnings.length}
          label="Warning"
          status="warning"
          onClick={toggleWarnings}
        />
      )}
    </Wrapper>
  );
};

export const SidebarBottom = () => {
  const api = useStorybookApi();
  const { status } = useStorybookState();

  useEffect(() => {
    api.getChannel()?.on(TESTING_MODULE_RUN_PROGRESS_RESPONSE, (data) => {
      if ('payload' in data) {
        // console.log('progress', data);
        // TODO clear statuses
        api.experimental_updateStatus('figure-out-id', processTestReport(data.payload));
      } else {
        // console.log('error', data);
      }
    });
  }, [api]);

  return <SidebarBottomBase api={api} status={status} />;
};
