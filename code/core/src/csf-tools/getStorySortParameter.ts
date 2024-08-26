import { generate, traverse, types } from '@storybook/core/babel';

import { dedent } from 'ts-dedent';

import { babelParse } from '../babel/babelParse';
import { findVarInitialization } from './findVarInitialization';

const logger = console;

const getValue = (obj: types.ObjectExpression, key: string) => {
  let value: types.Expression | undefined;
  (obj.properties as types.ObjectProperty[]).forEach((p) => {
    if (types.isIdentifier(p.key) && p.key.name === key) {
      value = p.value as types.Expression;
    }
  });
  return value;
};

const parseValue = (value: types.Expression): any => {
  const expr = stripTSModifiers(value);

  if (types.isArrayExpression(expr)) {
    return (expr.elements as types.Expression[]).map((o) => {
      return parseValue(o);
    });
  }
  if (types.isObjectExpression(expr)) {
    return (expr.properties as types.ObjectProperty[]).reduce((acc, p) => {
      if (types.isIdentifier(p.key)) {
        acc[p.key.name] = parseValue(p.value as types.Expression);
      }
      return acc;
    }, {} as any);
  }
  if (types.isLiteral(expr)) {
    // @ts-expect-error (Converted from ts-ignore)
    return expr.value;
  }
  if (types.isIdentifier(expr)) {
    return unsupported(expr.name, true);
  }
  throw new Error(`Unknown node type ${expr.type}`);
};

const unsupported = (unexpectedVar: string, isError: boolean) => {
  const message = dedent`
    Unexpected '${unexpectedVar}'. Parameter 'options.storySort' should be defined inline e.g.:

    export default {
      parameters: {
        options: {
          storySort: <array | object | function>
        },
      },
    };
  `;
  if (isError) {
    throw new Error(message);
  } else {
    logger.info(message);
  }
};

const stripTSModifiers = (expr: types.Expression): types.Expression =>
  types.isTSAsExpression(expr) || types.isTSSatisfiesExpression(expr) ? expr.expression : expr;

const parseParameters = (params: types.Expression): types.Expression | undefined => {
  const paramsObject = stripTSModifiers(params);
  if (types.isObjectExpression(paramsObject)) {
    const options = getValue(paramsObject, 'options');
    if (options) {
      if (types.isObjectExpression(options)) {
        return getValue(options, 'storySort');
      }
      unsupported('options', true);
    }
  }
  return undefined;
};

const parseDefault = (
  defaultExpr: types.Expression,
  program: types.Program
): types.Expression | undefined => {
  const defaultObj = stripTSModifiers(defaultExpr);
  if (types.isObjectExpression(defaultObj)) {
    let params = getValue(defaultObj, 'parameters');
    if (types.isIdentifier(params)) {
      params = findVarInitialization(params.name, program);
    }
    if (params) {
      return parseParameters(params);
    }
  } else {
    unsupported('default', true);
  }
  return undefined;
};

export const getStorySortParameter = (previewCode: string) => {
  // don't even try to process the file
  if (!previewCode.includes('storySort')) {
    return undefined;
  }

  let storySort: types.Expression | undefined;
  const ast = babelParse(previewCode);
  traverse(ast, {
    ExportNamedDeclaration: {
      enter({ node }) {
        if (types.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations.forEach((decl) => {
            if (types.isVariableDeclarator(decl) && types.isIdentifier(decl.id)) {
              const { name: exportName } = decl.id;
              if (exportName === 'parameters' && decl.init) {
                const paramsObject = stripTSModifiers(decl.init);
                storySort = parseParameters(paramsObject);
              }
            }
          });
        } else {
          node.specifiers.forEach((spec) => {
            if (types.isIdentifier(spec.exported) && spec.exported.name === 'parameters') {
              unsupported('parameters', false);
            }
          });
        }
      },
    },
    ExportDefaultDeclaration: {
      enter({ node }) {
        let defaultObj = node.declaration as types.Expression;
        if (types.isIdentifier(defaultObj)) {
          defaultObj = findVarInitialization(defaultObj.name, ast.program);
        }
        defaultObj = stripTSModifiers(defaultObj);
        if (types.isObjectExpression(defaultObj)) {
          storySort = parseDefault(defaultObj, ast.program);
        } else {
          unsupported('default', false);
        }
      },
    },
  });

  if (!storySort) {
    return undefined;
  }

  if (types.isArrowFunctionExpression(storySort)) {
    const { code: sortCode } = generate(storySort, {});

    return (0, eval)(sortCode);
  }

  if (types.isFunctionExpression(storySort)) {
    const { code: sortCode } = generate(storySort, {});
    const functionName = storySort.id?.name;
    // Wrap the function within an arrow function, call it, and return
    const wrapper = `(a, b) => {
      ${sortCode};
      return ${functionName}(a, b)
    }`;

    return (0, eval)(wrapper);
  }

  if (
    types.isLiteral(storySort) ||
    types.isArrayExpression(storySort) ||
    types.isObjectExpression(storySort)
  ) {
    return parseValue(storySort);
  }

  return unsupported('storySort', true);
};
