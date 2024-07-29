import React from 'react';
import { addons, types } from 'storybook/internal/manager-api';
import { ToolbarManagerLegacy } from './legacy/ToolbarManagerLegacy';
import { ADDON_ID } from './constants';
import { Tool } from './Tool';

addons.register(ADDON_ID, (api) =>
  addons.add(ADDON_ID, {
    title: ADDON_ID,
    type: types.TOOL,
    match: ({ tabId }) => !tabId,
    render: () =>
      FEATURES?.addonToolbarParameters ? <Tool api={api} /> : <ToolbarManagerLegacy />,
  })
);
