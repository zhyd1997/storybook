import { BigQuery } from '@google-cloud/bigquery';
import { request } from '@octokit/request';
import { program } from 'commander';
import detectFreePort from 'detect-port';
import { mkdir, readdir, rm, stat, writeFile } from 'fs/promises';
import pLimit from 'p-limit';
import { join } from 'path';
import { x } from 'tinyexec';

import versions from '../../code/core/src/common/versions';
import { runRegistry } from '../tasks/run-registry';
import { maxConcurrentTasks } from '../utils/concurrency';
import { esMain } from '../utils/esmain';

const BENCH_PACKAGES_PATH = join(__dirname, '..', '..', 'bench', 'packages');
const REGISTRY_PORT = 6001;

type PackageName = keyof typeof versions;
type Result = {
  package: PackageName;
  dependencies: number;
  selfSize: number;
  dependencySize: number;
};
type HumanReadableResult = {
  package: PackageName;
  dependencies: number;
  selfSize: string;
  dependencySize: string;
  totalSize: string;
};
type ResultMap = Record<PackageName, Result>;
type HumanReadableResultMap = Record<PackageName, HumanReadableResult>;

/**
 * This function benchmarks the size of Storybook packages and their dependencies. For each package,
 * the steps are:
 *
 * 1. Create a temporary directory in /bench/packages and create a package.json file that only depends
 *    on that one package
 * 2. Install the package and its dependencies, without peer dependencies
 * 3. Measure the size of the package and its dependencies, and count the number of dependencies
 *    (including transitive)
 * 4. Print and return the results
 */
export const benchPackage = async (packageName: PackageName) => {
  console.log(`Benching ${packageName}...`);
  const tmpBenchPackagePath = join(BENCH_PACKAGES_PATH, packageName.replace('@storybook', ''));

  await rm(tmpBenchPackagePath, { recursive: true }).catch(() => {});
  await mkdir(tmpBenchPackagePath, { recursive: true });

  await writeFile(
    join(tmpBenchPackagePath, 'package.json'),
    JSON.stringify(
      {
        name: `${packageName}-bench`,
        version: '1.0.0',
        // Overrides ensures that Storybook packages outside the monorepo are using the versions we have in the monorepo
        overrides: versions,
      },
      null,
      2
    )
  );

  await x(
    'npm',
    `install --save-exact --registry http://localhost:6001 --omit peer ${packageName}@${versions[packageName]}`.split(
      ' '
    ),
    {
      nodeOptions: { cwd: tmpBenchPackagePath },
    }
  );

  const npmLsResult = await x('npm', `ls --all --parseable`.split(' '), {
    nodeOptions: { cwd: tmpBenchPackagePath },
  });

  // the first line is the temporary benching package itself, don't count it
  // the second line is the package we're benching, don't count it
  const amountOfDependencies = npmLsResult.stdout.trim().split('\n').length - 2;

  const nodeModulesSize = await getDirSize(join(tmpBenchPackagePath, 'node_modules'));
  const selfSize = await getDirSize(join(tmpBenchPackagePath, 'node_modules', packageName));
  const dependencySize = nodeModulesSize - selfSize;

  const result: Result = {
    package: packageName,
    dependencies: amountOfDependencies,
    selfSize,
    dependencySize,
  };
  console.log(toHumanReadable(result));
  return result;
};

const getDirSize = async (path: string) => {
  const entities = await readdir(path, {
    recursive: true,
    withFileTypes: true,
  });
  const stats = await Promise.all(
    entities
      .filter((entity) => entity.isFile())
      .map((entity) => stat(join(entity.parentPath, entity.name)))
  );
  return stats.reduce((acc, { size }) => acc + size, 0);
};

const toHumanReadable = (result: Result): HumanReadableResult => {
  return {
    package: result.package,
    dependencies: result.dependencies,
    selfSize: formatBytes(result.selfSize),
    dependencySize: formatBytes(result.dependencySize),
    totalSize: formatBytes(result.selfSize + result.dependencySize),
  };
};

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Math.abs(bytes);
  let unitIndex = 0;

  while (size >= 1000 && unitIndex < units.length - 1) {
    size /= 1000;
    unitIndex++;
  }

  // B, KB = 0 decimal places
  // MB, GB, TB = 2 decimal places
  const decimals = unitIndex < 2 ? 0 : 2;
  const formattedSize = `${size.toFixed(decimals)} ${units[unitIndex]}`;

  return bytes < 0 ? `-${formattedSize}` : formattedSize;
};

