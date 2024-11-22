// Source: https://github.com/chaance/vitest-axe/blob/main/src/to-have-no-violations.ts
import * as matchers from 'vitest-axe/matchers';

import type { StoryContext } from '@storybook/csf';
import { expect } from '@storybook/test';

import { run } from './a11yRunner';
import type { A11yParameters } from './params';

expect.extend(matchers);

// @ts-expect-error - ignore
// todo: check in webpack environments
const isVitestStandaloneRun = import.meta?.env?.STORYBOOK !== 'true';

export const afterEach = async ({ reporting, parameters, globals, id }: StoryContext) => {
  const a11yParameter: A11yParameters | undefined = parameters.a11y;
  const a11yGlobals = globals.a11y;
  const warnings = a11yParameter?.warnings ?? [];

  if (
    a11yParameter?.manual !== true &&
    a11yParameter?.disable !== true &&
    a11yGlobals?.manual !== true
  ) {
    try {
      const result = await run(a11yParameter);

      if (result) {
        const hasViolations = (result?.violations.length ?? 0) > 0;

        const hasErrors = result?.violations.some(
          (violation) => !warnings.includes(violation.impact!)
        );

        reporting.addReport({
          id: 'a11y',
          version: 1,
          result: result,
          status: hasErrors ? 'failed' : hasViolations ? 'warning' : 'passed',
        });

        /**
         * When Vitest is running outside of Storybook, we need to throw an error to fail the test
         * run when there are accessibility issues.
         *
         * @todo In the future, we want to always throw an error when there are accessibility
         *   issues. This is a temporary solution. Later, portable stories and Storybook should
         *   implement proper try catch handling.
         */
        if (isVitestStandaloneRun) {
          if (hasErrors) {
            // @ts-expect-error - todo - fix type extension of expect from @storybook/test
            expect(result).toHaveNoViolations();
          }
        }
      }
      /**
       * @todo Later we don't want to catch errors here. Instead, we want to throw them and let
       *   Storybook/portable stories handle them on a higher level.
       */
    } catch (e) {
      reporting.addReport({
        id: 'a11y',
        version: 1,
        result: {
          error: e,
        },
        status: 'failed',
      });

      if (isVitestStandaloneRun) {
        throw e;
      }
    }
  }
};
