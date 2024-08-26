/* eslint-disable local-rules/no-uncategorized-errors */

/* eslint-disable no-underscore-dangle */
import { types } from '@storybook/core/babel';
import { getStoryTitle } from '@storybook/core/common';
import type { StoriesEntry, Tag } from '@storybook/core/types';
import { combineTags } from '@storybook/csf';

import { dedent } from 'ts-dedent';

import { formatCsf, loadCsf } from '../CsfFile';

const logger = console;

type TagsFilter = {
  include: string[];
  exclude: string[];
  skip: string[];
};

const isValidTest = (storyTags: string[], tagsFilter: TagsFilter) => {
  const isIncluded =
    tagsFilter?.include.length === 0 || tagsFilter?.include.some((tag) => storyTags.includes(tag));
  const isNotExcluded = tagsFilter?.exclude.every((tag) => !storyTags.includes(tag));

  return isIncluded && isNotExcluded;
};

export async function vitestTransform({
  code,
  fileName,
  configDir,
  stories,
  tagsFilter,
  previewLevelTags = [],
}: {
  code: string;
  fileName: string;
  configDir: string;
  tagsFilter: TagsFilter;
  stories: StoriesEntry[];
  previewLevelTags: Tag[];
}) {
  const isStoryFile = /\.stor(y|ies)\./.test(fileName);
  if (!isStoryFile) {
    return code;
  }

  const parsed = loadCsf(code, {
    fileName,
    transformInlineMeta: true,
    makeTitle: (title) => {
      const result =
        getStoryTitle({
          storyFilePath: fileName,
          configDir,
          stories,
          userTitle: title,
        }) || 'unknown';

      if (result === 'unknown') {
        logger.warn(
          dedent`
            [Storybook]: Could not calculate story title for "${fileName}".
            Please make sure that this file matches the globs included in the "stories" field in your Storybook configuration at "${configDir}".
          `
        );
      }
      return result;
    },
  }).parse();

  const ast = parsed._ast;

  const metaExportName = parsed._metaVariableName!;

  const metaNode = parsed._metaNode as types.ObjectExpression;

  const metaTitleProperty = metaNode.properties.find(
    (prop) =>
      types.isObjectProperty(prop) && types.isIdentifier(prop.key) && prop.key.name === 'title'
  );

  const metaTitle = types.stringLiteral(parsed._meta?.title || 'unknown');
  if (!metaTitleProperty) {
    metaNode.properties.push(types.objectProperty(types.identifier('title'), metaTitle));
  } else if (types.isObjectProperty(metaTitleProperty)) {
    // If the title is present in meta, overwrite it because autotitle can still affect existing titles
    metaTitleProperty.value = metaTitle;
  }

  if (!metaNode || !parsed._meta) {
    throw new Error(
      'The Storybook vitest plugin could not detect the meta (default export) object in the story file. \n\nPlease make sure you have a default export with the meta object. If you are using a different export format that is not supported, please file an issue with details about your use case.'
    );
  }

  // Filter out stories based on the passed tags filter
  const validStories: (typeof parsed)['_storyStatements'] = {};
  Object.keys(parsed._stories).map((key) => {
    const finalTags = combineTags(
      'test',
      'dev',
      ...previewLevelTags,
      ...(parsed.meta?.tags || []),
      ...(parsed._stories[key].tags || [])
    );

    if (isValidTest(finalTags, tagsFilter)) {
      validStories[key] = parsed._storyStatements[key];
    }
  });

  const vitestTestId = parsed._file.path.scope.generateUidIdentifier('test');
  const vitestDescribeId = parsed._file.path.scope.generateUidIdentifier('describe');

  // if no valid stories are found, we just add describe.skip() to the file to avoid empty test files
  if (Object.keys(validStories).length === 0) {
    const describeSkipBlock = types.expressionStatement(
      types.callExpression(types.memberExpression(vitestDescribeId, types.identifier('skip')), [
        types.stringLiteral('No valid tests found'),
      ])
    );

    ast.program.body.push(describeSkipBlock);
    const imports = [
      types.importDeclaration(
        [
          types.importSpecifier(vitestTestId, types.identifier('test')),
          types.importSpecifier(vitestDescribeId, types.identifier('describe')),
        ],
        types.stringLiteral('vitest')
      ),
    ];

    ast.program.body.unshift(...imports);
  } else {
    const vitestExpectId = parsed._file.path.scope.generateUidIdentifier('expect');
    const testStoryId = parsed._file.path.scope.generateUidIdentifier('testStory');
    const skipTagsId = types.identifier(JSON.stringify(tagsFilter.skip));

    /**
     * In Storybook users might be importing stories from other story files. As a side effect, tests
     * can get re-triggered. To avoid this, we add a guard to only run tests if the current file is
     * the one running the test.
     *
     * Const isRunningFromThisFile = import.meta.url.includes(expect.getState().testPath ??
     * globalThis.**vitest_worker**.filepath) if(isRunningFromThisFile) { ... }
     */
    function getTestGuardDeclaration() {
      const isRunningFromThisFileId =
        parsed._file.path.scope.generateUidIdentifier('isRunningFromThisFile');

      // expect.getState().testPath
      const testPathProperty = types.memberExpression(
        types.callExpression(
          types.memberExpression(vitestExpectId, types.identifier('getState')),
          []
        ),
        types.identifier('testPath')
      );

      // There is a bug in Vitest where expect.getState().testPath is undefined when called outside of a test function so we add this fallback in the meantime
      // https://github.com/vitest-dev/vitest/issues/6367
      // globalThis.__vitest_worker__.filepath
      const filePathProperty = types.memberExpression(
        types.memberExpression(
          types.identifier('globalThis'),
          types.identifier('__vitest_worker__')
        ),
        types.identifier('filepath')
      );

      // Combine testPath and filepath using the ?? operator
      const nullishCoalescingExpression = types.logicalExpression(
        '??',
        testPathProperty,
        filePathProperty
      );

      // Create the final expression: import.meta.url.includes(...)
      const includesCall = types.callExpression(
        types.memberExpression(
          types.memberExpression(
            types.memberExpression(types.identifier('import'), types.identifier('meta')),
            types.identifier('url')
          ),
          types.identifier('includes')
        ),
        [nullishCoalescingExpression]
      );

      const isRunningFromThisFileDeclaration = types.variableDeclaration('const', [
        types.variableDeclarator(isRunningFromThisFileId, includesCall),
      ]);
      return { isRunningFromThisFileDeclaration, isRunningFromThisFileId };
    }

    const { isRunningFromThisFileDeclaration, isRunningFromThisFileId } = getTestGuardDeclaration();

    ast.program.body.push(isRunningFromThisFileDeclaration);

    const getTestStatementForStory = ({
      exportName,
      node,
    }: {
      exportName: string;
      node: types.Node;
    }) => {
      // Create the _test expression directly using the exportName identifier
      const testStoryCall = types.expressionStatement(
        types.callExpression(vitestTestId, [
          types.stringLiteral(exportName),
          types.callExpression(testStoryId, [
            types.stringLiteral(exportName),
            types.identifier(exportName),
            types.identifier(metaExportName),
            skipTagsId,
          ]),
        ])
      );

      // Preserve sourcemaps location
      testStoryCall.loc = node.loc;

      // Return just the testStoryCall as composeStoryCall is not needed
      return testStoryCall;
    };

    const storyTestStatements = Object.entries(validStories)
      .map(([exportName, node]) => {
        if (node === null) {
          logger.warn(
            dedent`
            [Storybook]: Could not transform "${exportName}" story into test at "${fileName}".
            Please make sure to define stories in the same file and not re-export stories coming from other files".
          `
          );
          return;
        }

        return getTestStatementForStory({
          exportName,
          node,
        });
      })
      .filter((st) => !!st) as types.ExpressionStatement[];

    const testBlock = types.ifStatement(
      isRunningFromThisFileId,
      types.blockStatement(storyTestStatements)
    );

    ast.program.body.push(testBlock);

    const imports = [
      types.importDeclaration(
        [
          types.importSpecifier(vitestTestId, types.identifier('test')),
          types.importSpecifier(vitestExpectId, types.identifier('expect')),
        ],
        types.stringLiteral('vitest')
      ),
      types.importDeclaration(
        [types.importSpecifier(testStoryId, types.identifier('testStory'))],
        types.stringLiteral('@storybook/experimental-addon-vitest/internal/test-utils')
      ),
    ];

    ast.program.body.unshift(...imports);
  }

  return formatCsf(parsed, { sourceMaps: true, sourceFileName: fileName }, code);
}
