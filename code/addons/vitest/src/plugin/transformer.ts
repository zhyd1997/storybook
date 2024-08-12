/* eslint-disable local-rules/no-uncategorized-errors */

/* eslint-disable no-underscore-dangle */
import { getStoryTitle } from 'storybook/internal/common';
import { formatCsf, loadCsf } from 'storybook/internal/csf-tools';
import type { StoriesEntry } from 'storybook/internal/types';

import * as t from '@babel/types';

import type { InternalOptions } from './types';

function getUtilityImports() {
  return [
    t.importDeclaration(
      [t.importSpecifier(t.identifier('__test'), t.identifier('test'))],
      t.stringLiteral('vitest')
    ),
    t.importDeclaration(
      [t.importSpecifier(t.identifier('__composeStory'), t.identifier('composeStory'))],
      t.stringLiteral('storybook/internal/preview-api')
    ),
    t.importDeclaration(
      [
        t.importSpecifier(t.identifier('__testStory'), t.identifier('testStory')),
        t.importSpecifier(t.identifier('__isValidTest'), t.identifier('isValidTest')),
      ],
      t.stringLiteral('@storybook/experimental-addon-vitest/internal/test-utils')
    ),
  ];
}

const getTestStatementForStory = ({
  exportName,
  node,
  metaExportName,
  tagsFilter,
}: {
  exportName: string;
  node: t.Node;
  tagsFilter: string;
  metaExportName: string;
}) => {
  const composedStoryVarName = `___${exportName}Composed`;

  const composeStoryCall = t.variableDeclaration('const', [
    t.variableDeclarator(
      t.identifier(composedStoryVarName),
      t.callExpression(t.identifier('__composeStory'), [
        t.identifier(exportName),
        t.identifier(metaExportName),
      ])
    ),
  ]);
  // Preserve sourcemaps location
  composeStoryCall.loc = node.loc;

  const isValidTestCall = t.ifStatement(
    t.callExpression(t.identifier('__isValidTest'), [
      t.identifier(composedStoryVarName),
      t.identifier(metaExportName),
      t.identifier(tagsFilter),
    ]),
    t.blockStatement([
      t.expressionStatement(
        t.callExpression(t.identifier('__test'), [
          t.stringLiteral(exportName),
          t.callExpression(t.identifier('__testStory'), [
            t.identifier(composedStoryVarName),
            t.identifier(tagsFilter),
          ]),
        ])
      ),
    ])
  );
  // Preserve sourcemaps location
  isValidTestCall.loc = node.loc;

  return [composeStoryCall, isValidTestCall];
};

export async function transform({
  code,
  id,
  options,
  stories,
}: {
  code: string;
  id: string;
  options: InternalOptions;
  stories: StoriesEntry[];
}) {
  const isStoryFile = /\.stor(y|ies)\./.test(id);
  if (!isStoryFile) {
    return code;
  }

  const parsed = loadCsf(code, {
    transformInlineMeta: true,
    makeTitle: (title) =>
      title ||
      getStoryTitle({
        storyFilePath: id,
        configDir: options.configDir,
        stories,
      }) ||
      'unknown',
  }).parse();

  const ast = parsed._ast;

  const metaExportName = parsed._metaVariableName!;

  const metaNode = parsed._metaNode as t.ObjectExpression;

  const hasTitleProperty = metaNode.properties.some(
    (prop) => t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'title'
  );

  if (!hasTitleProperty) {
    const title = parsed._meta?.title || 'unknown';
    metaNode.properties.push(t.objectProperty(t.identifier('title'), t.stringLiteral(title)));
  }

  if (!metaNode || !parsed._meta) {
    throw new Error(
      'The Storybook vitest plugin could not detect the meta (default export) object in the story file. \n\nPlease make sure you have a default export with the meta object. If you are using a different export format that is not supported, please file an issue with details about your use case.'
    );
  }

  const tagsFilter = JSON.stringify({
    include: options.tags.include,
    exclude: options.tags.exclude,
    skip: options.tags.skip,
  });

  Object.entries(parsed._storyStatements).forEach(([exportName, node]) => {
    ast.program.body.push(
      ...getTestStatementForStory({ exportName, node, tagsFilter, metaExportName })
    );
  });

  ast.program.body.unshift(...getUtilityImports());

  return formatCsf(parsed, { sourceMaps: true, sourceFileName: id }, code);
}
