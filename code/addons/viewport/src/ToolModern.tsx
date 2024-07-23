import React, { useState, Fragment, useEffect, type FC } from 'react';

import { Global } from 'storybook/internal/theming';
import { IconButton, WithTooltip, TooltipLinkList } from 'storybook/internal/components';
import { useGlobals, type API, useGlobalTypes } from 'storybook/internal/manager-api';

import { BrowserIcon, GrowIcon, MobileIcon, TabletIcon, TransferIcon } from '@storybook/icons';
import { PARAM_KEY } from './constants';
import type { ViewportMap, Viewport } from './models';
import { registerShortcuts } from './shortcuts';
import {
  IconButtonWithLabel,
  IconButtonLabel,
  ActiveViewportSize,
  ActiveViewportLabel,
} from './ToolUtils';
import { responsiveViewport } from './responsiveViewport';

const iconsMap: Record<Viewport['type'], React.ReactNode> = {
  desktop: <BrowserIcon />,
  mobile: <MobileIcon />,
  tablet: <TabletIcon />,
  other: <Fragment />,
};

interface PureArgs {
  length: number;
  item: Viewport;
  updateGlobals: ReturnType<typeof useGlobals>['1'];
  viewportMap: ViewportMap;
  viewportName: any;
  setIsTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isLocked: boolean;
  isActive: boolean;
  viewportRotated: any;
  width: string;
  height: string;
}

type Link = Parameters<typeof TooltipLinkList>['0']['links'][0];

const emptyViewportMap: ViewportMap = {};

export const ViewportTool: FC<{ api: API }> = ({ api }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const globalTypes = useGlobalTypes();
  const [globals, updateGlobals, storyGlobals] = useGlobals();

  const isLocked = PARAM_KEY in storyGlobals;
  const viewportMap: ViewportMap = globalTypes?.viewport?.viewports || emptyViewportMap;
  const viewportName = globals?.viewport;
  const viewportRotated = globals?.viewportRotated;

  const item = viewportMap?.[viewportName] || responsiveViewport;
  const length = Object.keys(viewportMap).length;
  const isActive = isTooltipVisible || item !== responsiveViewport;

  useEffect(() => {
    registerShortcuts(api, globals.viewport, updateGlobals, Object.keys(viewportMap));
  }, [viewportMap, globals.viewport, updateGlobals, api]);

  if (item.styles === null || !viewportMap || length < 1) {
    return null;
  }

  if (typeof item.styles === 'function') {
    console.warn(
      'addon viewport no longer supports dynamic styles using a function, use css calc() instead'
    );
    return null;
  }

  const width = viewportRotated ? item.styles.height : item.styles.width;
  const height = viewportRotated ? item.styles.width : item.styles.height;

  return (
    <Pure
      {...{
        length,
        item,
        updateGlobals,
        viewportMap,
        viewportName,
        setIsTooltipVisible,
        isLocked,
        isActive,
        viewportRotated,
        width,
        height,
      }}
    />
  );
};

const Pure = React.memo(function PureTool(props: PureArgs) {
  const {
    item,
    length,
    viewportMap,
    viewportName,
    viewportRotated,
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
                      onClick: () => {
                        updateGlobals({
                          viewport: undefined,
                          viewportRotated: false,
                        });
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
                  updateGlobals({
                    viewport: k,
                    viewportRotated: false,
                  });
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
            updateGlobals({
              viewport: undefined,
              viewportRotated: false,
            });
          }}
        >
          <GrowIcon />
          {item !== responsiveViewport ? (
            <IconButtonLabel>
              {item.name} {viewportRotated ? `(L)` : `(P)`}
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
                updateGlobals({ viewportRotated: !viewportRotated });
              }}
            >
              <TransferIcon />
            </IconButton>
          ) : (
            <Fragment>/</Fragment>
          )}
          <ActiveViewportLabel title="Viewport height">
            {height.replace('px', '')}
          </ActiveViewportLabel>
        </ActiveViewportSize>
      ) : null}
    </Fragment>
  );
});
