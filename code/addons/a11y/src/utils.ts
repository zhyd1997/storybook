export function getIsVitestStandaloneRun() {
  try {
    return process?.env.STORYBOOK !== 'true';
  } catch {
    try {
      // @ts-expect-error Suppress TypeScript warning about wrong setting. Doesn't matter, because we don't use tsc for bundling.
      return import.meta.env.STORYBOOK !== 'true';
    } catch (e) {
      return false;
    }
  }
}

export function getIsVitestRunning() {
  try {
    return process?.env.MODE === 'test';
  } catch {
    try {
      // @ts-expect-error Suppress TypeScript warning about wrong setting. Doesn't matter, because we don't use tsc for bundling.
      return import.meta.env.MODE === 'test';
    } catch (e) {
      return false;
    }
  }
}
