import { traverse, types } from '@storybook/core/babel';

import { SaveStoryError } from './utils';
import { valueToAST } from './valueToAST';

export const updateArgsInCsfFile = async (node: types.Node, input: Record<string, any>) => {
  let found = false;
  const args = Object.fromEntries(
    Object.entries(input).map(([k, v]) => {
      return [k, valueToAST(v)];
    })
  );

  // detect CSF2 and throw
  if (types.isArrowFunctionExpression(node) || types.isCallExpression(node)) {
    throw new SaveStoryError(`Updating a CSF2 story is not supported`);
  }

  if (types.isObjectExpression(node)) {
    const properties = node.properties;
    const argsProperty = properties.find((property) => {
      if (types.isObjectProperty(property)) {
        const key = property.key;
        return types.isIdentifier(key) && key.name === 'args';
      }
      return false;
    });

    if (argsProperty) {
      if (types.isObjectProperty(argsProperty)) {
        const a = argsProperty.value;
        if (types.isObjectExpression(a)) {
          a.properties.forEach((p) => {
            if (types.isObjectProperty(p)) {
              const key = p.key;
              if (types.isIdentifier(key) && key.name in args) {
                p.value = args[key.name];
                delete args[key.name];
              }
            }
          });

          const remainder = Object.entries(args);
          if (Object.keys(args).length) {
            remainder.forEach(([key, value]) => {
              a.properties.push(types.objectProperty(types.identifier(key), value));
            });
          }
        }
      }
    } else {
      properties.unshift(
        types.objectProperty(
          types.identifier('args'),
          types.objectExpression(
            Object.entries(args).map(([key, value]) =>
              types.objectProperty(types.identifier(key), value)
            )
          )
        )
      );
    }
    return;
  }

  traverse(node, {
    ObjectExpression(path) {
      if (found) {
        return;
      }

      found = true;
      const properties = path.get('properties');
      const argsProperty = properties.find((property) => {
        if (property.isObjectProperty()) {
          const key = property.get('key');
          return key.isIdentifier() && key.node.name === 'args';
        }
        return false;
      });

      if (argsProperty) {
        if (argsProperty.isObjectProperty()) {
          const a = argsProperty.get('value');
          if (a.isObjectExpression()) {
            a.traverse({
              ObjectProperty(p) {
                const key = p.get('key');
                if (key.isIdentifier() && key.node.name in args) {
                  p.get('value').replaceWith(args[key.node.name]);
                  delete args[key.node.name];
                }
              },
              // @ts-expect-error noScope works but is not typed properly
              noScope: true,
            });

            const remainder = Object.entries(args);
            if (Object.keys(args).length) {
              remainder.forEach(([key, value]) => {
                a.pushContainer('properties', types.objectProperty(types.identifier(key), value));
              });
            }
          }
        }
      } else {
        path.unshiftContainer(
          'properties',
          types.objectProperty(
            types.identifier('args'),
            types.objectExpression(
              Object.entries(args).map(([key, value]) =>
                types.objectProperty(types.identifier(key), value)
              )
            )
          )
        );
      }
    },

    noScope: true,
  });
};
