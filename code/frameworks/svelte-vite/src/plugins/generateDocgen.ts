import { svelte2tsx } from 'svelte2tsx';
import { VERSION } from 'svelte/compiler';

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import type { Comment, Expression, TSType } from '@babel/types';
import { parse as parseComment } from 'comment-parser';

export type Docgen = {
  name?: string;
  props: PropInfo[];
};

export type PropInfo = {
  name: string;
  type?: Type;
  defaultValue?: string;
  description?: string;
  runes?: boolean;
};

export type EventInfo = {
  name: string;
};

type BaseType = {
  /** Permits undefined or not */
  optional?: boolean;
};

type ScalarType = BaseType & {
  type: 'number' | 'string' | 'boolean' | 'symbol' | 'any' | 'null';
};

type FunctionType = BaseType & {
  type: 'function';
  text: string;
};

type LiteralType = BaseType & {
  type: 'literal';
  value: string | number | boolean;
  text: string;
};

type ArrayType = BaseType & {
  type: 'array';
};

type ObjectType = BaseType & {
  type: 'object';
};

type UnionType = BaseType & {
  type: 'union';
  types: Type[];
};

type IntersectionType = BaseType & {
  type: 'intersection';
  types: Type[];
};

type ReferenceType = BaseType & {
  type: 'reference';
  text: string;
};

type OtherType = BaseType & {
  type: 'other';
  text: string;
};

export type Type =
  | ScalarType
  | LiteralType
  | FunctionType
  | ArrayType
  | ObjectType
  | OtherType
  | ReferenceType
  | UnionType
  | IntersectionType;

/**
 * Try to infer a type from a initializer expression (for when there is no type annotation)
 */
function inferTypeFromInitializer(expr: Expression): Type | undefined {
  switch (expr.type) {
    case 'ObjectExpression':
      return { type: 'object' };
    case 'StringLiteral':
      return { type: 'string' };
    case 'TemplateLiteral':
      return { type: 'string' };
    case 'NumericLiteral':
      return { type: 'number' };
    case 'BooleanLiteral':
      return { type: 'boolean' };
    case 'ArrayExpression':
      return { type: 'array' };
    case 'NullLiteral':
      return undefined; // cannot infer
    default:
      return undefined;
  }
}

function parseType(type: TSType): Type | undefined {
  switch (type.type) {
    case 'TSNumberKeyword':
      return { type: 'number' };
    case 'TSStringKeyword':
      return { type: 'string' };
    case 'TSBooleanKeyword':
      return { type: 'boolean' };
    case 'TSSymbolKeyword':
      return { type: 'symbol' };
    case 'TSAnyKeyword':
      return { type: 'any' };
    case 'TSNullKeyword':
      return { type: 'null' };
    case 'TSObjectKeyword':
      return { type: 'object' };
    case 'TSFunctionType':
      return { type: 'function', text: generate(type).code };
    case 'TSTypeReference':
      return { type: 'reference', text: generate(type).code };
    case 'TSLiteralType':
      const text = generate(type.literal).code;
      switch (type.literal.type) {
        case 'StringLiteral':
          return {
            type: 'literal',
            value: type.literal.value,
            text,
          };
        case 'NumericLiteral':
          return {
            type: 'literal',
            value: type.literal.value,
            text,
          };
        case 'BooleanLiteral':
          return { type: 'literal', value: type.literal.value, text: text };
      }
      return undefined;
  }
  if (type.type == 'TSTypeLiteral') {
    return { type: 'object' };
  } else if (type.type == 'TSUnionType') {
    // e.g. `string | number | undefined`
    let optional: boolean | undefined = undefined;
    const types: Type[] = [];
    type.types.forEach((t) => {
      if (t.type === 'TSUndefinedKeyword') {
        optional = true;
      } else {
        const ty = parseType(t);
        if (ty) {
          types.push(ty);
        }
      }
    });
    if (types.length === 1) {
      // e.g. `string | undefined` => string?
      return { ...types[0], optional };
    } else if (types.length > 1) {
      return { type: 'union', optional, types };
    }
  } else if (type.type == 'TSIntersectionType') {
    // e.g. `A & B`
    const types: Type[] = type.types
      .map((t) => {
        return parseType(t);
      })
      .filter((t) => t !== undefined);
    return { type: 'intersection', types };
  }
  return undefined;
}

/**
 * Try to parse a type text like `string | number | undefined` to a Type object.
 */
function tryParseJSDocType(text: string): Type | undefined {
  let ast;
  try {
    ast = parse(`let x: ${text};`, { plugins: ['typescript'] });
  } catch {
    return undefined;
  }

  const stmt = ast.program.body[0];
  if (stmt.type === 'VariableDeclaration') {
    for (const decl of stmt.declarations) {
      if (decl.id.type == 'Identifier') {
        if (decl.id.typeAnnotation?.type === 'TSTypeAnnotation') {
          const a = parseType(decl.id.typeAnnotation.typeAnnotation);
          return a;
        }
      }
    }
  }
  return undefined;
}

