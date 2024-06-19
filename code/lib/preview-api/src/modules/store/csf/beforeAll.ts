type Awaitable<T> = T | Promise<T>;

type CleanupFn = () => Awaitable<void>;

export type BeforeAllHook = () => Awaitable<void | CleanupFn>;

// Execute all the hooks in sequence, and return a function that will execute cleanups in reverse order
export const composeBeforeHooks = (hooks: BeforeAllHook[]): BeforeAllHook => {
  return async () => {
    const cleanups: CleanupFn[] = [];
    for (const hook of hooks) {
      const cleanup = await hook();
      if (cleanup) cleanups.unshift(cleanup);
    }
    return async () => {
      for (const cleanup of cleanups) {
        await cleanup();
      }
    };
  };
};
