import React, { Fragment } from 'react';
import { addons, types } from 'storybook/internal/manager-api';

import { ADDON_ID } from './constants';
import { BackgroundSelector as BackgroundSelectorLegacy } from './legacy/BackgroundSelectorLegacy';
import { GridSelector as GridSelectorLegacy } from './legacy/GridSelectorLegacy';
import { BackgroundSelector } from './modern/BackgroundSelectorModern';
import { GridSelector } from './modern/GridSelectorModern';

addons.register(ADDON_ID, () => {
  addons.add(ADDON_ID, {
    title: 'Backgrounds',
    type: types.TOOL,
    match: ({ viewMode, tabId }) => !!(viewMode && viewMode.match(/^(story|docs)$/)) && !tabId,
    render: () =>
      FEATURES?.backgroundsStoryGlobals ? (
        <BackgroundSelector />
      ) : (
        <Fragment>
          <BackgroundSelectorLegacy />
          <GridSelectorLegacy />
        </Fragment>
      ),
  });
});
