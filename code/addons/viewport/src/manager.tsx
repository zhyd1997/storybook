import * as React from 'react';
import { addons, types } from 'storybook/internal/manager-api';

import { ADDON_ID } from './constants';

// import { ViewportTool } from './Tool';
import { ViewportTool } from './ToolUsingGlobals';

addons.register(ADDON_ID, (api) => {
  addons.add(ADDON_ID, {
    title: 'viewport / media-queries',
    type: types.TOOL,
    match: ({ viewMode, tabId }) => viewMode === 'story' && !tabId,
    render: () => <ViewportTool api={api} />,
  });
});
