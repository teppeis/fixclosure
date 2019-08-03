/* eslint-disable no-invalid-this */
import { EstraverseController } from "estraverse-fb";

type Identifier = import("estree").Identifier;
type MemberExpression = import("estree").MemberExpression;
type Node = import("estree-jsx").Node;
type JSXMemberExpression = import("estree-jsx").JSXMemberExpression;
type JSXIdentifier = import("estree-jsx").JSXIdentifier;

/**
 * Visitor for estraverse.
 */
export function leave(this: EstraverseController, node: Node, uses: UsedNamespace[]) {
  switch (node.type) {
    case "MemberExpression":
    case "JSXMemberExpression":
      if (hasComputedProperty_(node)) {
        return;
      }
      if (isIdentifierType_(node.object) && !isLocalVar_(node.object, this.parents())) {
        const parents = this.parents()
          .concat(node)
          .reverse();
        const path = nonNullable(this.path())
          .concat("object")
          .reverse();
        const use = registerIdentifier_(node.object, parents, path);
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
 * @return True if the property is computed like `foo["bar"]` not `foo.bar`.
 */
function hasComputedProperty_(node: MemberExpression | JSXMemberExpression): boolean {
  return node.type === "MemberExpression" && node.computed;
}

/**
 * @return True if the type is Identifier or JSXIdentifier.
 */
function isIdentifierType_(node: Node): node is Identifier | JSXIdentifier {
  return node.type === "Identifier" || node.type === "JSXIdentifier";
}

/**
 * @return True if the object is a local variable, not a global object.
 * TODO: use escope to support complicated patterns like destructuring.
 */
function isLocalVar_(object: Identifier | JSXIdentifier, parents: Node[]): boolean {
  const nodeName: string = object.name;
  let node: Node | undefined;
  parents = parents.slice();
  while ((node = parents.pop())) {
    switch (node.type) {
      case "FunctionExpression":
      case "FunctionDeclaration":
        if (
          node.params &&
          node.params.some(param => param.type === "Identifier" && param.name === nodeName)
        ) {
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
                  declaration.id.type === "Identifier" &&
                  declaration.id.name === nodeName
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
  node: Identifier | JSXIdentifier,
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
        if (!hasComputedProperty_(current) && isIdentifierType_(current.property)) {
          namespace.push(current.property.name);
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

export interface UsedNamespace<T extends Node = Node> {
  name: string[];
  node: T;
  key: string;
}

function createMemberObject_(namespace: string[], node: Node, parentKey: string): UsedNamespace {
  return {
    name: namespace,
    node,
    key: parentKey,
  };
}
