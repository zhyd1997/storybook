import React, { type ComponentProps, useEffect } from 'react';
import { useState } from 'react';

import ReactConfetti from 'react-confetti-boom';

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
    <ReactConfetti
      mode="fall"
      colors={colors}
      shapeSize={14}
      particleCount={particleCount}
      fadeOutHeight={10}
      {...confettiProps}
    />
  );
}
