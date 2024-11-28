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
    let total = 0;
    let covered = 0;

    for (const metric of Object.values(coverageSummary.data)) {
      total += metric.total;
      covered += metric.covered;
    }

    const percentage = Math.round((covered / total) * 100);

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
