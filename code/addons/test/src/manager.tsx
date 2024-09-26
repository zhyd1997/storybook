import React from 'react';

import { addons } from 'storybook/internal/manager-api';
import { Addon_TypesEnum } from 'storybook/internal/types';

import { PointerHandIcon } from '@storybook/icons';

import { ADDON_ID, TEST_PROVIDER_ID } from './constants';

addons.register(ADDON_ID, () => {
  addons.add(TEST_PROVIDER_ID, {
    type: Addon_TypesEnum.experimental_TEST_PROVIDER,
    icon: <PointerHandIcon />,
    title: 'Component tests',
    description: () => 'Not yet run',
  });
});
