import { addons } from '@storybook/core/dist/manager-api';

import EVENTS, { ADDON_ID } from './constants';

addons.register(ADDON_ID, (api) => {
  api.on(EVENTS.REQUEST, ({ kind, name }) => {
    const id = api.storyId(kind, name);
    api.emit(EVENTS.RECEIVE, id);
  });
});
