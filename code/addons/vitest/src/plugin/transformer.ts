import * as babel from '@babel/core';
import generate from '@babel/generator';
import { parse } from '@babel/parser';
import * as t from '@babel/types';

export async function transform({ code, id, options, stories = [] }) {
  const isStoryFile = /\.stor(y|ies)\./.test(id);
  if (!isStoryFile) {
    return code;
  }

  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  let metaExportName = '__STORYBOOK_META__';
  const declarationMap = new Map<string, any>();
  const exportsToAdd = new Map<string, any[]>();

  const modifyMeta = (node) => {
    if (t.isIdentifier(node)) {
      metaExportName = node.name;
      const metaDeclaration = ast.program.body.find(
        (stmt) =>
          t.isVariableDeclaration(stmt) &&
          stmt.declarations.some(
            (decl) => t.isIdentifier(decl.id) && decl.id.name === metaExportName
          )
      );

      if (metaDeclaration) {
        const metaObjectLiteral = metaDeclaration.declarations[0].init;
        if (
          t.isObjectExpression(metaObjectLiteral) &&
          !metaObjectLiteral.properties.some(
            (prop) =>
              t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'title'
          )
        ) {
          const title = 'automatic/calculated/title';
          if (title) {
            metaObjectLiteral.properties.push(
              t.objectProperty(t.identifier('title'), t.stringLiteral(title))
            );
          }
        }
      }
    } else if (t.isObjectExpression(node)) {
      const hasTitleProperty = node.properties.some(
        (prop) => t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'title'
      );

      if (!hasTitleProperty) {
        const title = 'automatic/calculated/title';
        if (title) {
          node.properties.push(t.objectProperty(t.identifier('title'), t.stringLiteral(title)));
        }
      }

      const variableDeclaration = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(metaExportName), node),
      ]);
      const exportDefaultDeclaration = t.exportDefaultDeclaration(t.identifier(metaExportName));

      return [variableDeclaration, exportDefaultDeclaration];
    }

    return null;
  };

  let defaultExportPath = null;

  babel.traverse(ast, {
    ExportDefaultDeclaration(path) {
      defaultExportPath = path;
      const newNodes = modifyMeta(path.node.declaration);
      if (newNodes) {
        newNodes.forEach((node) => (node.loc = path.node.loc)); // Preserve location
        path.replaceWithMultiple(newNodes);
      }
    },
  });

  if (!defaultExportPath) {
    throw new Error(
      'The Storybook vitest plugin could not detect the meta (default export) object in the story file. \n\nPlease make sure you have a default export with the meta object. If you are using a different export format that is not supported, please file an issue with details about your use case.'
    );
  }

  babel.traverse(ast, {
    VariableDeclaration(path) {
      path.node.declarations.forEach((decl) => {
        if (t.isIdentifier(decl.id)) {
          declarationMap.set(decl.id.name, path.node);
        }
      });
    },
  });

  const addTestStatementToStory = (exportName, node) => {
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
    composeStoryCall.loc = node.loc; // Preserve location

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
    isValidTestCall.loc = node.loc; // Preserve location

    return [composeStoryCall, isValidTestCall];
  };

  const tagsFilter = JSON.stringify({
    include: options.tags.include,
    exclude: options.tags.exclude,
    skip: options.tags.skip,
  });

  const exportNamedDeclarations = [];

  babel.traverse(ast, {
    ExportNamedDeclaration(path) {
      if (path.node.declaration) {
        if (t.isVariableDeclaration(path.node.declaration)) {
          path.node.declaration.declarations.forEach((declaration) => {
            if (t.isIdentifier(declaration.id)) {
              const exportName = declaration.id.name;
              if (!exportsToAdd.has(exportName)) {
                const nodes = addTestStatementToStory(exportName, declarationMap.get(exportName));
                nodes.forEach((node) => (node.loc = declarationMap.get(exportName).loc)); // Preserve location
                exportsToAdd.set(exportName, nodes);
              }
            }
          });
        }
      } else if (path.node.specifiers) {
        path.node.specifiers.forEach((specifier) => {
          const declaration = declarationMap.get(specifier.local.name);
          if (declaration) {
            const exportName = specifier.local.name;
            if (!exportsToAdd.has(exportName)) {
              const nodes = addTestStatementToStory(exportName, declaration);
              nodes.forEach((node) => (node.loc = declarationMap.get(exportName).loc)); // Preserve location
              exportsToAdd.set(exportName, nodes);
            }
          }
        });
      }

      // Collect the export named declarations to be handled later
      exportNamedDeclarations.push(path.node);
      path.remove(); // Remove the original export to avoid duplication
    },
  });

  // Append the new exports and test-related nodes after handling all export declarations
  exportNamedDeclarations.forEach((node) => {
    ast.program.body.push(node);
  });

  exportsToAdd.forEach((nodes) => {
    ast.program.body.push(...nodes);
  });

  const imports = [
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

  ast.program.body.unshift(...imports);

  const fn = generate.default ?? generate;

  const output = fn(ast, { sourceMaps: true, sourceFileName: id });

  return {
    code: output.code,
    map: output.map,
  };
}