/**
 * Extract JSDoc comments
 */
function parseComments(leadingComments?: Comment[] | null) {
  if (!leadingComments) {
    return {};
  }
  let type: Type | undefined = undefined;
  let description: string | undefined = undefined;

  const content = leadingComments
    .filter((c) => c.type === 'CommentBlock')
    .map((c) => c.value)
    .join('\n');

  if (!content.startsWith('*')) {
    // not a TSDoc/JSDoc
    return {};
  }

  const blocks = parseComment('/*' + content + '*/');
  const cc: string[] = [];
  blocks.forEach((block) => {
    cc.push(block.description);
    block.tags.forEach((tag) => {
      // JSDoc @type tag
      if (tag.tag === 'type') {
        type ||= tryParseJSDocType(tag.type);
      }
      cc.push(tag.name);
      cc.push(tag.description);
    });
    description = cc.filter((c) => c).join(' ');
  });

  return {
    description,
    type,
  };
}

export function generateDocgen(fileContent: string): Docgen {
  const tsx = svelte2tsx(fileContent, {
    version: VERSION,
    isTsFile: true,
    mode: 'ts',
  });

  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(tsx.code, {
      sourceType: 'module',
      plugins: ['typescript'],
      allowImportExportEverywhere: true,
      allowAwaitOutsideFunction: true,
    });
  } catch {
    return { props: [] };
  }

  const propMap: Map<string, PropInfo> = new Map();
  // const events: EventInfo[] = [];

  traverse(ast, {
    FunctionDeclaration: (funcPath) => {
      if (funcPath.node.id && funcPath.node.id.name !== 'render') {
        return;
      }
      funcPath.traverse({
        TSTypeAliasDeclaration(path) {
          if (
            path.node.id.name !== '$$ComponentProps' ||
            path.node.typeAnnotation.type !== 'TSTypeLiteral'
          ) {
            return;
          }
          const members = path.node.typeAnnotation.members;
          members.forEach((member) => {
            if (member.type === 'TSPropertySignature' && member.key.type === 'Identifier') {
              const name = member.key.name;

              const type =
                member.typeAnnotation && member.typeAnnotation.type === 'TSTypeAnnotation'
                  ? parseType(member.typeAnnotation.typeAnnotation)
                  : undefined;

              if (type && member.optional) {
                type.optional = true;
              }

              const { description } = parseComments(member.leadingComments);

              propMap.set(name, {
                ...propMap.get(name),
                name,
                type: type,
                description,
                runes: true,
              });
            }
          });
        },
        VariableDeclaration: (path) => {
          if (path.node.kind !== 'let' || path.parent !== funcPath.node.body) {
            return;
          }

          path.node.declarations.forEach((declaration) => {
            if (
              declaration.id.type === 'ObjectPattern' &&
              declaration.id.typeAnnotation &&
              declaration.id.typeAnnotation.type === 'TSTypeAnnotation'
            ) {
              // Get default values from Svelte 5's `let { ... } = $props();`

              const typeAnnotation = declaration.id.typeAnnotation.typeAnnotation;
              if (
                typeAnnotation.type !== 'TSTypeReference' ||
                typeAnnotation.typeName.type !== 'Identifier' ||
                typeAnnotation.typeName.name !== '$$ComponentProps'
              ) {
                return;
              }

              declaration.id.properties.forEach((property) => {
                if (property.type === 'ObjectProperty') {
                  if (property.key.type !== 'Identifier') {
                    return;
                  }
                  const name = property.key.name;
                  if (property.value.type === 'AssignmentPattern') {
                    const defaultValue = generate(property.value.right, {
                      compact: true,
                    }).code;
                    propMap.set(name, {
                      ...propMap.get(name),
                      name,
                      defaultValue,
                      runes: true,
                    });
                  }
                }
              });
            } else if (declaration.id.type === 'Identifier') {
              // Get props from Svelte 4's `export let a = ...`

              const name = declaration.id.name;
              if (tsx.exportedNames.has(name)) {
                let typeName: Type | undefined = undefined;
                if (
                  declaration.id.typeAnnotation &&
                  declaration.id.typeAnnotation.type === 'TSTypeAnnotation'
                ) {
                  const typeAnnotation = declaration.id.typeAnnotation.typeAnnotation;
                  typeName = parseType(typeAnnotation);
                }

                const { description, type: typeFromComment } = parseComments(
                  path.node.leadingComments
                );
                if (typeName === undefined && typeFromComment) {
                  typeName = typeFromComment;
                }

                if (typeName === undefined && declaration.init) {
                  typeName = inferTypeFromInitializer(declaration.init);
                }

                const initializer = declaration.init
                  ? generate(declaration.init, { compact: true }).code
                  : undefined;

                propMap.set(name, {
                  ...propMap.get(name),
                  type: typeName,
                  name,
                  description,
                  defaultValue: initializer,
                });
              }
            }
          });
        },
      });
    },
  });

  return {
    props: Array.from(propMap.values()),
  };
}
