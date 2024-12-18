import React, { type ComponentProps, useEffect } from 'react';
import { useState } from 'react';

import { styled } from 'storybook/internal/theming';

import ReactConfetti from 'react-confetti-boom';

const Wrapper = styled.div({
  zIndex: 9999,
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
});

export function Confetti({
  timeToFade = 5000,
  colors = ['#CA90FF', '#FC521F', '#66BF3C', '#FF4785', '#FFAE00', '#1EA7FD'],
  ...confettiProps
}: ComponentProps<typeof ReactConfetti> & { timeToFade?: number }) {
  const [particleCount, setParticleCount] = useState(42);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParticleCount(0);
    }, timeToFade);

    return () => {
      clearTimeout(timeout);
    };
  }, [timeToFade]);

  return (
    <Wrapper>
      <ReactConfetti
        mode="fall"
        colors={colors}
        shapeSize={14}
        particleCount={particleCount}
        fadeOutHeight={10}
        {...confettiProps}
      />
    </Wrapper>
  );
}
