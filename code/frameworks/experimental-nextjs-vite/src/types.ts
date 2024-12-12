import type {
  CompatibleString,
  StorybookConfig as StorybookConfigBase,
  TypescriptOptions as TypescriptOptionsBase,
} from 'storybook/internal/types';

import type { BuilderOptions, StorybookConfigVite } from '@storybook/builder-vite';

import type docgenTypescript from '@joshwooding/vite-plugin-react-docgen-typescript';

type FrameworkName = CompatibleString<'@storybook/experimental-nextjs-vite'>;
type BuilderName = CompatibleString<'@storybook/builder-vite'>;

export type FrameworkOptions = {
  /** The path to the Next.js configuration file. */
  nextConfigPath?: string;
  builder?: BuilderOptions;
};

type StorybookConfigFramework = {
  framework:
    | FrameworkName
    | {
        name: FrameworkName;
        options: FrameworkOptions;
      };
  core?: StorybookConfigBase['core'] & {
    builder?:
      | BuilderName
      | {
          name: BuilderName;
          options: BuilderOptions;
        };
  };
};

type TypescriptOptions = TypescriptOptionsBase & {
  /**
   * Sets the type of Docgen when working with React and TypeScript
   *
   * @default `'react-docgen'`
   */
  reactDocgen: 'react-docgen-typescript' | 'react-docgen' | false;
  /** Configures `@joshwooding/vite-plugin-react-docgen-typescript` */
  reactDocgenTypescriptOptions: Parameters<typeof docgenTypescript>[0];
};

/** The interface for Storybook configuration in `main.ts` files. */
export type StorybookConfig = Omit<
  StorybookConfigBase,
  keyof StorybookConfigVite | keyof StorybookConfigFramework | 'typescript'
> &
  StorybookConfigVite &
  StorybookConfigFramework & {
    typescript?: Partial<TypescriptOptions>;
  };
