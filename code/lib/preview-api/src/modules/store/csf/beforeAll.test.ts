import { beforeEach, describe, expect, it } from 'vitest';
import { composeBeforeHooks } from './beforeAll';

const calls: string[] = [];

beforeEach(() => {
  calls.length = 0;
});

const basicHook = (label: string) => () => {
  calls.push(label);
};
const asyncHook = (label: string, delay: number) => async () => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  calls.push(label);
};
const cleanupHook = (label: string) => () => {
  calls.push(label);
  return () => {
    calls.push(label + ' cleanup');
  };
};
const asyncCleanupHook = (label: string, delay: number) => () => {
  calls.push(label);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    calls.push(label + ' cleanup');
  };
};

describe('composeBeforeHooks', () => {
  it('should return a composed hook function', async () => {
    await composeBeforeHooks([basicHook('one'), basicHook('two'), basicHook('three')])();
    expect(calls).toEqual(['one', 'two', 'three']);
  });

  it('should execute cleanups in reverse order', async () => {
    const cleanup = await composeBeforeHooks([
      cleanupHook('one'),
      cleanupHook('two'),
      cleanupHook('three'),
    ])();
    expect(calls).toEqual(['one', 'two', 'three']);

    await cleanup?.();
    expect(calls).toEqual(['one', 'two', 'three', 'three cleanup', 'two cleanup', 'one cleanup']);
  });

  it('should execute async hooks in sequence', async () => {
    await composeBeforeHooks([
      asyncHook('one', 10),
      asyncHook('two', 100),
      asyncHook('three', 10),
    ])();
    expect(calls).toEqual(['one', 'two', 'three']);
  });

  it('should execute async cleanups in reverse order', async () => {
    const hooks = [
      asyncCleanupHook('one', 10),
      asyncCleanupHook('two', 100),
      asyncCleanupHook('three', 10),
    ];

    const cleanup = await composeBeforeHooks(hooks)();
    expect(calls).toEqual(['one', 'two', 'three']);

    await cleanup?.();
    expect(calls).toEqual(['one', 'two', 'three', 'three cleanup', 'two cleanup', 'one cleanup']);
  });
});
