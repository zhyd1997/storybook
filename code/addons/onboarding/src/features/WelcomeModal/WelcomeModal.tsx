import { styled } from '@storybook/theming';
import React, { useEffect, useState } from 'react';

import type { StepKey } from '../../Onboarding';
import { Button } from '../../components/Button/Button';
import { StorybookLogo } from './StorybookLogo';
import {
  ModalContentWrapper,
  SkipButton,
  StyledIcon,
  Title,
  Description,
  Background,
  Circle1,
  Circle2,
  Circle3,
  TopContent,
  ModalWrapper,
} from './WelcomeModal.styled';

interface WelcomeModalProps {
  step: StepKey;
  onProceed: () => void;
  onSkip: () => void;
  container?: HTMLElement;
}

export const WelcomeModal = ({ step, onProceed, onSkip, container }: WelcomeModalProps) => {
  const [rendered, setRendered] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (step !== '1:Intro') {
      setVisible(false);
      setTimeout(setRendered, 500, false);
    }
  }, [step]);

  if (!rendered) return null;

  return (
    <ModalWrapper width={540} height={430} defaultOpen container={container} visible={visible}>
      <ModalContentWrapper data-chromatic="ignore">
        <TopContent>
          <StorybookLogo />
          <Title>Welcome to Storybook</Title>
          <Description>
            Storybook helps you develop UI components faster. Learn the basics in a few simple
            steps.
          </Description>
          <Button style={{ marginTop: 4 }} onClick={onProceed}>
            Start your 3 minute tour
          </Button>
        </TopContent>
        <SkipButton onClick={onSkip}>
          Skip tour
          <StyledIcon />
        </SkipButton>
        <Background>
          <Circle1 />
          <Circle2 />
          <Circle3 />
        </Background>
      </ModalContentWrapper>
    </ModalWrapper>
  );
};
