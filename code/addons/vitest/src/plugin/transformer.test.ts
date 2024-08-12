import { describe, expect, it, vi } from 'vitest';

import { getStoryTitle } from 'storybook/internal/common';

import { type RawSourceMap, SourceMapConsumer } from 'source-map';

import { transform as originalTransform } from './transformer';

vi.mock('storybook/internal/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('storybook/internal/common')>();
  return {
    ...actual,
    getStoryTitle: vi.fn(() => 'automatic/calculated/title'),
  };
});

expect.addSnapshotSerializer({
  serialize: (val: any) => (typeof val === 'string' ? val : val.toString()),
  test: (val) => true,
});

const transform = async ({
  code = '',
  id = 'src/components/Button.stories.js',
  options = {
    tags: { include: [], exclude: [], skip: [] },
    configDir: '',
    storybookScript: '',
    skipRunningStorybook: true,
    snapshot: false,
    storybookUrl: '',
    debug: false,
  },
  stories = [],
}) => {
  const transformed = await originalTransform({ code, id, options, stories });
  if (typeof transformed === 'string') {
    return { code: transformed, map: null };
  }

  return transformed;
};

describe('transformer', () => {
  describe('no-op', () => {
    it('should return original code if the file is not a story file', async () => {
      const code = `console.log('Not a story file');`;
      const id = 'src/components/Button.js';

      const result = await transform({ code, id });

      expect(result.code).toMatchInlineSnapshot(`console.log('Not a story file');`);
    });
  });

  describe('default exports (meta)', () => {
    it('should add title to inline default export in story file if not present', async () => {
      const code = `
        export default {
          component: Button,
        };
      `;

      const result = await transform({ code });

      // expect(getStoryTitle).toHaveBeenCalled();

      expect(result.code).toMatchInlineSnapshot(`
        import { test as __test } from "vitest";
        import { composeStory as __composeStory } from "storybook/internal/preview-api";
        import { testStory as __testStory, isValidTest as __isValidTest } from "@storybook/experimental-addon-vitest/internal/test-utils";
        const __STORYBOOK_META__ = {
          component: Button,
          title: "automatic/calculated/title"
        };
        export default __STORYBOOK_META__;
      `);
    });

    it('should NOT add title to inline default export in story file if already present', async () => {
      const code = `
        export default {
          title: 'Button',
          component: Button,
        };
      `;

      const result = await transform({ code });

      // expect(getStoryTitle).not.toHaveBeenCalled();

      expect(result.code).toMatchInlineSnapshot(`
        import { test as __test } from "vitest";
        import { composeStory as __composeStory } from "storybook/internal/preview-api";
        import { testStory as __testStory, isValidTest as __isValidTest } from "@storybook/experimental-addon-vitest/internal/test-utils";
        const __STORYBOOK_META__ = {
          title: 'Button',
          component: Button
        };
        export default __STORYBOOK_META__;
      `);
    });

    it('should add title to const declared default export in story file if not present', async () => {
      const code = `
        const meta = {
          component: Button,
        };
  
        export default meta;
      `;

      const result = await transform({ code });

      // expect(getStoryTitle).toHaveBeenCalled();

      expect(result.code).toMatchInlineSnapshot(`
        import { test as __test } from "vitest";
        import { composeStory as __composeStory } from "storybook/internal/preview-api";
        import { testStory as __testStory, isValidTest as __isValidTest } from "@storybook/experimental-addon-vitest/internal/test-utils";
        const meta = {
          component: Button,
          title: "automatic/calculated/title"
        };
        export default meta;
      `);
    });

    it('should NOT add title to const declared default export in story file if already present', async () => {
      const code = `
        const meta = {
          title: 'Button',
          component: Button,
        };
  
        export default meta;
      `;

      const result = await transform({ code });

      // expect(getStoryTitle).not.toHaveBeenCalled();

      expect(result.code).toMatchInlineSnapshot(`
        import { test as __test } from "vitest";
        import { composeStory as __composeStory } from "storybook/internal/preview-api";
        import { testStory as __testStory, isValidTest as __isValidTest } from "@storybook/experimental-addon-vitest/internal/test-utils";
        const meta = {
          title: 'Button',
          component: Button
        };
        export default meta;
      `);
    });
  });

  describe('named exports (stories)', () => {
    it('should add test statement to inline exported stories', async () => {
      const code = `
      export default {
        title: 'Button',
        component: Button,
      }
      export const Primary = {
        args: {
          label: 'Primary Button',
        },
      };
    `;

      const result = await transform({ code });

      expect(result.code).toMatchInlineSnapshot(`
        import { test as __test } from "vitest";
        import { composeStory as __composeStory } from "storybook/internal/preview-api";
        import { testStory as __testStory, isValidTest as __isValidTest } from "@storybook/experimental-addon-vitest/internal/test-utils";
        const __STORYBOOK_META__ = {
          title: 'Button',
          component: Button
        };
        export default __STORYBOOK_META__;
        export const Primary = {
          args: {
            label: 'Primary Button'
          }
        };
        const ___PrimaryComposed = __composeStory(Primary, __STORYBOOK_META__);
        if (__isValidTest(___PrimaryComposed, __STORYBOOK_META__, {"include":[],"exclude":[],"skip":[]})) {
          __test("Primary", __testStory(___PrimaryComposed, {"include":[],"exclude":[],"skip":[]}));
        }
      `);
    });

    it('should add test statement to const declared exported stories', async () => {
      const code = `
      export default {}
      const Primary = {
        args: {
          label: 'Primary Button',
        },
      };

      export { Primary };
    `;

      const result = await transform({ code });

      expect(result.code).toMatchInlineSnapshot(`
        import { test as __test } from "vitest";
        import { composeStory as __composeStory } from "storybook/internal/preview-api";
        import { testStory as __testStory, isValidTest as __isValidTest } from "@storybook/experimental-addon-vitest/internal/test-utils";
        const __STORYBOOK_META__ = {
          title: "automatic/calculated/title"
        };
        export default __STORYBOOK_META__;
        const Primary = {
          args: {
            label: 'Primary Button'
          }
        };
        export { Primary };
        const ___PrimaryComposed = __composeStory(Primary, __STORYBOOK_META__);
        if (__isValidTest(___PrimaryComposed, __STORYBOOK_META__, {"include":[],"exclude":[],"skip":[]})) {
          __test("Primary", __testStory(___PrimaryComposed, {"include":[],"exclude":[],"skip":[]}));
        }
      `);
    });

    it('should exclude exports via excludeStories', async () => {
      const code = `
      export default {
        title: 'Button',
        component: Button,
        excludeStories: 'nonStory',
      }
      export const nonStory = 123
    `;

      const result = await transform({ code });

      expect(result.code).toMatchInlineSnapshot(`
        import { test as __test } from "vitest";
        import { composeStory as __composeStory } from "storybook/internal/preview-api";
        import { testStory as __testStory, isValidTest as __isValidTest } from "@storybook/experimental-addon-vitest/internal/test-utils";
        const __STORYBOOK_META__ = {
          title: 'Button',
          component: Button,
          excludeStories: 'nonStory'
        };
        export default __STORYBOOK_META__;
      `);
    });
  });

  describe('source map calculation', () => {
    it('should remap the location of an inline named export to its relative testStory function', async () => {
      const originalCode = `
        const meta = {
          component: Button,
        }
        export default meta;
        export const Primary = {};
      `;

      const { code: transformedCode, map } = await transform({
        code: originalCode,
      });

      expect(transformedCode).toMatchInlineSnapshot(`
        import { test as __test } from "vitest";
        import { composeStory as __composeStory } from "storybook/internal/preview-api";
        import { testStory as __testStory, isValidTest as __isValidTest } from "@storybook/experimental-addon-vitest/internal/test-utils";
        const meta = {
          component: Button,
          title: "automatic/calculated/title"
        };
        export default meta;
        export const Primary = {};
        const ___PrimaryComposed = __composeStory(Primary, meta);
        if (__isValidTest(___PrimaryComposed, meta, {"include":[],"exclude":[],"skip":[]})) {
          __test("Primary", __testStory(___PrimaryComposed, {"include":[],"exclude":[],"skip":[]}));
        }
      `);

      const consumer = await new SourceMapConsumer(map as RawSourceMap);

      // Locate `__test("Primary"...` in the transformed code
      const testPrimaryLine =
        transformedCode.split('\n').findIndex((line) => line.includes('__test("Primary"')) + 1;
      const testPrimaryColumn = transformedCode
        .split('\n')
        [testPrimaryLine - 1].indexOf('__test("Primary"');

      // Get the original position from the source map for `__test("Primary"...`
      const originalPosition = consumer.originalPositionFor({
        line: testPrimaryLine,
        column: testPrimaryColumn,
      });

      // Locate `export const Primary` in the original code
      const originalPrimaryLine =
        originalCode.split('\n').findIndex((line) => line.includes('const Primary')) + 1;
      const originalPrimaryColumn = originalCode
        .split('\n')
        [originalPrimaryLine - 1].indexOf('const Primary');

      // The original locations of the transformed code should match with the ones of the original code
      expect(originalPosition.line).toBe(originalPrimaryLine);
      expect(originalPosition.column).toBe(originalPrimaryColumn);

      consumer.destroy();
    });

    it('should remap the location of a const declared named export to its relative testStory function', async () => {
      const originalCode = `
        const meta = {
          component: Button,
        }
        export default meta;
        const Primary = {};
        export { Primary };
      `;

      const { code: transformedCode, map } = await transform({
        code: originalCode,
      });

      expect(transformedCode).toMatchInlineSnapshot(`
        import { test as __test } from "vitest";
        import { composeStory as __composeStory } from "storybook/internal/preview-api";
        import { testStory as __testStory, isValidTest as __isValidTest } from "@storybook/experimental-addon-vitest/internal/test-utils";
        const meta = {
          component: Button,
          title: "automatic/calculated/title"
        };
        export default meta;
        const Primary = {};
        export { Primary };
        const ___PrimaryComposed = __composeStory(Primary, meta);
        if (__isValidTest(___PrimaryComposed, meta, {"include":[],"exclude":[],"skip":[]})) {
          __test("Primary", __testStory(___PrimaryComposed, {"include":[],"exclude":[],"skip":[]}));
        }
      `);

      const consumer = await new SourceMapConsumer(map as RawSourceMap);

      // Locate `__test("Primary"...` in the transformed code
      const testPrimaryLine =
        transformedCode.split('\n').findIndex((line) => line.includes('__test("Primary"')) + 1;
      const testPrimaryColumn = transformedCode
        .split('\n')
        [testPrimaryLine - 1].indexOf('__test("Primary"');

      // Get the original position from the source map for `__test("Primary"...`
      const originalPosition = consumer.originalPositionFor({
        line: testPrimaryLine,
        column: testPrimaryColumn,
      });

      // Locate `export const Primary` in the original code
      const originalPrimaryLine =
        originalCode.split('\n').findIndex((line) => line.includes('const Primary')) + 1;
      const originalPrimaryColumn = originalCode
        .split('\n')
        [originalPrimaryLine - 1].indexOf('const Primary');

      // The original locations of the transformed code should match with the ones of the original code
      expect(originalPosition.line).toBe(originalPrimaryLine);
      expect(originalPosition.column).toBe(originalPrimaryColumn);

      consumer.destroy();
    });
  });
});
