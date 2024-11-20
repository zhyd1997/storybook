import type { Channel } from 'storybook/internal/channels';

import type { ReportNode, Visitor } from 'istanbul-lib-report';
import { ReportBase } from 'istanbul-lib-report';

export default class StorybookCoverageReporter extends ReportBase implements Partial<Visitor> {
  #channel: Channel;

  constructor(opts: { channel: Channel }) {
    super();
    this.#channel = opts.channel;
  }

  onSummary(node: ReportNode) {
    if (!node.isRoot()) {
      return;
    }
    const coverageSummary = node.getCoverageSummary(false);
    this.#channel.emit('storybook/coverage', coverageSummary);
  }
}
