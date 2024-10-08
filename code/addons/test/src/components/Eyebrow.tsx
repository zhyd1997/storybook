import React from 'react';

import { Link } from 'storybook/internal/components';
import { styled } from 'storybook/internal/theming';

const Wrapper = styled.div(
  ({ theme: { color, typography, background } }) => `
  text-align: start;
  padding: 6px 15px;
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

interface EyebrowProps {
  children: React.ReactNode;
  onDismiss?: () => void;
}

export const Eyebrow = ({ children, onDismiss, ...props }: EyebrowProps) => (
  <Wrapper {...props}>{children}</Wrapper>
);

export const DiscrepancyEyebrow = ({ browserTestStatus }: any) => {
  const message = `This component test passed in ${browserTestStatus === 'pass' ? 'browser' : 'CLI'}, but the ${browserTestStatus !== 'pass' ? 'browser' : 'CLI'} tests failed.`;

  return (
    <Eyebrow>
      {message} <Link href="foo">Learn what could cause this »</Link>
    </Eyebrow>
  );
};
