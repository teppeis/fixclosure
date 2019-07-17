/* eslint-disable no-invalid-this */
import { EstraverseController } from "estraverse-fb";

type Identifier = import("estree").Identifier;
type MemberExpression = import("estree").MemberExpression;
type Node = import("estree-jsx").Node;
type JSXMemberExpression = import("estree-jsx").JSXMemberExpression;

/**
 * Visitor for estraverse.
 */
export function leave(this: EstraverseController, node: Node, uses: UsedNamespace[]) {
  switch (node.type) {
    case "MemberExpression":
    case "JSXMemberExpression":
      if (hasObjectIdentifier_(node) && !hasScope_(node, this.parents())) {
        const parents = this.parents()
          .concat(node)
          .reverse();
        const path = nonNullable(this.path())
          .concat("object")
          .reverse();
        const use = registerIdentifier_(node.object as Identifier, parents, path);
        if (use) {
          uses.push(use);
        }
      }
      break;
    default:
      break;
  }
}

function nonNullable<T>(value: T): NonNullable<T> {
  /* istanbul ignore if */
  if (value == null) {
    throw new TypeError(`The value must be non-nullable, but actually ${value}`);
  }
  return value!;
}

/**
 * @return True if the node is not computed (accessed by dot operator)
 * and the "object" property is an identifier node.
 */
function hasObjectIdentifier_(node: MemberExpression | JSXMemberExpression): boolean {
  return !(node as any).computed && isIdentifierType_(node.object.type);
}

/**
 * @return True if the type is Syntax.Identifier or
 * Syntax.JSXIdentifier.
 */
function isIdentifierType_(type: string): boolean {
  return type === "Identifier" || type === "JSXIdentifier";
}

/**
 * @return True if the node has a local or a lexical scope.
 */
function hasScope_(start: MemberExpression | JSXMemberExpression, parents: Node[]): boolean {
  const nodeName: string = (start.object as any).name;
  let node: Node | undefined;
  parents = parents.slice();
  while ((node = parents.pop())) {
    switch (node.type) {
      case "FunctionExpression":
      case "FunctionDeclaration":
        if (node.params && node.params.some(param => (param as Identifier).name === nodeName)) {
          return true;
        }
        break;
      case "BlockStatement":
        if (
          node.body &&
          node.body.some(
            bodyPart =>
              bodyPart.type === "VariableDeclaration" &&
              bodyPart.declarations.some(
                declaration =>
                  declaration.type === "VariableDeclarator" &&
                  (declaration.id as Identifier).name === nodeName
              )
          )
        ) {
          return true;
        }
        break;
      default:
        break;
    }
  }
  return false;
}

function registerIdentifier_(
  node: Identifier,
  parents: Node[],
  path: string[]
): UsedNamespace | null {
  const namespace = [node.name];
  for (let i = 0; i < parents.length; i++) {
    const current = parents[i];
    const parentKey = path[i];
    switch (current.type) {
      case "MemberExpression":
      case "JSXMemberExpression":
        if (!(current as MemberExpression).computed && isIdentifierType_(current.property.type)) {
          namespace.push((current.property as Identifier).name);
        } else {
          return createMemberObject_(namespace, current, parentKey);
        }
        break;
      default:
        return createMemberObject_(namespace, current, parentKey);
    }
  }
  return null;
}

export interface UsedNamespace {
  name: string[];
  node: Node;
  key: string;
}

function createMemberObject_(namespace: string[], node: Node, parentKey: string): UsedNamespace {
  return {
    name: namespace,
    node,
    key: parentKey,
  };
}
