import type { ResolvedCoverageOptions } from 'vitest/node';

import type { ReportNode, Visitor } from 'istanbul-lib-report';
import { ReportBase } from 'istanbul-lib-report';

import { type Details, TEST_PROVIDER_ID } from '../constants';
import type { TestManager } from './test-manager';

export type StorybookCoverageReporterOptions = {
  testManager: TestManager;
  getCoverageOptions: () => ResolvedCoverageOptions<'v8'>;
};

export default class StorybookCoverageReporter extends ReportBase implements Partial<Visitor> {
  #testManager: StorybookCoverageReporterOptions['testManager'];

  #getCoverageOptions: StorybookCoverageReporterOptions['getCoverageOptions'];

  constructor(opts: StorybookCoverageReporterOptions) {
    super();
    this.#testManager = opts.testManager;
    this.#getCoverageOptions = opts.getCoverageOptions;
  }

  onSummary(node: ReportNode) {
    if (!node.isRoot()) {
      return;
    }
    const coverageSummary = node.getCoverageSummary(false);

    const percentage = Math.round(coverageSummary.data.statements.pct);

    // Fallback to Vitest's default watermarks https://vitest.dev/config/#coverage-watermarks
    const [lowWatermark = 50, highWatermark = 80] =
      this.#getCoverageOptions().watermarks?.statements ?? [];

    const coverageDetails: Details['coverage'] = {
      percentage,
      status:
        percentage < lowWatermark
          ? 'negative'
          : percentage < highWatermark
            ? 'warning'
            : 'positive',
    };
    this.#testManager.sendProgressReport({
      providerId: TEST_PROVIDER_ID,
      details: {
        coverage: coverageDetails,
      },
    });
  }
}
