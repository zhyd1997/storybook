import { writeFile } from 'node:fs/promises';

import { getStorybookMetadata } from '@storybook/core/telemetry';

import type { Server } from './server-connect';

export async function extractStorybookMetadata(outputFile: string, configDir: string) {
  const storybookMetadata = await getStorybookMetadata(configDir);

  await writeFile(outputFile, JSON.stringify(storybookMetadata));
}

export function useStorybookMetadata(app: Server, configDir?: string) {
  app.use('/project.json', async (req, res) => {
    const storybookMetadata = await getStorybookMetadata(configDir);
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(storybookMetadata));
    res.end();
  });
}
