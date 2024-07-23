import React, { useState, Fragment, useEffect, type FC } from 'react';

import { Global } from 'storybook/internal/theming';
import { IconButton, WithTooltip, TooltipLinkList, P } from 'storybook/internal/components';
import { useGlobals, type API, useGlobalTypes } from 'storybook/internal/manager-api';

import { GrowIcon, RefreshIcon, TransferIcon } from '@storybook/icons';
import { PARAM_KEY } from './constants';
import { registerShortcuts } from './shortcuts';
import {
  IconButtonWithLabel,
  IconButtonLabel,
  ActiveViewportSize,
  ActiveViewportLabel,
  iconsMap,
  emptyViewportMap,
} from './utils';
import { responsiveViewport } from './responsiveViewport';
import type { Viewport, ViewportMap } from './models/Viewport';

interface PureProps {
  item: Viewport;
  updateGlobals: ReturnType<typeof useGlobals>['1'];
  setIsTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>;
  viewportMap: ViewportMap;
  viewportName: any;
  isLocked: boolean;
  isActive: boolean;
  isRotated: any;
  width: string;
  height: string;
}

type Link = Parameters<typeof TooltipLinkList>['0']['links'][0];

export const ViewportTool: FC<{ api: API }> = ({ api }) => {
  const globalTypes = useGlobalTypes();
  const [globals, updateGlobals, storyGlobals] = useGlobals();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const viewportMap = (globalTypes[PARAM_KEY]?.options as any as ViewportMap) || emptyViewportMap;
  const data = globals?.[PARAM_KEY] || {};
  const viewportName: string = data.value;
  const isRotated: boolean = data.isRotated;

  const item = viewportMap[viewportName] || responsiveViewport;
  const isActive = isTooltipVisible || item !== responsiveViewport;
  const isLocked = PARAM_KEY in storyGlobals;

  const length = Object.keys(viewportMap).length;

  useEffect(() => {
    registerShortcuts(api, viewportName, updateGlobals, Object.keys(viewportMap));
  }, [viewportMap, viewportName, updateGlobals, api]);

  if (item.styles === null || !viewportMap || length < 1) {
    return null;
  }

  if (typeof item.styles === 'function') {
    console.warn(
      'addon viewport no longer supports dynamic styles using a function, use css calc() instead'
    );
    return null;
  }

  const width = isRotated ? item.styles.height : item.styles.width;
  const height = isRotated ? item.styles.width : item.styles.height;

  return (
    <Pure
      {...{
        item,
        updateGlobals,
        viewportMap,
        viewportName,
        isRotated: isRotated,
        setIsTooltipVisible,
        isLocked,
        isActive,
        width,
        height,
      }}
    />
  );
};

const Pure = React.memo(function PureTool(props: PureProps) {
  const {
    item,
    viewportMap,
    viewportName,
    isRotated,
    updateGlobals,
    setIsTooltipVisible,
    isLocked,
    isActive,
    width,
    height,
  } = props;
  return (
    <Fragment>
      <WithTooltip
        placement="bottom"
        tooltip={({ onHide }) => (
          <TooltipLinkList
            links={[
              ...(length > 0 && item !== responsiveViewport
                ? [
                    {
                      id: 'reset',
                      title: 'Reset viewport',
                      icon: <RefreshIcon />,
                      onClick: () => {
                        updateGlobals({ [PARAM_KEY]: { value: undefined, isRotated: false } });
                        onHide();
                      },
                    },
                  ]
                : []),
              ...Object.entries(viewportMap).map<Link>(([k, value]) => ({
                id: k,
                title: value.name,
                icon: iconsMap[value.type],
                active: k === viewportName,
                onClick: () => {
                  updateGlobals({ [PARAM_KEY]: { value: k, isRotated: false } });
                  onHide();
                },
              })),
            ]}
          />
        )}
        closeOnOutsideClick
        onVisibleChange={setIsTooltipVisible}
      >
        <IconButtonWithLabel
          disabled={isLocked}
          key="viewport"
          title="Change the size of the preview"
          active={isActive}
          onDoubleClick={() => {
            updateGlobals({ [PARAM_KEY]: { value: undefined, isRotated: false } });
          }}
        >
          <GrowIcon />
          {item !== responsiveViewport ? (
            <IconButtonLabel>
              {item.name} {isRotated ? `(L)` : `(P)`}
            </IconButtonLabel>
          ) : null}
        </IconButtonWithLabel>
      </WithTooltip>

      <Global
        styles={{
          [`iframe[data-is-storybook="true"]`]: { width, height },
        }}
      />

      {item !== responsiveViewport ? (
        <ActiveViewportSize>
          <ActiveViewportLabel title="Viewport width">
            {width.replace('px', '')}
          </ActiveViewportLabel>
          {!isLocked ? (
            <IconButton
              key="viewport-rotate"
              title="Rotate viewport"
              onClick={() => {
                updateGlobals({ [PARAM_KEY]: { value: viewportName, isRotated: !isRotated } });
              }}
            >
              <TransferIcon />
            </IconButton>
          ) : null}
          <ActiveViewportLabel title="Viewport height">
            {height.replace('px', '')}
          </ActiveViewportLabel>
        </ActiveViewportSize>
      ) : null}
    </Fragment>
  );
});
