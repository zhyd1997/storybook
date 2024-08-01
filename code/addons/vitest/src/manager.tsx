import { global } from '@storybook/global';
import type { IndexEntry, StoryIndex } from '@storybook/types';
import { addons, type API } from 'storybook/internal/manager-api';

import { ADDON_ID } from './constants';

const loadReport = async (api: API) => {
  const indexPromise: Promise<StoryIndex> = fetch('index.json').then((res) => res.json());
  const reportPromise = fetch('vitest-report.xml').then((res) => res.text());

  const [index, report] = await Promise.all([indexPromise, reportPromise]).catch(() => []);
  if (!index || !report) return;

  const openInteractionsPanel = () => {
    api.setSelectedPanel('storybook/interactions/panel');
    api.togglePanel(true);
  };

  const storiesByPath = Object.values(index.entries).reduce(
    (acc, story) => {
      acc[story.importPath] = acc[story.importPath] || {};
      acc[story.importPath][story.name] = story;
      return acc;
    },
    {} as Record<IndexEntry['importPath'], Record<IndexEntry['name'], IndexEntry>>
  );

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(report, 'text/xml');

  await api.experimental_updateStatus(
    ADDON_ID,
    Object.fromEntries(
      Array.from(xmlDoc.getElementsByTagName('testcase')).map((testcase) => {
        const storyFile = testcase.getAttribute('classname');
        const storyName = testcase.getAttribute('name')?.replace(/ /g,'');
        if (!storyFile || !storyName) return [];

        const stories = storiesByPath[storyFile] || storiesByPath[`./${storyFile}`];
        const story = stories?.[storyName];
        if (!story) return [];

        const result = testcase.querySelector('error, failure, skipped');
        return [
          story.id,
          result
            ? {
                status: { error: 'error', failure: 'warn', skipped: 'unknown' }[result.tagName],
                title: `Vitest: ${result.getAttribute('type') || `Test ${result.tagName}`}`,
                description: '',
                onClick: openInteractionsPanel,
              }
            : {
                status: 'success',
                title: 'Vitest: Tests passed',
                description: '',
                onClick: openInteractionsPanel,
              },
        ];
      })
    )
  );
};

const enablePolling = global.CONFIG_TYPE === 'DEVELOPMENT';
const pollingInterval = 10000; // 10 seconds

addons.register(
  ADDON_ID,
  enablePolling ? (api) => setInterval(loadReport, pollingInterval, api) : loadReport
);
