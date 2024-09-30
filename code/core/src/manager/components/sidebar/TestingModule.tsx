import React, { type SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@storybook/core/components';
import { keyframes, styled } from '@storybook/core/theming';
import {
  ChevronSmallUpIcon,
  EyeCloseIcon,
  EyeIcon,
  PlayAllHollowIcon,
  PlayHollowIcon,
  StopAltHollowIcon,
} from '@storybook/icons';

import { transparentize } from 'polished';

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

const Outline = styled.div<{ active: boolean }>(({ theme, active }) => ({
  position: 'relative',
  color: theme.color.defaultText,
  fontSize: theme.typography.size.s2,
  lineHeight: '20px',
  width: '100%',
  padding: 1,
  overflow: 'hidden',
  borderRadius: theme.appBorderRadius + 1,
  backgroundColor: 'rgb(226 232 240)',
  boxShadow: `0 1px 2px 0 rgba(0, 0, 0, 0.05), 0px -5px 20px 10px ${theme.background.app}`,
  transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  transitionDuration: '0.15s',

  '&:after': {
    content: '""',
    display: active ? 'block' : 'none',
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: 'calc(max(100vw, 100vh) * -0.5)',
    marginTop: 'calc(max(100vw, 100vh) * -0.5)',
    height: 'max(100vw, 100vh)',
    width: 'max(100vw, 100vh)',
    animation: `${spin} 3s linear infinite`,
    background:
      'conic-gradient(rgba(255, 71, 133, 0.2) 0deg, rgb(255, 71, 133) 0deg, transparent 160deg)',
    opacity: 1,
    willChange: 'auto',
  },
}));

const Card = styled.div(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  borderRadius: theme.appBorderRadius,
  backgroundColor: '#fff',

  '&:hover #testing-module-collapse-toggle': {
    opacity: 1,
  },
}));

const Collapsible = styled.div({
  overflow: 'hidden',
  transition: 'max-height 250ms',
  willChange: 'auto',
  boxShadow: 'inset 0 -1px 0 #e5e7eb',
});

const Content = styled.div({
  padding: '12px 6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

const Bar = styled.div({
  display: 'flex',
  width: '100%',
  cursor: 'pointer',
  userSelect: 'none',
  alignItems: 'center',
  justifyContent: 'space-between',
  overflow: 'hidden',
  padding: '6px',
});

const CollapseToggle = styled(Button)({
  opacity: 0,
  transition: 'opacity 250ms',
  willChange: 'auto',
  '&:focus, &:hover': {
    opacity: 1,
  },
});

const StatusButton = styled(Button)<{ status: 'negative' | 'warning' }>(
  { minWidth: 28 },
  ({ active, status, theme }) =>
    !active && {
      background: {
        negative: theme.background.negative,
        warning: theme.background.warning,
      }[status],
      color: {
        negative: theme.color.negativeText,
        warning: theme.color.warningText,
      }[status],
    }
);

const TestProvider = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 6,
});

const Info = styled.div({
  display: 'flex',
  gap: 6,
});

const Actions = styled.div({
  display: 'flex',
  gap: 6,
});

const Details = styled.div({
  display: 'flex',
  flexDirection: 'column',
});

const Title = styled.div({});

const Description = styled.div(({ theme }) => ({
  fontSize: theme.typography.size.s1,
  color: transparentize(0.25, theme.color.defaultText),
}));

const Icon = styled.div(({ theme }) => ({
  color: theme.barTextColor,
  padding: '2px 6px',
}));

interface TestingModuleProps {
  testProviders: {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    runnable?: boolean;
    running?: boolean;
    watchable?: boolean;
    watching?: boolean;
  }[];
  errorCount: number;
  errorsActive: boolean;
  setErrorsActive: (active: boolean) => void;
  warningCount: number;
  warningsActive: boolean;
  setWarningsActive: (active: boolean) => void;
  onRunTests: (providerId?: string) => void;
  onSetWatchMode: (providerId: string, watchMode: boolean) => void;
}

export const TestingModule = ({
  testProviders,
  errorCount,
  errorsActive,
  setErrorsActive,
  warningCount,
  warningsActive,
  setWarningsActive,
  onRunTests,
  onSetWatchMode,
}: TestingModuleProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [maxHeight, setMaxHeight] = useState(500);

  useEffect(() => {
    setMaxHeight(contentRef.current?.offsetHeight || 500);
  }, []);

  const runAllTests = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      onRunTests();
    },
    [onRunTests]
  );

  const toggleCollapsed = () => {
    setMaxHeight(contentRef.current?.offsetHeight || 500);
    setCollapsed(!collapsed);
  };

  const active = testProviders.some((tp) => tp.running);

  return (
    <Outline active={active}>
      <Card>
        <Collapsible style={{ maxHeight: collapsed ? 0 : maxHeight }}>
          <Content ref={contentRef}>
            {testProviders.map(
              ({ id, icon, title, description, runnable, running, watchable, watching }) => (
                <TestProvider key={id}>
                  <Info>
                    <Icon>{icon}</Icon>
                    <Details>
                      <Title>{title}</Title>
                      <Description>{description}</Description>
                    </Details>
                  </Info>
                  <Actions>
                    {watchable && (
                      <Button
                        variant="ghost"
                        padding="small"
                        onClick={() => onSetWatchMode(id, !watching)}
                      >
                        {watching ? <EyeCloseIcon /> : <EyeIcon />}
                      </Button>
                    )}
                    {runnable && (
                      <Button variant="ghost" padding="small" onClick={() => onRunTests(id)}>
                        {running ? <StopAltHollowIcon /> : <PlayHollowIcon />}
                      </Button>
                    )}
                  </Actions>
                </TestProvider>
              )
            )}
          </Content>
        </Collapsible>

        <Bar onClick={toggleCollapsed}>
          <Button variant="ghost" padding="small" onClick={runAllTests} disabled={active}>
            <PlayAllHollowIcon />
            {active ? 'Running...' : 'Run tests'}
          </Button>
          <Info>
            <CollapseToggle
              variant="ghost"
              padding="small"
              onClick={toggleCollapsed}
              id="testing-module-collapse-toggle"
              aria-label={collapsed ? 'Expand testing module' : 'Collapse testing module'}
            >
              <ChevronSmallUpIcon
                style={{
                  transform: collapsed ? 'none' : 'rotate(180deg)',
                  transition: 'transform 250ms',
                  willChange: 'auto',
                }}
              />
            </CollapseToggle>

            {errorCount > 0 && (
              <StatusButton
                id="errors-found-filter"
                variant="ghost"
                padding={errorCount < 10 ? 'medium' : 'small'}
                status="negative"
                active={errorsActive}
                onClick={(e: SyntheticEvent) => {
                  e.stopPropagation();
                  setErrorsActive(!errorsActive);
                }}
                aria-label="Show errors"
              >
                {errorCount < 100 ? errorCount : '99+'}
              </StatusButton>
            )}
            {warningCount > 0 && (
              <StatusButton
                id="warnings-found-filter"
                variant="ghost"
                padding={warningCount < 10 ? 'medium' : 'small'}
                status="warning"
                active={warningsActive}
                onClick={(e: SyntheticEvent) => {
                  e.stopPropagation();
                  setWarningsActive(!warningsActive);
                }}
                aria-label="Show warnings"
              >
                {warningCount < 100 ? warningCount : '99+'}
              </StatusButton>
            )}
          </Info>
        </Bar>
      </Card>
    </Outline>
  );
};
