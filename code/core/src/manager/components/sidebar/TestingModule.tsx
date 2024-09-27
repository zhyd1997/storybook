import React, { type SyntheticEvent, useEffect, useRef, useState } from 'react';

import { Button } from '@storybook/core/components';
import { styled } from '@storybook/core/theming';

import {
  TESTING_MODULE_RUN_ALL_REQUEST,
  TESTING_MODULE_WATCH_MODE_REQUEST,
} from '@storybook/core/core-events';
import { type API } from '@storybook/core/manager-api';

const Position = styled.div({
  bottom: 0,
  zIndex: 20,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 12,
  paddingBottom: 12,
  width: '100%',
});

const Glow = styled.div(({ theme }) => ({
  color: theme.color.defaultText,
  fontSize: theme.typography.size.s2,
  lineHeight: '20px',
  width: '100%',
  overflow: 'hidden',
  borderRadius: theme.appBorderRadius,
  backgroundColor: 'rgb(226 232 240)',
  padding: '1px',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  transitionDuration: '0.15s',
}));

const Card = styled.div(({ theme }) => ({
  zIndex: 10,
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
});

const StatusButton = styled(Button)<{ status: 'negative' | 'warning' }>(({ status, theme }) => ({
  background: { negative: theme.background.negative, warning: theme.background.warning }[status],
  color: { negative: theme.color.negativeText, warning: theme.color.warningText }[status],
  minWidth: 28,
}));

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

const Title = styled.div({
  textWrap: 'nowrap',
});

const Description = styled.div(({ theme }) => ({
  fontSize: theme.typography.size.s1,
  color: theme.barTextColor,
}));

const Icon = styled.div(({ theme }) => ({
  color: theme.barTextColor,
  padding: '2px 6px',
}));

interface TestingModuleProps {
  api: API;
  testProviders: {
    providerId: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    watchable?: boolean;
  }[];
  errorCount: number;
  warningCount: number;
  errorsActive: boolean;
  warningsActive: boolean;
  toggleErrors: (e: SyntheticEvent) => void;
  toggleWarnings: (e: SyntheticEvent) => void;
}

export const TestingModule = ({
  api,
  testProviders,
  errorCount,
  warningCount,
  errorsActive,
  warningsActive,
  toggleErrors,
  toggleWarnings,
}: TestingModuleProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [maxHeight, setMaxHeight] = useState(500);
  const [watchMode, setWatchMode] = useState(false);

  useEffect(() => {
    setMaxHeight(contentRef.current?.offsetHeight || 500);
  }, []);

  const runAllTests = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  const toggleCollapsed = () => {
    setMaxHeight(contentRef.current?.offsetHeight || 500);
    setCollapsed(!collapsed);
  };

  return (
    <Position>
      <Glow>
        <Card>
          <Collapsible style={{ maxHeight: collapsed ? 0 : maxHeight }}>
            <Content ref={contentRef}>
              {testProviders.map(({ providerId, icon, title, description, watchable }) => (
                <TestProvider key={providerId}>
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
                        onClick={() => {
                          api.emit(TESTING_MODULE_WATCH_MODE_REQUEST, {
                            providerId,
                            watchMode: !watchMode,
                          });
                          setWatchMode(!watchMode);
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                            fill="currentColor"
                          ></path>
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M14 7l-.21.293C13.669 7.465 10.739 11.5 7 11.5S.332 7.465.21 7.293L0 7l.21-.293C.331 6.536 3.261 2.5 7 2.5s6.668 4.036 6.79 4.207L14 7zM2.896 5.302A12.725 12.725 0 001.245 7c.296.37.874 1.04 1.65 1.698C4.043 9.67 5.482 10.5 7 10.5c1.518 0 2.958-.83 4.104-1.802A12.72 12.72 0 0012.755 7c-.297-.37-.875-1.04-1.65-1.698C9.957 4.33 8.517 3.5 7 3.5c-1.519 0-2.958.83-4.104 1.802z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      padding="small"
                      onClick={() => api.emit(TESTING_MODULE_RUN_ALL_REQUEST, { providerId })}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.2 10.88L10.668 7 4.2 3.12v7.76zM3 2.414v9.174a.8.8 0 001.212.686l7.645-4.587a.8.8 0 000-1.372L4.212 1.727A.8.8 0 003 2.413z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </Button>
                  </Actions>
                </TestProvider>
              ))}
            </Content>
          </Collapsible>

          <Bar onClick={toggleCollapsed}>
            <Button variant="ghost" padding="small" onClick={runAllTests}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.2 10.88L11.668 7 5.2 3.12v7.76zM4 2.414v9.174a.8.8 0 001.212.686l7.645-4.587a.8.8 0 000-1.372L5.212 1.727A.8.8 0 004 2.413zM1.5 1.6a.6.6 0 01.6.6v9.6a.6.6 0 11-1.2 0V2.2a.6.6 0 01.6-.6z"
                  fill="currentColor"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M.963 1.932a.6.6 0 01.805-.268l1 .5a.6.6 0 01-.536 1.073l-1-.5a.6.6 0 01-.269-.805zM3.037 11.132a.6.6 0 01-.269.805l-1 .5a.6.6 0 01-.536-1.073l1-.5a.6.6 0 01.805.268z"
                  fill="currentColor"
                ></path>
              </svg>
              Run tests
            </Button>
            <div style={{ display: 'flex', gap: 6 }}>
              <CollapseToggle
                variant="ghost"
                padding="small"
                onClick={toggleCollapsed}
                id="testing-module-collapse-toggle"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    transform: collapsed ? 'none' : 'rotate(180deg)',
                    transition: 'transform 250ms',
                    willChange: 'auto',
                  }}
                >
                  <path
                    d="M3.854 9.104a.5.5 0 11-.708-.708l3.5-3.5a.5.5 0 01.708 0l3.5 3.5a.5.5 0 01-.708.708L7 5.957 3.854 9.104z"
                    fill="currentColor"
                  ></path>
                </svg>
              </CollapseToggle>

              {errorCount > 0 && (
                <StatusButton
                  id="errors-found-filter"
                  variant="ghost"
                  padding={errorCount < 10 ? 'medium' : 'small'}
                  status="negative"
                  active={errorsActive}
                  onClick={toggleErrors}
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
                  onClick={toggleWarnings}
                  aria-label="Show warnings"
                >
                  {warningCount < 100 ? warningCount : '99+'}
                </StatusButton>
              )}
            </div>
          </Bar>
        </Card>
      </Glow>
    </Position>
  );
};
