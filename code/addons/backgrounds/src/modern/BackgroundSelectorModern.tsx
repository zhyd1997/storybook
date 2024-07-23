import React, { useState, memo, Fragment } from 'react';

import { useGlobals, useGlobalTypes } from 'storybook/internal/manager-api';
import { IconButton, WithTooltip, TooltipLinkList } from 'storybook/internal/components';

import { CircleIcon, GridIcon, PhotoIcon, RefreshIcon } from '@storybook/icons';
import { PARAM_KEY as KEY } from '../constants';
import type { Background } from '../types';

type Link = Parameters<typeof TooltipLinkList>['0']['links'][0];
type BackgroundMap = Record<string, Background>;

const emptyBackgroundMap: BackgroundMap = {};

export const BackgroundSelector = memo(function BackgroundSelector() {
  const globalTypes = useGlobalTypes();
  const [globals, updateGlobals, storyGlobals] = useGlobals();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const data = globals[KEY] || {};
  const backgroundMap = (globalTypes[KEY]?.options as any as BackgroundMap) || emptyBackgroundMap;
  const backgroundName: string = data.value;
  const isGrid = data.grid || false;

  const item = backgroundMap[backgroundName];
  const isLocked = !!storyGlobals?.[KEY];
  const length = Object.keys(backgroundMap).length;

  return (
    <Pure
      {...{
        length,
        backgroundMap,
        item,
        updateGlobals,
        backgroundName,
        setIsTooltipVisible,
        isLocked,
        isGrid,
        isTooltipVisible,
      }}
    />
  );
});

interface PureProps {
  length: number;
  backgroundMap: BackgroundMap;
  item: Background | undefined;
  updateGlobals: ReturnType<typeof useGlobals>['1'];
  backgroundName: string | undefined;
  setIsTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isLocked: boolean;
  isGrid: boolean;
  isTooltipVisible: boolean;
}

const Pure = memo(function PureTool(props: PureProps) {
  const {
    //
    item,
    length,
    updateGlobals,
    setIsTooltipVisible,
    backgroundMap,
    backgroundName,
    isLocked,
    isGrid,
    isTooltipVisible,
  } = props;
  return (
    <Fragment>
      <IconButton
        key="background"
        active={isGrid}
        disabled={isLocked}
        title="Apply a grid to the preview"
        onClick={() =>
          updateGlobals({
            [KEY]: { value: backgroundName, grid: !isGrid },
          })
        }
      >
        <GridIcon />
      </IconButton>

      {length > 0 ? (
        <WithTooltip
          placement="top"
          closeOnOutsideClick
          tooltip={({ onHide }) => {
            return (
              <TooltipLinkList
                links={[
                  ...(!!item
                    ? [
                        {
                          id: 'reset',
                          title: 'Reset background',
                          icon: <RefreshIcon />,
                          onClick: () => {
                            updateGlobals({
                              [KEY]: { value: undefined, grid: isGrid },
                            });
                            onHide();
                          },
                        },
                      ]
                    : []),
                  ...Object.entries(backgroundMap).map<Link>(([k, value]) => ({
                    id: k,
                    title: value.name,
                    icon: <CircleIcon color={value?.value || 'grey'} />,
                    active: k === backgroundName,
                    onClick: () => {
                      updateGlobals({
                        [KEY]: { value: k, grid: isGrid },
                      });
                      onHide();
                    },
                  })),
                ]}
              />
            );
          }}
          onVisibleChange={setIsTooltipVisible}
        >
          <IconButton
            disabled={isLocked}
            key="background"
            title="Change the background of the preview"
            active={!!item || isTooltipVisible}
          >
            <PhotoIcon />
          </IconButton>
        </WithTooltip>
      ) : null}
    </Fragment>
  );
});
