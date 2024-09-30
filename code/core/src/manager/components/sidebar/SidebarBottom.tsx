import React, { type SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';

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

import { throttle } from 'es-toolkit';

import { Notifications } from '../../container/Notifications';
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
  transition: 'height 250ms',
});

const Content = styled.div(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,

  '&:empty': {
    display: 'none',
  },

  '--sb-sidebar-bottom-card-background': theme.background.content,
  '--sb-sidebar-bottom-card-border': `1px solid ${theme.appBorderColor}`,
  '--sb-sidebar-bottom-card-radius': `${theme.appBorderRadius + 1}px`,
  '--sb-sidebar-bottom-card-shadow': `0 1px 2px 0 rgba(0, 0, 0, 0.05), 0px -5px 20px 10px ${theme.background.app}`,
}));

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
  const [warningsActive, setWarningsActive] = useState(false);
  const [errorsActive, setErrorsActive] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const resizeObserverCallback = useMemo(
    () => throttle((element) => setContentHeight(element.clientHeight || 0), 250),
    []
  );

  useEffect(() => {
    const wrapper = document.getElementById('sidebar-bottom');
    if (wrapper) {
      const resizeObserver = new ResizeObserver(() => resizeObserverCallback(wrapper));
      resizeObserver.observe(wrapper);
      return () => resizeObserver.disconnect();
    }
  }, [resizeObserverCallback]);

  const warnings = Object.values(status).filter((statusByAddonId) =>
    Object.values(statusByAddonId).some((value) => value?.status === 'warn')
  );
  const errors = Object.values(status).filter((statusByAddonId) =>
    Object.values(statusByAddonId).some((value) => value?.status === 'error')
  );
  const hasWarnings = warnings.length > 0;
  const hasErrors = errors.length > 0;

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
    <Wrapper id="sidebar-bottom-wrapper" style={{ height: contentHeight }}>
      <Content id="sidebar-bottom">
        <Notifications />
        <TestingModule
          {...{
            testProviders,
            errorCount: errors.length,
            errorsActive,
            setErrorsActive,
            warningCount: warnings.length,
            warningsActive,
            setWarningsActive,
            onRunTests,
            onSetWatchMode,
          }}
        />
      </Content>
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
