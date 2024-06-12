import React, { useCallback, useEffect, useState } from 'react';
import { ThemeProvider, convert } from '@storybook/theming';
import { addons, type API } from '@storybook/manager-api';

import { GuidedTour } from './features/GuidedTour/GuidedTour';
import { WelcomeModal } from './features/WelcomeModal/WelcomeModal';
import { WriteStoriesModal } from './features/WriteStoriesModal/WriteStoriesModal';
import { Confetti } from './components/Confetti/Confetti';
import { STORYBOOK_ADDON_ONBOARDING_CHANNEL } from './constants';
import { useGetProject } from './features/WriteStoriesModal/hooks/useGetProject';

type Step = '1:Controls' | '2:CreateStory' | '3:StoryCreated' | '4:StoriesList' | '5:NextSteps';

const theme = convert();

export default function App({ api }: { api: API }) {
  const [enabled, setEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [step, setStep] = useState<Step>('1:Controls');
  const { data: codeSnippets } = useGetProject();

  const skipOnboarding = useCallback(() => {
    // remove onboarding query parameter from current url
    const url = new URL(window.location.href);
    // @ts-expect-error (not strict)
    const path = decodeURIComponent(url.searchParams.get('path'));
    url.search = `?path=${path}&onboarding=false`;
    history.replaceState({}, '', url.href);
    api.setQueryParams({ onboarding: 'false' });
    setEnabled(false);
  }, [setEnabled, api]);

  useEffect(() => {
    setShowConfetti(step === '3:StoryCreated');
    api.emit(STORYBOOK_ADDON_ONBOARDING_CHANNEL, { step, type: 'telemetry' });
  }, [api, step]);

  useEffect(() => {
    console.log(api.getCurrentStoryData());
    const { id: storyId, refId } = api.getCurrentStoryData() || {};
    api.setQueryParams({ onboarding: 'true' });
    // make sure the initial state is set correctly:
    // 1. Selected story is primary button
    // 2. The addon panel is opened, in the bottom and the controls tab is selected
    if (storyId !== 'example-button--primary' || refId !== undefined) {
      try {
        api.selectStory('example-button--primary', undefined, { ref: undefined });
      } catch (e) {}
    }
  }, [api]);

  console.log({ enabled, step });

  if (!enabled) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      {showConfetti && (
        <Confetti
          numberOfPieces={800}
          recycle={false}
          tweenDuration={20000}
          onConfettiComplete={(confetti) => {
            confetti?.reset();
            setShowConfetti(false);
          }}
        />
      )}
      {step !== '5:NextSteps' && (
        <GuidedTour
          api={api}
          onFirstTourDone={() => {
            // setStep('3:WriteYourStory');
          }}
          codeSnippets={codeSnippets || undefined}
          onLastTourDone={() => {
            try {
              api.selectStory('configure-your-project--docs');
            } catch (e) {
              //
            }
            api.emit(STORYBOOK_ADDON_ONBOARDING_CHANNEL, {
              step: '6:FinishedOnboarding',
              type: 'telemetry',
            });
            skipOnboarding();
          }}
        />
      )}
    </ThemeProvider>
  );
}
