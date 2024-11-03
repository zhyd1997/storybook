import { detectLanguage } from 'storybook/internal/cli';
import { SupportedLanguage } from 'storybook/internal/cli';

import { baseGenerator } from '../baseGenerator';
import type { Generator } from '../types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  // Add prop-types dependency if not using TypeScript
  const language = await detectLanguage(packageManager);
  const extraPackages = ['vite'];
  if (language === SupportedLanguage.JAVASCRIPT) {
    extraPackages.push('prop-types');
  }

  await baseGenerator(
    packageManager,
    npmOptions,
    options,
    'react',
    {
      extraPackages,
      extraAddons: [`@storybook/addon-onboarding`],
    },
    'react-native-web-vite'
  );
};

export default generator;