const saveResultsLocally = async ({
  results,
  filename,
}: {
  results: ResultMap;
  filename: string;
}) => {
  const resultPath = join(BENCH_PACKAGES_PATH, filename);
  console.log(`Saving results to ${resultPath}...`);

  const humanReadableResults = Object.entries(results).reduce((acc, [packageName, result]) => {
    acc[packageName] = toHumanReadable(result);
    return acc;
  }, {} as HumanReadableResultMap);
  await writeFile(resultPath, JSON.stringify(humanReadableResults, null, 2));
};

const compareResults = async ({
  results,
  baseBranch,
}: {
  results: ResultMap;
  baseBranch: string;
}) => {
  // const GCP_CREDENTIALS = JSON.parse(process.env.GCP_CREDENTIALS || '{}');

  // const store = new BigQuery({
  //   projectId: GCP_CREDENTIALS.project_id,
  //   credentials: GCP_CREDENTIALS,
  // });
  // const dataset = store.dataset('benchmark_results');
  // const appTable = dataset.table('bench2');

  // const [baseResults] = await appTable.query({
  //   query: `
  //     WITH latest_packages AS (
  //     SELECT branch, package, timestamp,
  //         ROW_NUMBER() OVER (PARTITION BY branch, package ORDER BY timestamp DESC) as rownumber
  //       FROM \`storybook-benchmark.benchmark_results.bench2\`
  //       WHERE branch = @baseBranch
  //         AND package IN UNNEST(@packages)
  //         AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  //     )
  //     SELECT branch, package, timestamp
  //     FROM latest_packages
  //     WHERE rownumber = 1
  //     ORDER BY package;`,
  //   params: { baseBranch, packages: Object.keys(results) },
  // });
  // console.log(baseResults);

  const baseResults = [
    {
      package: '@storybook/react',
      dependencies: 4,
      selfSize: 900_000,
      dependencySize: 50_000,
    },
  ];

  const comparisonResults = {} as ResultMap;
  for (const result of Object.values(results)) {
    const baseResult = baseResults.find((row) => row.package === result.package);
    if (!baseResult) {
      console.warn(`No base result found for ${result.package}, skipping comparison.`);
      continue;
    }
    comparisonResults[result.package] = {
      package: result.package,
      dependencies: result.dependencies - baseResult.dependencies,
      selfSize: result.selfSize - baseResult.selfSize,
      dependencySize: result.dependencySize - baseResult.dependencySize,
    };
  }
  return comparisonResults;
};

const run = async () => {
  program
    .option('-b, --baseBranch <string>', 'The base branch to compare the results with')
    .option('-p, --pull-request <number>', 'The PR number to comment comparions on')
    .argument('[packages...]', 'which packages to bench. If omitted, all packages are benched');
  program.parse(process.argv);

  const packages = (
    program.args.length > 0 ? program.args : Object.keys(versions)
  ) as PackageName[];
  const options = program.opts<{ pullRequest?: string; baseBranch?: string }>();

  packages.forEach((packageName) => {
    if (!Object.keys(versions).includes(packageName)) {
      throw new Error(`Package '${packageName}' not found`);
    }
  });

  let registryController: AbortController | undefined;
  if ((await detectFreePort(REGISTRY_PORT)) === REGISTRY_PORT) {
    console.log('Starting local registry...');
    registryController = await runRegistry({ dryRun: false, debug: false });
  }

  // The amount of VCPUs for this task in CI is 2 (medium resource)
  const amountOfVCPUs = 2;
  const concurrentLimt = process.env.CI ? amountOfVCPUs - 1 : maxConcurrentTasks;
  const limit = pLimit(concurrentLimt);

  const progressIntervalId = setInterval(() => {
    const doneCount = packages.length - limit.activeCount - limit.pendingCount;
    if (doneCount === packages.length) {
      clearInterval(progressIntervalId);
      return;
    }
    console.log(
      `Currently benching ${limit.activeCount} packages, ${limit.pendingCount} pending, ${doneCount} done...`
    );
  }, 2_000);
  const resultsArray = await Promise.all(
    packages.map((packageName) => limit(() => benchPackage(packageName)))
  );
  const results = resultsArray.reduce((acc, result) => {
    acc[result.package] = result;
    return acc;
  }, {} as ResultMap);
  await saveResultsLocally({
    filename: `results.json`,
    results,
  });

  if (options.baseBranch) {
    const comparisonResults = await compareResults({ results, baseBranch: options.baseBranch });
    await saveResultsLocally({
      filename: `compare-with-${options.baseBranch}.json`,
      results: comparisonResults,
    });

    if (options.pullRequest) {
      // send to github bot
    }
  }

  console.log('Done benching all packages');
  registryController?.abort();
};

if (esMain(import.meta.url)) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
