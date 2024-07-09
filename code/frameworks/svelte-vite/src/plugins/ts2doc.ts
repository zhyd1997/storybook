import ts from 'typescript';
import { svelte2tsx } from 'svelte2tsx';
import { VERSION } from 'svelte/compiler';
import { type SvelteDataItem } from 'sveltedoc-parser';

function getInitializerValue(initializer?: ts.Node) {
  if (initializer === undefined) {
    return undefined;
  }
  if (ts.isNumericLiteral(initializer)) {
    return Number(initializer.text);
  }
  if (ts.isStringLiteral(initializer)) {
    return `"${initializer.text}"`;
  }
  if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  return initializer.getText();
}

/*
 * Make sveltedoc-parser compatible data from .svelte file with svelte2tsx and TypeScript.
 */
export function ts2doc(fileContent: string) {
  const shimFilename = require.resolve('svelte2tsx/svelte-shims-v4.d.ts');
  const shimContent = ts.sys.readFile(shimFilename) || '';
  const shimSourceFile = ts.createSourceFile(
    shimFilename,
    shimContent,
    ts.ScriptTarget.Latest,
    true
  );

  const tsx = svelte2tsx(fileContent, {
    version: VERSION,
    isTsFile: true,
    mode: 'dts',
  });
  const currentSourceFile = ts.createSourceFile('tmp.ts', tsx.code, ts.ScriptTarget.Latest, true);

  const host = ts.createCompilerHost({});
  host.getSourceFile = (fileName, languageVersion, onError) => {
    if (fileName === 'tmp.ts') {
      return currentSourceFile;
    } else if (fileName === shimContent) {
      return shimSourceFile;
    } else {
      // ignore other files
      return;
    }
  };

  // Create a program with the custom compiler host
  const program = ts.createProgram([currentSourceFile.fileName, shimSourceFile.fileName], {}, host);
  const checker = program.getTypeChecker();

  const propMap: Map<string, SvelteDataItem> = new Map();

  const renderFunction = currentSourceFile.statements.find((statement) => {
    return ts.isFunctionDeclaration(statement) && statement.name?.text === 'render';
  }) as ts.FunctionDeclaration | undefined;
  if (renderFunction === undefined) {
    return {
      runeUsed: false,
      data: [],
    };
  }

  function getPropsFromTypeLiteral(type: ts.TypeLiteralNode) {
    const members = type.members;

    members.forEach((member) => {
      if (ts.isPropertySignature(member)) {
        const name = member.name.getText();
        let typeString = '';
        if (member.type !== undefined) {
          const memberType = checker.getTypeFromTypeNode(member.type);
          typeString = checker.typeToString(memberType);
        }
        const jsDoc = ts.getJSDocCommentsAndTags(member);
        const docComments = jsDoc
          .map((doc) => {
            let s = ts.getTextOfJSDocComment(doc.comment) || '';
            doc.forEachChild((child) => {
              // Type information from JSDoc comment
              if (ts.isJSDocTypeTag(child)) {
                let t = '';
                child.typeExpression.forEachChild((ty) => {
                  t += ty.getText();
                });
                if (t.length > 0) {
                  typeString = t;
                }
                s += ts.getTextOfJSDocComment(child.comment);
              }
            });
            return s;
          })
          .join('\n');

        // mimic the structure of sveltedoc-parser.
        propMap.set(name, {
          name: name,
          visibility: 'public',
          description: docComments,
          keywords: [],
          kind: 'let',
          type: { kind: 'type', text: typeString, type: typeString },
          static: false,
          readonly: false,
          importPath: undefined,
          originalName: undefined,
          localName: undefined,
          defaultValue: undefined,
        });
      }
    });
  }

  const hasRuneProps = tsx.code.includes('$$ComponentProps');
  if (hasRuneProps) {
    // Rune props

    // Try to get prop types from 'type $$ComponentProps = { ... }'
    function visitPropsTypeAlias(node: ts.Node) {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === '$$ComponentProps') {
        const typeAlias = node as ts.TypeAliasDeclaration;
        getPropsFromTypeLiteral(typeAlias.type as ts.TypeLiteralNode);
      }
      ts.forEachChild(node, visitPropsTypeAlias);
    }
    visitPropsTypeAlias(renderFunction);

    // Obtain default values from 'let { ... }: $$ComponentProps = ...'
    function visitObjectBinding(node: ts.Node) {
      if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)) {
        const type = node.type;
        if (type && ts.isTypeReferenceNode(type) && type.getText() === '$$ComponentProps') {
          const bindingPattern = node.name;
          bindingPattern.elements.forEach((element) => {
            if (ts.isBindingElement(element)) {
              const name = element.propertyName?.getText() || element.name.getText();
              const initializer = getInitializerValue(element.initializer);
              const prop = propMap.get(name);
              if (initializer !== undefined && prop) {
                prop.defaultValue = initializer;
              }
            }
          });
        }
      }
      ts.forEachChild(node, visitObjectBinding);
    }
    visitObjectBinding(currentSourceFile);
  } else {
    // Legacy props (data)

    // Try to get prop types from 'return { ... } as { props: ... }'
    renderFunction.body?.forEachChild((statement) => {
      if (ts.isReturnStatement(statement)) {
        const returnExpression = statement.expression;
        if (returnExpression === undefined) {
          return;
        }
        if (ts.isObjectLiteralExpression(returnExpression)) {
          returnExpression.properties.forEach((property) => {
            if (ts.isPropertyAssignment(property) && property.name.getText() === 'props') {
              const propsObject = property.initializer;
              if (
                ts.isAsExpression(propsObject) &&
                ts.isObjectLiteralExpression(propsObject.expression)
              ) {
                const type = propsObject.type;
                if (ts.isTypeLiteralNode(type)) {
                  getPropsFromTypeLiteral(type);
                }
              }
            }
          });
        }
      }
    });

    // Try to get default values from 'let <prop> = ...'
    renderFunction.body?.forEachChild((statement) => {
      if (ts.isVariableStatement(statement)) {
        statement.declarationList.declarations.forEach((declaration) => {
          if (ts.isVariableDeclaration(declaration) && ts.isIdentifier(declaration.name)) {
            const name = declaration.name.getText();
            const prop = propMap.get(name);
            if (prop && prop.defaultValue === undefined) {
              const initializer = getInitializerValue(declaration.initializer);
              prop.defaultValue = initializer;
            }
          }
        });
      }
    });
  }

  return {
    hasRuneProps,
    data: Array.from(propMap.values()),
  };
}
