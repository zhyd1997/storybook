import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack';
import { DefinePlugin } from 'webpack';

import { addScopedAlias, resolveNextConfig } from '../utils';

const tryResolve = (path: string) => {
  try {
    return require.resolve(path);
  } catch (err) {
    return false;
  }
};

export const configureConfig = async ({
  baseConfig,
  nextConfigPath,
}: {
  baseConfig: WebpackConfig;
  nextConfigPath?: string;
}): Promise<NextConfig> => {
  const nextConfig = await resolveNextConfig({ nextConfigPath });
  baseConfig.resolve ??= {};
  baseConfig.resolve.alias ??= {};
  const aliasConfig = baseConfig.resolve.alias;

  addScopedAlias(baseConfig, 'next/config');
  if (tryResolve('next/dist/compiled/react')) {
    addScopedAlias(baseConfig, 'react', 'next/dist/compiled/react');
  }
  if (tryResolve('next/dist/compiled/react-dom/cjs/react-dom-test-utils.production.js')) {
    addScopedAlias(
      baseConfig,
      'react-dom/test-utils',
      'next/dist/compiled/react-dom/cjs/react-dom-test-utils.production.js'
    );
  } else {
    const name = 'react-dom/test-utils';
    if (Array.isArray(aliasConfig)) {
      aliasConfig.push({
        name,
        alias: name,
      });
    } else {
      aliasConfig[name] = name;
    }
  }
  if (tryResolve('next/dist/compiled/react-dom')) {
    addScopedAlias(baseConfig, 'react-dom', 'next/dist/compiled/react-dom');
  }

  setupRuntimeConfig(baseConfig, nextConfig);

  return nextConfig;
};

const setupRuntimeConfig = (baseConfig: WebpackConfig, nextConfig: NextConfig): void => {
  const definePluginConfig: Record<string, any> = {
    // this mimics what nextjs does client side
    // https://github.com/vercel/next.js/blob/57702cb2a9a9dba4b552e0007c16449cf36cfb44/packages/next/client/index.tsx#L101
    'process.env.__NEXT_RUNTIME_CONFIG': JSON.stringify({
      serverRuntimeConfig: {},
      publicRuntimeConfig: nextConfig.publicRuntimeConfig,
    }),
  };

  const newNextLinkBehavior = (nextConfig.experimental as any)?.newNextLinkBehavior;

  definePluginConfig['process.env.__NEXT_NEW_LINK_BEHAVIOR'] = newNextLinkBehavior;

  baseConfig.plugins?.push(new DefinePlugin(definePluginConfig));
};
