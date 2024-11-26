import type { ReportNode, Visitor } from 'istanbul-lib-report';
import { ReportBase } from 'istanbul-lib-report';

import { TEST_PROVIDER_ID } from '../constants';
import type { TestManager } from './test-manager';

export default class StorybookCoverageReporter extends ReportBase implements Partial<Visitor> {
  #testManager: TestManager;

  constructor(opts: { getTestManager: () => TestManager }) {
    super();
    this.#testManager = opts.getTestManager();
  }

  onSummary(node: ReportNode) {
    if (!node.isRoot()) {
      return;
    }
    const coverageSummary = node.getCoverageSummary(false);
    this.#testManager.sendProgressReport({
      providerId: TEST_PROVIDER_ID,
      details: {
        coverageSummary: coverageSummary.data,
      },
    });
  }
}
