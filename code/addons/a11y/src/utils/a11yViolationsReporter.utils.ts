import type { ImpactValue, Result } from 'axe-core';
import { format as prettyFormat, plugins as prettyFormatPlugins } from 'pretty-format';

const SPACE_SYMBOL = '\u{00B7}';

const {
  AsymmetricMatcher,
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormatPlugins;

const PLUGINS = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  DOMCollection,
  Immutable,
  AsymmetricMatcher,
];

/**
 * Filters all violations by user impact
 *
 * @param violations Result of the accessibilty check by axe
 * @param impactLevels Defines which impact level should be considered (e.g ['critical']) The level
 *   of impact can be "minor", "moderate", "serious", or "critical".
 * @returns Violations filtered by impact level
 */
export function filterViolations(violations: Result[], impactLevels: Array<ImpactValue>) {
  if (impactLevels && impactLevels.length > 0) {
    return violations.filter((v) => impactLevels.includes(v.impact!));
  }
  return violations;
}

export function replaceTrailingSpaces(text: string): string {
  return text.replace(/\s+$/gm, (spaces) => SPACE_SYMBOL.repeat(spaces.length));
}

export function stringify(object: unknown, maxDepth = 10, maxWidth = 10): string {
  const MAX_LENGTH = 10000;
  let result;

  try {
    result = prettyFormat(object, {
      maxDepth,
      maxWidth,
      min: true,
      plugins: PLUGINS,
    });
  } catch {
    result = prettyFormat(object, {
      callToJSON: false,
      maxDepth,
      maxWidth,
      min: true,
      plugins: PLUGINS,
    });
  }

  if (result.length >= MAX_LENGTH && maxDepth > 1) {
    return stringify(object, Math.floor(maxDepth / 2), maxWidth);
  }
  if (result.length >= MAX_LENGTH && maxWidth > 1) {
    return stringify(object, maxDepth, Math.floor(maxWidth / 2));
  }
  return result;
}
