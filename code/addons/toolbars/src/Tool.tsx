import type { FC } from 'react';
import React from 'react';
import { useParameter, type API } from 'storybook/internal/manager-api';
import { Separator } from 'storybook/internal/components';
import { ToolbarMenuList, type ToolbarMenuListProps } from './components/ToolbarMenuList';

export const Tool: FC<{ api: API }> = () => {
  const toolbarConfig = useParameter<Record<string, ToolbarMenuListProps>>('toolbars', {});

  if (Object.keys(toolbarConfig).length < 1) {
    return null;
  }

  return (
    <>
      <Separator />
      {Object.entries(toolbarConfig).map(([id, value]) => {
        return <ToolbarMenuList key={id} {...value} id={id} />;
      })}
    </>
  );
};
