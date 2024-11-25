import React, { type FC, Fragment, useCallback, useRef, useState } from 'react';

import { Button, ListItem } from 'storybook/internal/components';
import {
  TESTING_MODULE_CONFIG_CHANGE,
  type TestProviderConfig,
  type TestProviderState,
  type TestingModuleConfigChangePayload,
} from 'storybook/internal/core-events';
import type { API } from 'storybook/internal/manager-api';
import { styled, useTheme } from 'storybook/internal/theming';

import {
  AccessibilityIcon,
  EditIcon,
  EyeIcon,
  PlayHollowIcon,
  PointerHandIcon,
  ShieldIcon,
  StopAltHollowIcon,
} from '@storybook/icons';

import { type Config, type Details, TEST_PROVIDER_ID } from '../constants';
import { Description } from './Description';
import { GlobalErrorModal } from './GlobalErrorModal';
import { TestStatusIcon } from './TestStatusIcon';

const Container = styled.div({
  display: 'flex',
  flexDirection: 'column',
});

const Heading = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 2px',
  gap: 6,
});

const Info = styled.div({
  display: 'flex',
  flexDirection: 'column',
  marginLeft: 6,
});

const Title = styled.div<{ crashed?: boolean }>(({ crashed, theme }) => ({
  fontSize: theme.typography.size.s1,
  fontWeight: crashed ? 'bold' : 'normal',
  color: crashed ? theme.color.negativeText : theme.color.defaultText,
}));

const Actions = styled.div({
  display: 'flex',
  gap: 6,
});

const Extras = styled.div({
  marginBottom: 2,
});

const Checkbox = styled.input({
  margin: 0,
});

export const TestProviderRender: FC<{
  api: API;
  state: TestProviderConfig & TestProviderState<Details, Config>;
}> = ({ state, api }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();

  const title = state.crashed || state.failed ? 'Local tests failed' : 'Run local tests';
  const errorMessage = state.error?.message;

  const [config, changeConfig] = useConfig(
    state.id,
    state.config || { a11y: false, coverage: false },
    api
  );

  return (
    <Container>
      <Heading>
        <Info>
          <Title crashed={state.crashed} id="testing-module-title">
            {title}
          </Title>
          <Description errorMessage={errorMessage} setIsModalOpen={setIsModalOpen} state={state} />
        </Info>

        <Actions>
          <Button
            aria-label={`${isEditing ? 'Close' : 'Open'} settings for ${state.name}`}
            variant="ghost"
            padding="small"
            active={isEditing}
            onClick={() => setIsEditing(!isEditing)}
          >
            <EditIcon />
          </Button>
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
      </Heading>

      {isEditing ? (
        <Extras>
          <ListItem
            title="Component tests"
            icon={<PointerHandIcon color={theme.textMutedColor} />}
            right={<Checkbox type="checkbox" checked disabled />}
          />
          <ListItem
            as="label"
            title="Coverage"
            icon={<ShieldIcon color={theme.textMutedColor} />}
            right={
              <Checkbox
                type="checkbox"
                checked={config.coverage}
                onChange={() => changeConfig({ coverage: !config.coverage })}
              />
            }
          />
          <ListItem
            as="label"
            title="Accessibility"
            icon={<AccessibilityIcon color={theme.textMutedColor} />}
            right={
              <Checkbox
                type="checkbox"
                checked={config.a11y}
                onChange={() => changeConfig({ a11y: !config.a11y })}
              />
            }
          />
        </Extras>
      ) : (
        <Extras>
          <ListItem title="Component tests" icon={<TestStatusIcon status="positive" />} />
          <ListItem
            title="Coverage"
            icon={<TestStatusIcon percentage={60} status="warning" />}
            right={`60%`}
          />
          <ListItem title="Accessibility" icon={<TestStatusIcon status="negative" />} right={73} />
        </Extras>
      )}

      <GlobalErrorModal
        error={errorMessage}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onRerun={() => {
          setIsModalOpen(false);
          api.runTestProvider(TEST_PROVIDER_ID);
        }}
      />
    </Container>
  );
};

function useConfig(id: string, config: Config, api: API) {
  const data = useRef<Config>(config);
  data.current = config || {
    a11y: false,
    coverage: false,
  };

  const changeConfig = useCallback(
    (update: Partial<Config>) => {
      const newConfig = {
        ...data.current,
        ...update,
      };
      api.updateTestProviderState(id, {
        config: newConfig,
      });
      api.emit(TESTING_MODULE_CONFIG_CHANGE, {
        providerId: id,
        config: newConfig,
      } as TestingModuleConfigChangePayload);
    },
    [api, id]
  );

  return [data.current, changeConfig] as const;
}
