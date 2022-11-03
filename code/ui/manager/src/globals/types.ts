import type { ModuleInfo } from '@fal-works/esbuild-plugin-global-externals';

// Here we map the name of a module to their NAME in the global scope.
export enum Keys {
  'react' = '__REACT__',
  'react-dom' = '__REACTDOM__',
  '@storybook/components' = '__STORYBOOKCOMPONENTS__',
  '@storybook/channels' = '__STORYBOOKCHANNELS__',
  '@storybook/core-events' = '__STORYBOOKCOREEVENTS__',
  '@storybook/router' = '__STORYBOOKROUTER__',
  '@storybook/theming' = '__STORYBOOKTHEMING__',
  '@storybook/api' = '__STORYBOOKAPI__',
  '@storybook/preview-api' = '__STORYBOOKADDONS__',
  '@storybook/client-logger' = '__STORYBOOKCLIENTLOGGER__',
}

export type Definitions = Required<Record<keyof typeof Keys, Required<ModuleInfo>>>;
