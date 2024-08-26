import { types } from '@storybook/core/babel';

export const findVarInitialization = (identifier: string, program: types.Program) => {
  let init: types.Expression = null as any;
  let declarations: types.VariableDeclarator[] = null as any;
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
      declarations.find((decl: types.Node) => {
        if (
          types.isVariableDeclarator(decl) &&
          types.isIdentifier(decl.id) &&
          decl.id.name === identifier
        ) {
          init = decl.init as types.Expression;
          return true; // stop looking
        }
        return false;
      })
    );
  });
  return init;
};
