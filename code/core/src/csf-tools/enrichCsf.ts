/* eslint-disable no-underscore-dangle */
import { generate, types } from '@storybook/core/babel';

import type { CsfFile } from './CsfFile';

export interface EnrichCsfOptions {
  disableSource?: boolean;
  disableDescription?: boolean;
}

export const enrichCsfStory = (
  csf: CsfFile,
  csfSource: CsfFile,
  key: string,
  options?: EnrichCsfOptions
) => {
  const storyExport = csfSource.getStoryExport(key);
  const source = !options?.disableSource && extractSource(storyExport);
  const description =
    !options?.disableDescription && extractDescription(csfSource._storyStatements[key]);
  const parameters = [];
  const originalParameters = types.memberExpression(
    types.identifier(key),
    types.identifier('parameters')
  );
  parameters.push(types.spreadElement(originalParameters));
  const optionalDocs = types.optionalMemberExpression(
    originalParameters,
    types.identifier('docs'),
    false,
    true
  );
  const extraDocsParameters = [];

  // docs: { source: { originalSource: %%source%% } },
  if (source) {
    const optionalSource = types.optionalMemberExpression(
      optionalDocs,
      types.identifier('source'),
      false,
      true
    );

    extraDocsParameters.push(
      types.objectProperty(
        types.identifier('source'),
        types.objectExpression([
          types.objectProperty(types.identifier('originalSource'), types.stringLiteral(source)),
          types.spreadElement(optionalSource),
        ])
      )
    );
  }

  // docs: { description: { story: %%description%% } },
  if (description) {
    const optionalDescription = types.optionalMemberExpression(
      optionalDocs,
      types.identifier('description'),
      false,
      true
    );
    extraDocsParameters.push(
      types.objectProperty(
        types.identifier('description'),
        types.objectExpression([
          types.objectProperty(types.identifier('story'), types.stringLiteral(description)),
          types.spreadElement(optionalDescription),
        ])
      )
    );
  }

  if (extraDocsParameters.length > 0) {
    parameters.push(
      types.objectProperty(
        types.identifier('docs'),
        types.objectExpression([types.spreadElement(optionalDocs), ...extraDocsParameters])
      )
    );
    const addParameter = types.expressionStatement(
      types.assignmentExpression('=', originalParameters, types.objectExpression(parameters))
    );
    csf._ast.program.body.push(addParameter);
  }
};

const addComponentDescription = (
  node: types.ObjectExpression,
  path: string[],
  value: types.ObjectProperty
) => {
  if (!path.length) {
    const hasExistingComponent = node.properties.find(
      (p) => types.isObjectProperty(p) && types.isIdentifier(p.key) && p.key.name === 'component'
    );
    if (!hasExistingComponent) {
      // make this the lowest-priority so that if the user is object-spreading on top of it,
      // the users' code will "win"
      node.properties.unshift(value);
    }
    return;
  }
  const [first, ...rest] = path;
  const existing = node.properties.find(
    (p) =>
      types.isObjectProperty(p) &&
      types.isIdentifier(p.key) &&
      p.key.name === first &&
      types.isObjectExpression(p.value)
  );
  let subNode: types.ObjectExpression;
  if (existing) {
    subNode = (existing as types.ObjectProperty).value as types.ObjectExpression;
  } else {
    subNode = types.objectExpression([]);
    node.properties.push(types.objectProperty(types.identifier(first), subNode));
  }
  addComponentDescription(subNode, rest, value);
};

export const enrichCsfMeta = (csf: CsfFile, csfSource: CsfFile, options?: EnrichCsfOptions) => {
  const description = !options?.disableDescription && extractDescription(csfSource._metaStatement);
  // docs: { description: { component: %%description%% } },
  if (description) {
    const metaNode = csf._metaNode;
    if (metaNode && types.isObjectExpression(metaNode)) {
      addComponentDescription(
        metaNode,
        ['parameters', 'docs', 'description'],
        types.objectProperty(types.identifier('component'), types.stringLiteral(description))
      );
    }
  }
};

export const enrichCsf = (csf: CsfFile, csfSource: CsfFile, options?: EnrichCsfOptions) => {
  enrichCsfMeta(csf, csfSource, options);
  Object.keys(csf._storyExports).forEach((key) => {
    enrichCsfStory(csf, csfSource, key, options);
  });
};

export const extractSource = (node: types.Node) => {
  const src = types.isVariableDeclarator(node) ? node.init : node;
  const { code } = generate(src as types.Node, {});
  return code;
};

export const extractDescription = (node?: types.Node) => {
  if (!node?.leadingComments) {
    return '';
  }
  const comments = node.leadingComments
    .map((comment) => {
      if (comment.type === 'CommentLine' || !comment.value.startsWith('*')) {
        return null;
      }
      return (
        comment.value
          .split('\n')
          // remove leading *'s and spaces from the beginning of each line
          .map((line) => line.replace(/^(\s+)?(\*+)?(\s)?/, ''))
          .join('\n')
          .trim()
      );
    })
    .filter(Boolean);
  return comments.join('\n');
};
