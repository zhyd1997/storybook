import { addons } from 'storybook/internal/manager-api';
import { ADDON_ID } from './constants';

addons.register(ADDON_ID, async (api) => {
  await api.experimental_updateStatus(ADDON_ID, {
    'addons-vitest-addon--default': null,
    'addons-vitest-addon--success': { status: 'success', title: 'Success', description: '' },
    'addons-vitest-addon--pending': { status: 'pending', title: 'Pending', description: '' },
    'addons-vitest-addon--warn': { status: 'warn', title: 'Warn', description: '' },
    'addons-vitest-addon--error': { status: 'error', title: 'Error', description: '' },
    'addons-vitest-addon--unknown': { status: 'unknown', title: 'Unknown', description: '' },
  });
});
