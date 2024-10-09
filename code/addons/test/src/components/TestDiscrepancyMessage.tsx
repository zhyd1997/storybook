import React from 'react';

import { Link } from 'storybook/internal/components';
import { useStorybookApi } from 'storybook/internal/manager-api';
import { styled } from 'storybook/internal/theming';

import { CallStates } from '@storybook/instrumenter';

import { DOCUMENTATION_LINK } from '../constants';

const Wrapper = styled.div(
  ({ theme: { color, typography, background } }) => `
  text-align: start;
  padding: 11px 15px;
  font-size: ${typography.size.s2}px;
  font-weight: ${typography.weight.regular};
  line-height: 1rem;
  background: ${background.app};
  border-bottom: 1px solid ${color.border};
  color: ${color.defaultText};
  background-clip: padding-box;
  position: relative;
  code {
    font-size: ${typography.size.s1 - 1}px;
    color: inherit;
    margin: 0 0.2em;
    padding: 0 0.2em;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 2px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  }
`
);

interface TestDiscrepancyMessageProps {
  browserTestStatus: CallStates;
}
export const TestDiscrepancyMessage = ({ browserTestStatus }: TestDiscrepancyMessageProps) => {
  const api = useStorybookApi();
  const docsUrl = api.getDocsUrl({
    subpath: DOCUMENTATION_LINK,
    versioned: true,
    renderer: true,
  });
  const message = `This component test passed in ${browserTestStatus === CallStates.DONE ? 'this browser' : 'CLI'}, but the tests failed in ${browserTestStatus === CallStates.ERROR ? 'this browser' : 'CLI'}.`;

  return (
    <Wrapper>
      {message}{' '}
      <Link href={docsUrl} target="_blank" withArrow>
        Learn what could cause this
      </Link>
    </Wrapper>
  );
};
