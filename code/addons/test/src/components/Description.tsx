import React, { type ComponentProps, useEffect } from 'react';

import { Link as LinkComponent } from 'storybook/internal/components';
import { type TestProviderConfig, type TestProviderState } from 'storybook/internal/core-events';
import { styled } from 'storybook/internal/theming';

import { RelativeTime } from './RelativeTime';

export const Wrapper = styled.div(({ theme }) => ({
  fontSize: theme.typography.size.s1,
  color: theme.barTextColor,
}));

const PositiveText = styled.span(({ theme }) => ({
  color: theme.color.positiveText,
}));

export function Description({
  setIsModalOpen,
  state,
  ...props
}: {
  state: TestProviderConfig & TestProviderState;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
} & ComponentProps<typeof Wrapper>) {
  const isMounted = React.useRef(false);
  const [isUpdated, setUpdated] = React.useState(false);

  useEffect(() => {
    if (isMounted.current) {
      setUpdated(true);
      const timeout = setTimeout(setUpdated, 2000, false);
      return () => {
        clearTimeout(timeout);
      };
    }
    isMounted.current = true;
  }, [state.config]);

  const errorMessage = state.error?.message;

  let description: string | React.ReactNode = 'Not run';
  if (isUpdated) {
    description = <PositiveText>Settings updated</PositiveText>;
  } else if (state.running) {
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

  return <Wrapper {...props}>{description}</Wrapper>;
}
