export function getIsVitestStandaloneRun() {
  try {
    // @ts-expect-error - todo - ignore for now
    return (import.meta.env || process?.env).STORYBOOK !== 'true';
  } catch (e) {
    return false;
  }
}

export function getIsVitestRunning() {
  try {
    // @ts-expect-error - todo - ignore for now
    return (import.meta.env || process?.env).MODE === 'test';
  } catch (e) {
    return false;
  }
}
