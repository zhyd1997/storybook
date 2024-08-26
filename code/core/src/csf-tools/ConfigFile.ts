/* eslint-disable no-underscore-dangle */
import { readFile, writeFile } from 'node:fs/promises';

import { type RecastOptions, generate, recast, traverse, types } from '@storybook/core/babel';

import { dedent } from 'ts-dedent';

import { babelParse } from '../babel/babelParse';
import type { PrintResultType } from './PrintResultType';

const logger = console;

const getCsfParsingErrorMessage = ({
  expectedType,
  foundType,
  node,
}: {
  expectedType: string;
  foundType: string | undefined;
  node: any | undefined;
}) => {
  let nodeInfo = '';
  if (node) {
    try {
      nodeInfo = JSON.stringify(node);
    } catch (e) {
      //
    }
  }

  return dedent`
      CSF Parsing error: Expected '${expectedType}' but found '${foundType}' instead in '${node?.type}'.
      ${nodeInfo}
    `;
};

const propKey = (p: types.ObjectProperty) => {
  if (types.isIdentifier(p.key)) {
    return p.key.name;
  }

  if (types.isStringLiteral(p.key)) {
    return p.key.value;
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const _getPath = (path: string[], node: types.Node): types.Node | undefined => {
  if (path.length === 0) {
    return node;
  }
  if (types.isObjectExpression(node)) {
    const [first, ...rest] = path;
    const field = (node.properties as types.ObjectProperty[]).find((p) => propKey(p) === first);
    if (field) {
      return _getPath(rest, (field as types.ObjectProperty).value);
    }
  }
  return undefined;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const _getPathProperties = (
  path: string[],
  node: types.Node
): types.ObjectProperty[] | undefined => {
  if (path.length === 0) {
    if (types.isObjectExpression(node)) {
      return node.properties as types.ObjectProperty[];
    }
    throw new Error('Expected object expression');
  }
  if (types.isObjectExpression(node)) {
    const [first, ...rest] = path;
    const field = (node.properties as types.ObjectProperty[]).find((p) => propKey(p) === first);
    if (field) {
      // FXIME handle spread etc.
      if (rest.length === 0) {
        return node.properties as types.ObjectProperty[];
      }

      return _getPathProperties(rest, (field as types.ObjectProperty).value);
    }
  }
  return undefined;
};
// eslint-disable-next-line @typescript-eslint/naming-convention
const _findVarDeclarator = (
  identifier: string,
  program: types.Program
): types.VariableDeclarator | null | undefined => {
  let declarator: types.VariableDeclarator | null | undefined = null;
  let declarations: types.VariableDeclarator[] | null = null;
  program.body.find((node: types.Node) => {
    if (types.isVariableDeclaration(node)) {
      declarations = node.declarations;
    } else if (
      types.isExportNamedDeclaration(node) &&
      types.isVariableDeclaration(node.declaration)
    ) {
      declarations = node.declaration.declarations;
    }

    return (
      declarations &&
      declarations.find((decl: types.VariableDeclarator) => {
        if (
          types.isVariableDeclarator(decl) &&
          types.isIdentifier(decl.id) &&
          decl.id.name === identifier
        ) {
          declarator = decl;
          return true; // stop looking
        }
        return false;
      })
    );
  });
  return declarator;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const _findVarInitialization = (identifier: string, program: types.Program) => {
  const declarator = _findVarDeclarator(identifier, program);
  return declarator?.init;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const _makeObjectExpression = (path: string[], value: types.Expression): types.Expression => {
  if (path.length === 0) {
    return value;
  }
  const [first, ...rest] = path;
  const innerExpression = _makeObjectExpression(rest, value);
  return types.objectExpression([types.objectProperty(types.identifier(first), innerExpression)]);
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const _updateExportNode = (
  path: string[],
  expr: types.Expression,
  existing: types.ObjectExpression
) => {
  const [first, ...rest] = path;
  const existingField = (existing.properties as types.ObjectProperty[]).find(
    (p) => propKey(p) === first
  ) as types.ObjectProperty;
  if (!existingField) {
    existing.properties.push(
      types.objectProperty(types.identifier(first), _makeObjectExpression(rest, expr))
    );
  } else if (types.isObjectExpression(existingField.value) && rest.length > 0) {
    _updateExportNode(rest, expr, existingField.value);
  } else {
    existingField.value = _makeObjectExpression(rest, expr);
  }
};

export class ConfigFile {
  _ast: types.File;

  _code: string;

  _exports: Record<string, types.Expression> = {};

  // FIXME: this is a hack. this is only used in the case where the user is
  // modifying a named export that's a scalar. The _exports map is not suitable
  // for that. But rather than refactor the whole thing, we just use this as a stopgap.
  _exportDecls: Record<string, types.VariableDeclarator> = {};

  _exportsObject: types.ObjectExpression | undefined;

  _quotes: 'single' | 'double' | undefined;

  fileName?: string;

  hasDefaultExport = false;

  constructor(ast: types.File, code: string, fileName?: string) {
    this._ast = ast;
    this._code = code;
    this.fileName = fileName;
  }

  parse() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    traverse(this._ast, {
      ExportDefaultDeclaration: {
        enter({ node, parent }) {
          self.hasDefaultExport = true;
          let decl =
            types.isIdentifier(node.declaration) && types.isProgram(parent)
              ? _findVarInitialization(node.declaration.name, parent)
              : node.declaration;

          if (types.isTSAsExpression(decl) || types.isTSSatisfiesExpression(decl)) {
            decl = decl.expression;
          }

          if (types.isObjectExpression(decl)) {
            self._exportsObject = decl;
            (decl.properties as types.ObjectProperty[]).forEach((p) => {
              const exportName = propKey(p);
              if (exportName) {
                let exportVal = p.value;
                if (types.isIdentifier(exportVal)) {
                  exportVal = _findVarInitialization(
                    exportVal.name,
                    parent as types.Program
                  ) as any;
                }
                self._exports[exportName] = exportVal as types.Expression;
              }
            });
          } else {
            logger.warn(
              getCsfParsingErrorMessage({
                expectedType: 'ObjectExpression',
                foundType: decl?.type,
                node: decl || node.declaration,
              })
            );
          }
        },
      },
      ExportNamedDeclaration: {
        enter({ node, parent }) {
          if (types.isVariableDeclaration(node.declaration)) {
            // export const X = ...;
            node.declaration.declarations.forEach((decl) => {
              if (types.isVariableDeclarator(decl) && types.isIdentifier(decl.id)) {
                const { name: exportName } = decl.id;
                let exportVal = decl.init as types.Expression;
                if (types.isIdentifier(exportVal)) {
                  exportVal = _findVarInitialization(
                    exportVal.name,
                    parent as types.Program
                  ) as any;
                }
                self._exports[exportName] = exportVal;
                self._exportDecls[exportName] = decl;
              }
            });
          } else if (node.specifiers) {
            // export { X };
            node.specifiers.forEach((spec) => {
              if (
                types.isExportSpecifier(spec) &&
                types.isIdentifier(spec.local) &&
                types.isIdentifier(spec.exported)
              ) {
                const { name: localName } = spec.local;
                const { name: exportName } = spec.exported;
                const decl = _findVarDeclarator(localName, parent as types.Program) as any;
                self._exports[exportName] = decl.init;
                self._exportDecls[exportName] = decl;
              }
            });
          } else {
            logger.warn(
              getCsfParsingErrorMessage({
                expectedType: 'VariableDeclaration',
                foundType: node.declaration?.type,
                node: node.declaration,
              })
            );
          }
        },
      },
      ExpressionStatement: {
        enter({ node, parent }) {
          if (types.isAssignmentExpression(node.expression) && node.expression.operator === '=') {
            const { left, right } = node.expression;
            if (
              types.isMemberExpression(left) &&
              types.isIdentifier(left.object) &&
              left.object.name === 'module' &&
              types.isIdentifier(left.property) &&
              left.property.name === 'exports'
            ) {
              let exportObject = right;
              if (types.isIdentifier(right)) {
                exportObject = _findVarInitialization(right.name, parent as types.Program) as any;
              }

              if (
                types.isTSAsExpression(exportObject) ||
                types.isTSSatisfiesExpression(exportObject)
              ) {
                exportObject = exportObject.expression;
              }

              if (types.isObjectExpression(exportObject)) {
                self._exportsObject = exportObject;
                (exportObject.properties as types.ObjectProperty[]).forEach((p) => {
                  const exportName = propKey(p);
                  if (exportName) {
                    let exportVal = p.value as types.Expression;
                    if (types.isIdentifier(exportVal)) {
                      exportVal = _findVarInitialization(
                        exportVal.name,
                        parent as types.Program
                      ) as any;
                    }
                    self._exports[exportName] = exportVal as types.Expression;
                  }
                });
              } else {
                logger.warn(
                  getCsfParsingErrorMessage({
                    expectedType: 'ObjectExpression',
                    foundType: exportObject?.type,
                    node: exportObject,
                  })
                );
              }
            }
          }
        },
      },
    });
    return self;
  }

  getFieldNode(path: string[]) {
    const [root, ...rest] = path;
    const exported = this._exports[root];

    if (!exported) {
      return undefined;
    }
    return _getPath(rest, exported);
  }

  getFieldProperties(path: string[]) {
    const [root, ...rest] = path;
    const exported = this._exports[root];

    if (!exported) {
      return undefined;
    }
    return _getPathProperties(rest, exported);
  }

  getFieldValue<T = any>(path: string[]): T | undefined {
    const node = this.getFieldNode(path);
    if (node) {
      const { code } = generate(node, {});

      const value = (0, eval)(`(() => (${code}))()`);
      return value;
    }
    return undefined;
  }

  getSafeFieldValue(path: string[]) {
    try {
      return this.getFieldValue(path);
    } catch (e) {
      //
    }
    return undefined;
  }

  setFieldNode(path: string[], expr: types.Expression) {
    const [first, ...rest] = path;
    const exportNode = this._exports[first];
    if (this._exportsObject) {
      _updateExportNode(path, expr, this._exportsObject);
      this._exports[path[0]] = expr;
    } else if (exportNode && types.isObjectExpression(exportNode) && rest.length > 0) {
      _updateExportNode(rest, expr, exportNode);
    } else if (exportNode && rest.length === 0 && this._exportDecls[path[0]]) {
      const decl = this._exportDecls[path[0]];
      decl.init = _makeObjectExpression([], expr);
    } else if (this.hasDefaultExport) {
      // This means the main.js of the user has a default export that is not an object expression, therefore we can'types change the AST.
      throw new Error(
        `Could not set the "${path.join(
          '.'
        )}" field as the default export is not an object in this file.`
      );
    } else {
      // create a new named export and add it to the top level
      const exportObj = _makeObjectExpression(rest, expr);
      const newExport = types.exportNamedDeclaration(
        types.variableDeclaration('const', [
          types.variableDeclarator(types.identifier(first), exportObj),
        ])
      );
      this._exports[first] = exportObj;
      this._ast.program.body.push(newExport);
    }
  }

  /**
   * @example
   *
   * ```ts
   * // 1. { framework: 'framework-name' }
   * // 2. { framework: { name: 'framework-name', options: {} }
   * getNameFromPath(['framework']); // => 'framework-name'
   * ```
   *
   * @returns The name of a node in a given path, supporting the following formats:
   */

  getNameFromPath(path: string[]): string | undefined {
    const node = this.getFieldNode(path);
    if (!node) {
      return undefined;
    }

    return this._getPresetValue(node, 'name');
  }

  /**
   * Returns an array of names of a node in a given path, supporting the following formats:
   *
   * @example
   *
   * ```ts
   * const config = {
   *   addons: ['first-addon', { name: 'second-addon', options: {} }],
   * };
   * // => ['first-addon', 'second-addon']
   * getNamesFromPath(['addons']);
   * ```
   */
  getNamesFromPath(path: string[]): string[] | undefined {
    const node = this.getFieldNode(path);
    if (!node) {
      return undefined;
    }

    const pathNames: string[] = [];
    if (types.isArrayExpression(node)) {
      (node.elements as types.Expression[]).forEach((element) => {
        pathNames.push(this._getPresetValue(element, 'name'));
      });
    }

    return pathNames;
  }

  _getPnpWrappedValue(node: types.Node) {
    if (types.isCallExpression(node)) {
      const arg = node.arguments[0];
      if (types.isStringLiteral(arg)) {
        return arg.value;
      }
    }
    return undefined;
  }

  /**
   * Given a node and a fallback property, returns a **non-evaluated** string value of the node.
   *
   * 1. `{ node: 'value' }`
   * 2. `{ node: { fallbackProperty: 'value' } }`
   */
  _getPresetValue(node: types.Node, fallbackProperty: string) {
    let value;
    if (types.isStringLiteral(node)) {
      value = node.value;
    } else if (types.isObjectExpression(node)) {
      node.properties.forEach((prop) => {
        // { framework: { name: 'value' } }
        if (
          types.isObjectProperty(prop) &&
          types.isIdentifier(prop.key) &&
          prop.key.name === fallbackProperty
        ) {
          if (types.isStringLiteral(prop.value)) {
            value = prop.value.value;
          } else {
            value = this._getPnpWrappedValue(prop.value);
          }
        }

        // { "framework": { "name": "value" } }
        if (
          types.isObjectProperty(prop) &&
          types.isStringLiteral(prop.key) &&
          prop.key.value === 'name' &&
          types.isStringLiteral(prop.value)
        ) {
          value = prop.value.value;
        }
      });
    }

    if (!value) {
      throw new Error(
        `The given node must be a string literal or an object expression with a "${fallbackProperty}" property that is a string literal.`
      );
    }

    return value;
  }

  removeField(path: string[]) {
    const removeProperty = (properties: types.ObjectProperty[], prop: string) => {
      const index = properties.findIndex(
        (p) =>
          (types.isIdentifier(p.key) && p.key.name === prop) ||
          (types.isStringLiteral(p.key) && p.key.value === prop)
      );
      if (index >= 0) {
        properties.splice(index, 1);
      }
    };
    // the structure of this._exports doesn'types work for this use case
    // so we have to manually bypass it here
    if (path.length === 1) {
      let removedRootProperty = false;
      // removing the root export
      this._ast.program.body.forEach((node) => {
        // named export
        if (types.isExportNamedDeclaration(node) && types.isVariableDeclaration(node.declaration)) {
          const decl = node.declaration.declarations[0];
          if (types.isIdentifier(decl.id) && decl.id.name === path[0]) {
            this._ast.program.body.splice(this._ast.program.body.indexOf(node), 1);
            removedRootProperty = true;
          }
        }
        // default export
        if (types.isExportDefaultDeclaration(node)) {
          let decl: types.Expression | undefined | null = node.declaration as types.Expression;
          if (types.isIdentifier(decl)) {
            decl = _findVarInitialization(decl.name, this._ast.program);
          }
          if (types.isTSAsExpression(decl) || types.isTSSatisfiesExpression(decl)) {
            decl = decl.expression;
          }
          if (types.isObjectExpression(decl)) {
            const properties = decl.properties as types.ObjectProperty[];
            removeProperty(properties, path[0]);
            removedRootProperty = true;
          }
        }
        // module.exports
        if (
          types.isExpressionStatement(node) &&
          types.isAssignmentExpression(node.expression) &&
          types.isMemberExpression(node.expression.left) &&
          types.isIdentifier(node.expression.left.object) &&
          node.expression.left.object.name === 'module' &&
          types.isIdentifier(node.expression.left.property) &&
          node.expression.left.property.name === 'exports' &&
          types.isObjectExpression(node.expression.right)
        ) {
          const properties = node.expression.right.properties as types.ObjectProperty[];
          removeProperty(properties, path[0]);
          removedRootProperty = true;
        }
      });

      if (removedRootProperty) {
        return;
      }
    }

    const properties = this.getFieldProperties(path) as types.ObjectProperty[];
    if (properties) {
      const lastPath = path.at(-1) as string;
      removeProperty(properties, lastPath);
    }
  }

  appendValueToArray(path: string[], value: any) {
    const node = this.valueToNode(value);

    if (node) {
      this.appendNodeToArray(path, node);
    }
  }

  appendNodeToArray(path: string[], node: types.Expression) {
    const current = this.getFieldNode(path);
    if (!current) {
      this.setFieldNode(path, types.arrayExpression([node]));
    } else if (types.isArrayExpression(current)) {
      current.elements.push(node);
    } else {
      throw new Error(`Expected array at '${path.join('.')}', got '${current.type}'`);
    }
  }

  /**
   * Specialized helper to remove addons or other array entries that can either be strings or
   * objects with a name property.
   */
  removeEntryFromArray(path: string[], value: string) {
    const current = this.getFieldNode(path);

    if (!current) {
      return;
    }
    if (types.isArrayExpression(current)) {
      const index = current.elements.findIndex((element) => {
        if (types.isStringLiteral(element)) {
          return element.value === value;
        }
        if (types.isObjectExpression(element)) {
          const name = this._getPresetValue(element, 'name');
          return name === value;
        }
        return this._getPnpWrappedValue(element as types.Node) === value;
      });
      if (index >= 0) {
        current.elements.splice(index, 1);
      } else {
        throw new Error(`Could not find '${value}' in array at '${path.join('.')}'`);
      }
    } else {
      throw new Error(`Expected array at '${path.join('.')}', got '${current.type}'`);
    }
  }

  _inferQuotes() {
    if (!this._quotes) {
      // first 500 tokens for efficiency
      const occurrences = (this._ast.tokens || []).slice(0, 500).reduce(
        (acc, token) => {
          if (token.type.label === 'string') {
            acc[this._code[token.start]] += 1;
          }
          return acc;
        },
        { "'": 0, '"': 0 }
      );
      this._quotes = occurrences["'"] > occurrences['"'] ? 'single' : 'double';
    }
    return this._quotes;
  }

  valueToNode(value: any) {
    const quotes = this._inferQuotes();
    let valueNode;
    // we do this rather than types.valueToNode because apparently
    // babel only preserves quotes if they are parsed from the original code.
    if (quotes === 'single') {
      const { code } = generate(types.valueToNode(value), { jsescOption: { quotes } });
      const program = babelParse(`const __x = ${code}`);
      traverse(program, {
        VariableDeclaration: {
          enter({ node }) {
            if (
              node.declarations.length === 1 &&
              types.isVariableDeclarator(node.declarations[0]) &&
              types.isIdentifier(node.declarations[0].id) &&
              node.declarations[0].id.name === '__x'
            ) {
              valueNode = node.declarations[0].init;
            }
          },
        },
      });
    } else {
      // double quotes is the default so we can skip all that
      valueNode = types.valueToNode(value);
    }
    return valueNode;
  }

  setFieldValue(path: string[], value: any) {
    const valueNode = this.valueToNode(value);
    if (!valueNode) {
      throw new Error(`Unexpected value ${JSON.stringify(value)}`);
    }
    this.setFieldNode(path, valueNode);
  }

  getBodyDeclarations() {
    return this._ast.program.body;
  }

  setBodyDeclaration(declaration: types.Declaration) {
    this._ast.program.body.push(declaration);
  }

  /**
   * Import specifiers for a specific require import
   *
   * @example
   *
   * ```ts
   * // const { foo } = require('bar');
   * setRequireImport(['foo'], 'bar');
   *
   * // const foo = require('bar');
   * setRequireImport('foo', 'bar');
   * ```
   *
   * @param importSpecifiers - The import specifiers to set. If a string is passed in, a default
   *   import will be set. Otherwise, an array of named imports will be set
   * @param fromImport - The module to import from
   */
  setRequireImport(importSpecifier: string[] | string, fromImport: string) {
    const requireDeclaration = this._ast.program.body.find(
      (node) =>
        types.isVariableDeclaration(node) &&
        node.declarations.length === 1 &&
        types.isVariableDeclarator(node.declarations[0]) &&
        types.isCallExpression(node.declarations[0].init) &&
        types.isIdentifier(node.declarations[0].init.callee) &&
        node.declarations[0].init.callee.name === 'require' &&
        types.isStringLiteral(node.declarations[0].init.arguments[0]) &&
        node.declarations[0].init.arguments[0].value === fromImport
    ) as types.VariableDeclaration | undefined;

    /**
     * Returns true, when the given import declaration has the given import specifier
     *
     * @example
     *
     * ```ts
     * // const { foo } = require('bar');
     * hasImportSpecifier(declaration, 'foo');
     * ```
     */
    const hasRequireSpecifier = (name: string) =>
      types.isObjectPattern(requireDeclaration?.declarations[0].id) &&
      requireDeclaration?.declarations[0].id.properties.find(
        (specifier) =>
          types.isObjectProperty(specifier) &&
          types.isIdentifier(specifier.key) &&
          specifier.key.name === name
      );

    /**
     * Returns true, when the given import declaration has the given default import specifier
     *
     * @example
     *
     * ```ts
     * // import foo from 'bar';
     * hasImportSpecifier(declaration, 'foo');
     * ```
     */
    const hasDefaultRequireSpecifier = (declaration: types.VariableDeclaration, name: string) =>
      declaration.declarations.length === 1 &&
      types.isVariableDeclarator(declaration.declarations[0]) &&
      types.isIdentifier(declaration.declarations[0].id) &&
      declaration.declarations[0].id.name === name;

    // if the import specifier is a string, we're dealing with default imports
    if (typeof importSpecifier === 'string') {
      // If the import declaration with the given source exists
      const addDefaultRequireSpecifier = () => {
        this._ast.program.body.unshift(
          types.variableDeclaration('const', [
            types.variableDeclarator(
              types.identifier(importSpecifier),
              types.callExpression(types.identifier('require'), [types.stringLiteral(fromImport)])
            ),
          ])
        );
      };

      if (requireDeclaration) {
        if (!hasDefaultRequireSpecifier(requireDeclaration, importSpecifier)) {
          // If the import declaration hasn'types the specified default identifier, we add a new variable declaration
          addDefaultRequireSpecifier();
        }
        // If the import declaration with the given source doesn'types exist
      } else {
        // Add the import declaration to the top of the file
        addDefaultRequireSpecifier();
      }
      // if the import specifier is an array, we're dealing with named imports
    } else if (requireDeclaration) {
      importSpecifier.forEach((specifier) => {
        if (!hasRequireSpecifier(specifier)) {
          (requireDeclaration.declarations[0].id as types.ObjectPattern).properties.push(
            types.objectProperty(
              types.identifier(specifier),
              types.identifier(specifier),
              undefined,
              true
            )
          );
        }
      });
    } else {
      this._ast.program.body.unshift(
        types.variableDeclaration('const', [
          types.variableDeclarator(
            types.objectPattern(
              importSpecifier.map((specifier) =>
                types.objectProperty(
                  types.identifier(specifier),
                  types.identifier(specifier),
                  undefined,
                  true
                )
              )
            ),
            types.callExpression(types.identifier('require'), [types.stringLiteral(fromImport)])
          ),
        ])
      );
    }
  }

  /**
   * Set import specifiers for a given import statement.
   *
   * Does not support setting type imports (yet)
   *
   * @example
   *
   * ```ts
   * // import { foo } from 'bar';
   * setImport(['foo'], 'bar');
   *
   * // import foo from 'bar';
   * setImport('foo', 'bar');
   * ```
   *
   * @param importSpecifiers - The import specifiers to set. If a string is passed in, a default
   *   import will be set. Otherwise, an array of named imports will be set
   * @param fromImport - The module to import from
   */
  setImport(importSpecifier: string[] | string, fromImport: string) {
    const getNewImportSpecifier = (specifier: string) =>
      types.importSpecifier(types.identifier(specifier), types.identifier(specifier));

    /**
     * Returns true, when the given import declaration has the given import specifier
     *
     * @example
     *
     * ```ts
     * // import { foo } from 'bar';
     * hasImportSpecifier(declaration, 'foo');
     * ```
     */
    const hasImportSpecifier = (declaration: types.ImportDeclaration, name: string) =>
      declaration.specifiers.find(
        (specifier) =>
          types.isImportSpecifier(specifier) &&
          types.isIdentifier(specifier.imported) &&
          specifier.imported.name === name
      );

    /**
     * Returns true, when the given import declaration has the given default import specifier
     *
     * @example
     *
     * ```ts
     * // import foo from 'bar';
     * hasImportSpecifier(declaration, 'foo');
     * ```
     */
    const hasDefaultImportSpecifier = (declaration: types.ImportDeclaration, name: string) =>
      declaration.specifiers.find((specifier) => types.isImportDefaultSpecifier(specifier));

    const importDeclaration = this._ast.program.body.find(
      (node) => types.isImportDeclaration(node) && node.source.value === fromImport
    ) as types.ImportDeclaration | undefined;

    // if the import specifier is a string, we're dealing with default imports
    if (typeof importSpecifier === 'string') {
      // If the import declaration with the given source exists
      if (importDeclaration) {
        if (!hasDefaultImportSpecifier(importDeclaration, importSpecifier)) {
          // If the import declaration hasn'types a default specifier, we add it
          importDeclaration.specifiers.push(
            types.importDefaultSpecifier(types.identifier(importSpecifier))
          );
        }
        // If the import declaration with the given source doesn'types exist
      } else {
        // Add the import declaration to the top of the file
        this._ast.program.body.unshift(
          types.importDeclaration(
            [types.importDefaultSpecifier(types.identifier(importSpecifier))],
            types.stringLiteral(fromImport)
          )
        );
      }
      // if the import specifier is an array, we're dealing with named imports
    } else if (importDeclaration) {
      importSpecifier.forEach((specifier) => {
        if (!hasImportSpecifier(importDeclaration, specifier)) {
          importDeclaration.specifiers.push(getNewImportSpecifier(specifier));
        }
      });
    } else {
      this._ast.program.body.unshift(
        types.importDeclaration(
          importSpecifier.map((specifier) =>
            types.importSpecifier(types.identifier(specifier), types.identifier(specifier))
          ),
          types.stringLiteral(fromImport)
        )
      );
    }
  }
}

export const loadConfig = (code: string, fileName?: string) => {
  const ast = babelParse(code);
  return new ConfigFile(ast, code, fileName);
};

export const formatConfig = (config: ConfigFile): string => {
  return printConfig(config).code;
};

export const printConfig = (config: ConfigFile, options: RecastOptions = {}): PrintResultType => {
  return recast.print(config._ast, options);
};

export const readConfig = async (fileName: string) => {
  const code = (await readFile(fileName, 'utf-8')).toString();
  return loadConfig(code, fileName).parse();
};

export const writeConfig = async (config: ConfigFile, fileName?: string) => {
  const fname = fileName || config.fileName;

  if (!fname) {
    throw new Error('Please specify a fileName for writeConfig');
  }
  await writeFile(fname, formatConfig(config));
};
