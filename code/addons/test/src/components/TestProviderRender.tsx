import React, { type FC, useCallback, useMemo, useRef, useState } from 'react';

import { Button, ListItem } from 'storybook/internal/components';
import {
  TESTING_MODULE_CONFIG_CHANGE,
  type TestProviderConfig,
  type TestProviderState,
} from 'storybook/internal/core-events';
import { addons } from 'storybook/internal/manager-api';
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

import { isEqual } from 'es-toolkit';
import { debounce } from 'es-toolkit/compat';

// Relatively importing from a11y to get the ADDON_ID
import { ADDON_ID as A11Y_ADDON_ID } from '../../../a11y/src/constants';
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
  '&:enabled': {
    cursor: 'pointer',
  },
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
  const coverage = state.details?.coverage;

  const isA11yAddon = addons.experimental_getRegisteredAddons().includes(A11Y_ADDON_ID);

  const [config, updateConfig] = useConfig(
    api,
    state.id,
    state.config || { a11y: false, coverage: false }
  );

  const a11yResults = useMemo(() => {
    if (!isA11yAddon) {
      return [];
    }

    return state.details?.testResults?.flatMap((result) =>
      result.results.map((r) => r.reports.find((report) => report.type))
    );
  }, [isA11yAddon, state.details?.testResults]);

  const a11yStatus = useMemo<'positive' | 'warning' | 'negative' | 'unknown'>(() => {
    if (!isA11yAddon || config.a11y === false) {
      return 'unknown';
    }

    if (!a11yResults) {
      return 'unknown';
    }

    const failed = a11yResults.some((result) => result?.status === 'failed');
    const warning = a11yResults.some((result) => result?.status === 'warning');

    if (failed) {
      return 'negative';
    } else if (warning) {
      return 'warning';
    }

    return 'positive';
  }, [a11yResults, isA11yAddon, config.a11y]);

  const a11yNotPassedAmount = a11yResults?.filter(
    (result) => result?.status === 'failed' || result?.status === 'warning'
  ).length;

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
            as="label"
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
                checked={state.watching ? false : config.coverage}
                disabled={state.watching}
                onChange={() => updateConfig({ coverage: !config.coverage })}
              />
            }
          />
          {isA11yAddon && (
            <ListItem
              as="label"
              title="Accessibility"
              icon={<AccessibilityIcon color={theme.textMutedColor} />}
              right={
                <Checkbox
                  type="checkbox"
                  checked={config.a11y}
                  onChange={() => updateConfig({ a11y: !config.a11y })}
                />
              }
            />
          )}
        </Extras>
      ) : (
        <Extras>
          <ListItem
            title="Component tests"
            icon={<TestStatusIcon status="positive" aria-label="status: passed" />}
          />
          {coverage ? (
            <ListItem
              title="Coverage"
              href={'/coverage/index.html'}
              // @ts-expect-error ListItem doesn't include all anchor attributes in types, but it is an achor element
              target="_blank"
              icon={
                <TestStatusIcon
                  percentage={coverage.percentage}
                  status={coverage.status}
                  aria-label={`status: ${coverage.status}`}
                />
              }
              right={`${coverage.percentage}%`}
            />
          ) : (
            <ListItem
              title="Coverage"
              icon={<TestStatusIcon status="unknown" aria-label={`status: unknown`} />}
            />
          )}
          {isA11yAddon && (
            <ListItem
              title="Accessibility"
              icon={<TestStatusIcon status={a11yStatus} aria-label={`status: ${a11yStatus}`} />}
              right={a11yNotPassedAmount || null}
            />
          )}
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

function useConfig(api: API, providerId: string, initialConfig: Config) {
  const [currentConfig, setConfig] = useState<Config>(initialConfig);
  const lastConfig = useRef(initialConfig);

  const saveConfig = useCallback(
    debounce((config: Config) => {
      if (!isEqual(config, lastConfig.current)) {
        api.updateTestProviderState(providerId, { config });
        api.emit(TESTING_MODULE_CONFIG_CHANGE, { providerId, config });
        lastConfig.current = config;
      }
    }, 500),
    [api, providerId]
  );

  const updateConfig = useCallback(
    (update: Partial<Config>) => {
      setConfig((value) => {
        const updated = { ...value, ...update };
        saveConfig(updated);
        return updated;
      });
    },
    [saveConfig]
  );

  return [currentConfig, updateConfig] as const;
}
