import type { ComponentProps } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import type { CallBackProps } from 'react-joyride';
import Joyride, { STATUS } from 'react-joyride';
import type { API } from '@storybook/manager-api';
import { SAVE_STORY_RESPONSE, UPDATE_STORY_ARGS } from '@storybook/core-events';
import { useTheme } from '@storybook/theming';

import { HighlightElement } from '../../components/HighlightElement/HighlightElement';
import { Confetti } from '../../components/Confetti/Confetti';
import { Tooltip } from './Tooltip';
import { SpanHighlight } from '../WriteStoriesModal/WriteStoriesModal.styled';
import type { CodeSnippets } from '../WriteStoriesModal/code/types';

type GuidedTourStep = ComponentProps<typeof Tooltip>['step'] & { key: string };

// const waitForControl = () => {
//   let pollInterval: ReturnType<typeof setTimeout>;
//   let abortTimer: ReturnType<typeof setTimeout>;
//   return [
//     Promise.race<void>([
//       new Promise((resolve) => {
//         if (document.getElementById('control-primary')) resolve();
//         else {
//           pollInterval = setInterval(() => {
//             if (document.getElementById('control-primary')) resolve();
//           }, 100);
//         }
//       }),
//       new Promise(
//         (_, reject) =>
//           (abortTimer = setTimeout(() => {
//             clearTimeout(pollInterval);
//             reject();
//           }, 5000))
//       ),
//     ]),
//     () => {
//       clearInterval(pollInterval);
//       clearTimeout(abortTimer);
//     },
//   ] as const;
// };

export function GuidedTour({
  api,
  isFinalStep,
  onFirstTourDone,
  onLastTourDone,
  codeSnippets,
}: {
  api: API;
  isFinalStep?: boolean;
  codeSnippets?: CodeSnippets;
  onFirstTourDone: () => void;
  onLastTourDone: () => void;
}) {
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const theme = useTheme();

  const [primaryControl, setPrimaryControl] = useState<HTMLElement | null>();
  const [saveFromControls, setSaveFromControls] = useState<HTMLElement | null>();
  const [createNewStoryForm, setCreateNewStoryForm] = useState<HTMLElement | null>();
  const [createdStory, setCreatedStory] = useState<{
    newStoryName: string;
    sourceFileName: string;
  } | null>();

  console.log({ stepIndex });

  useEffect(() => {
    return api.on(SAVE_STORY_RESPONSE, ({ payload, success }) => {
      if (!success) return;
      setStepIndex(2);
      setCreatedStory(payload);
      setTimeout(() => api.clearNotification('save-story-success'));
    });
  }, [api]);

  useEffect(() => {
    setStepIndex((index) => (index && index > 2 ? index : null));
    setTimeout(() => {
      setStepIndex((index) => {
        if (index && index > 1) return index;
        if (saveFromControls) return 1;
        if (primaryControl) return 0;
        return null;
      });
    }, 500);
  }, [primaryControl, saveFromControls, createNewStoryForm]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setPrimaryControl(document.getElementById('control-primary'));
      setSaveFromControls(document.getElementById('save-from-controls'));
      setCreateNewStoryForm(document.getElementById('create-new-story-form'));
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const steps: GuidedTourStep[] = [
    {
      key: '1:Controls',
      target: '#control-primary',
      title: 'Interactive story playground',
      content: (
        <>
          See how a story renders with different data and state without touching code.
          <br />
          <br />
          Try it out by toggling this button.
          <HighlightElement targetSelector="#control-primary" pulsating />
        </>
      ),
      placement: 'right',
      disableBeacon: true,
      disableOverlay: true,
      spotlightClicks: true,
    },
    {
      key: '2:SaveFromControls',
      target: 'button[aria-label="Create new story with these settings"]',
      title: 'Save your changes as a new story',
      content: (
        <>
          Storybook stories represent the key states of each of your components. After modifying a
          story, you can save your changes from here.
          <HighlightElement targetSelector="button[aria-label='Create new story with these settings']" />
        </>
      ),
      placement: 'top',
      disableBeacon: true,
      disableOverlay: true,
      spotlightClicks: true,
      styles: {
        tooltip: {
          width: 320,
        },
      },
    },
    {
      key: '3:StoryCreated',
      target: '#storybook-explorer-tree [data-selected="true"]',
      title: 'You just added your first story!',
      content: (
        <>
          Well done! You just created your first story from the Storybook manager. This
          automatically added a few lines of code in{' '}
          <SpanHighlight>{createdStory?.sourceFileName}</SpanHighlight>.
        </>
      ),
      placement: 'center',
      disableBeacon: true,
      styles: {
        tooltip: {
          width: 600,
        },
      },
    },
  ];

  // useEffect(() => {
  //   const [controlReady, cleanup] = waitForControl();
  //   controlReady.then(() => setReady(true)).catch(() => setReady(false));
  //   return cleanup;
  // }, []);

  if (stepIndex === null || steps[stepIndex]?.content === null) return null;

  console.log(steps[stepIndex]);

  return (
    <>
      {stepIndex === 2 && (
        <Confetti
          numberOfPieces={800}
          recycle={false}
          tweenDuration={20000}
          onConfettiComplete={(confetti) => confetti?.reset()}
        />
      )}
      <Joyride
        steps={steps}
        continuous
        stepIndex={stepIndex}
        spotlightPadding={0}
        disableCloseOnEsc
        disableOverlayClose
        disableScrolling
        callback={(data: CallBackProps) => {
          if (data.action === 'next') {
            setStepIndex(null);
            setTimeout(() => setStepIndex(data.index + 1), 500);
          }
        }}
        floaterProps={{
          disableAnimation: true,
          styles: {
            arrow: {
              length: 20,
              spread: 2,
            },
            floater: {
              filter:
                theme.base === 'light'
                  ? 'drop-shadow(0px 5px 5px rgba(0,0,0,0.05)) drop-shadow(0 1px 3px rgba(0,0,0,0.1))'
                  : 'drop-shadow(#fff5 0px 0px 0.5px) drop-shadow(#fff5 0px 0px 0.5px)',
            },
          },
        }}
        tooltipComponent={Tooltip}
        styles={{
          overlay: {
            mixBlendMode: 'unset',
            backgroundColor: steps[stepIndex]?.target === 'body' ? 'rgba(27, 28, 29, 0.2)' : 'none',
          },
          spotlight: {
            backgroundColor: 'none',
            border: `solid 2px ${theme.color.secondary}`,
            boxShadow: '0px 0px 0px 9999px rgba(27, 28, 29, 0.2)',
          },
          tooltip: {
            width: 280,
            color: theme.color.lightest,
            background: theme.base === 'dark' ? '#292A2C' : theme.color.secondary,
          },
          options: {
            zIndex: 9998,
            primaryColor: theme.color.secondary,
            arrowColor: theme.base === 'dark' ? '#292A2C' : theme.color.secondary,
          },
        }}
      />
    </>
  );
}
