import type { StoryContext } from '@storybook/csf';

import { run } from './a11yRunner';
import type { A11yParameters } from './params';

export const afterEach = async ({ reporting, parameters }: StoryContext) => {
  const a11yParameter: A11yParameters | undefined = parameters.a11y;

  if (a11yParameter?.manual !== true && a11yParameter?.disable !== true) {
    try {
      const result = await run(a11yParameter);

      const hasViolations = (result?.violations.length ?? 0) > 0;

      reporting.addReport({
        id: 'a11y',
        version: 1,
        result: result,
        status: hasViolations ? 'failed' : 'passed',
      });
    } catch (e) {
      reporting.addReport({
        id: 'a11y',
        version: 1,
        result: {
          error: e,
        },
        status: 'failed',
      });
    }
  }
};
