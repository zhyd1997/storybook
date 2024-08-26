import { parser, types } from '@storybook/core/babel';

export function valueToAST<T>(literal: T): any {
  if (literal === null) {
    return types.nullLiteral();
  }
  switch (typeof literal) {
    case 'function':
      const ast = parser.parse(literal.toString(), {
        allowReturnOutsideFunction: true,
        allowSuperOutsideMethod: true,
      });

      // @ts-expect-error (it's the contents of the function, it's an expression, trust me)
      return ast.program.body[0]?.expression;

    case 'number':
      return types.numericLiteral(literal);
    case 'string':
      return types.stringLiteral(literal);
    case 'boolean':
      return types.booleanLiteral(literal);
    case 'undefined':
      return types.identifier('undefined');
    default:
      if (Array.isArray(literal)) {
        return types.arrayExpression(literal.map(valueToAST));
      }
      return types.objectExpression(
        Object.keys(literal)
          .filter((k) => {
            // @ts-expect-error (it's a completely unknown object)
            const value = literal[k];
            return typeof value !== 'undefined';
          })
          .map((k) => {
            // @ts-expect-error (it's a completely unknown object)
            const value = literal[k];
            return types.objectProperty(types.stringLiteral(k), valueToAST(value));
          })
      );
  }
}
