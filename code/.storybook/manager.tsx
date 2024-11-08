import React, { useEffect, useState } from 'react';

import { IconButton } from 'storybook/internal/components';
import { addons } from 'storybook/internal/manager-api';
import { Addon_TypesEnum } from 'storybook/internal/types';

import { AdminIcon } from '@storybook/icons';

import { startCase } from 'es-toolkit/compat';

addons.setConfig({
  sidebar: {
    renderLabel: ({ name, type }) => (type === 'story' ? name : startCase(name)),
  },
});

// // TEMP, to demo new api
// addons.add('my-addon', {
//   type: Addon_TypesEnum.experimental_CONTEXT,
//   render(props) {
//     console.log({ props });

//     if (props.entry.type === 'docs') {
//       return null;
//     }

//     return <div>My Test</div>;
//   },
// });

// TEMP, to set status once, to have the status bullet show up
addons.register('my-addon', (api) => {
  addons.add('my-addon2', {
    type: Addon_TypesEnum.TOOL,
    title: 'My Addon 2',
    render() {
      return (
        <IconButton
          onClick={() => {
            const x = api.getCurrentStoryData();
            api.experimental_updateStatus('my-addon', {
              [x.id]: {
                description: 'This is a test',
                status: 'error',
                title: 'Test',
                data: { foo: 'bar' },
              },
            });
          }}
        >
          <AdminIcon />
        </IconButton>
      );
    },
  });
});
