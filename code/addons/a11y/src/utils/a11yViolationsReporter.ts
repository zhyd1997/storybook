import type { AxeResults, Result } from 'axe-core';
import picocolors from 'picocolors';

import { filterViolations, replaceTrailingSpaces, stringify } from './a11yViolationsReporter.utils';

export function getA11yViolationsReport(results: AxeResults, storyId: string) {
  if (typeof results.violations === 'undefined') {
    // eslint-disable-next-line local-rules/no-uncategorized-errors
    throw new Error(
      'Unexpected aXe results object. No violations property found.\nDid you change the `reporter` in your aXe configuration?'
    );
  }

  const filteredViolations = filterViolations(
    results.violations,
    // @ts-expect-error `impactLevels` is not a valid toolOption but one we add to the config
    // when calling `run`. axe just happens to pass this along. Might be a safer
    // way to do this since it's not documented API.
    results.toolOptions?.impactLevels ?? []
  );

  function reporter(violations: Result[]) {
    if (violations.length === 0) {
      return '';
    }

    const lineBreak = '\n\n';
    const horizontalLine = '----------------------------------------';

    return violations
      .map((violation) => {
        const errorBody = violation.nodes
          .map((node) => {
            const selector = node.target.join(', ');
            const storyHasAccessibilityErrors =
              `We have detected that your story "${storyId}" has accessibility errors.` + lineBreak;
            const expectedText =
              `Expected the HTML found at $('${selector}') to have no violations:` + lineBreak;
            return (
              storyHasAccessibilityErrors +
              expectedText +
              picocolors.gray(node.html) +
              lineBreak +
              `Received:` +
              lineBreak +
              picocolors.red(
                replaceTrailingSpaces(stringify(`${violation.help} (${violation.id})`)) +
                  lineBreak +
                  picocolors.yellow(node.failureSummary) +
                  lineBreak +
                  (violation.helpUrl
                    ? `You can find more information on this issue here: \n${picocolors.blue(
                        violation.helpUrl
                      )}`
                    : '')
              )
            );
          })
          .join(lineBreak);
        return errorBody;
      })
      .join(lineBreak + horizontalLine + lineBreak);
  }

  const formatedViolations = reporter(filteredViolations);

  return formatedViolations;
}
