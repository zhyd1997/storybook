import type { FC } from 'react';
import React from 'react';
import { useGlobalTypes } from 'storybook/internal/manager-api';
import { Separator } from 'storybook/internal/components';
import { ToolbarMenuList } from '../components/ToolbarMenuList';
import { normalizeArgType } from './normalize-toolbar-arg-type';
import type { ToolbarArgType } from '../types';

/**
 * A smart component for handling manager-preview interactions.
 */
export const ToolbarManagerLegacy: FC = () => {
  const globalTypes = useGlobalTypes();
  const globalIds = Object.keys(globalTypes).filter((id) => !!globalTypes[id].toolbar);

  if (!globalIds.length) {
    return null;
  }

  return (
    <>
      <Separator />
      {globalIds.map((id) => {
        const { toolbar, ...rest } = normalizeArgType(id, globalTypes[id] as ToolbarArgType);

        return <ToolbarMenuList key={id} id={id} {...rest} {...toolbar} />;
      })}
    </>
  );
};
