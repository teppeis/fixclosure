// Add JSX node types to estree
export * from "estree";
import * as ESTree from "estree";

export type Node =
  | ESTree.Node
  | JSXAttribute
  | JSXClosingElement
  | JSXClosingFragment
  | JSXElement
  | JSXEmptyExpression
  | JSXExpressionContainer
  | JSXFragment
  | JSXIdentifier
  | JSXMemberExpression
  | JSXNamespacedName
  | JSXOpeningElement
  | JSXOpeningFragment
  | JSXSpreadAttribute
  | JSXSpreadChild
  | JSXText;

export interface JSXAttribute extends ESTree.BaseNode {
  type: "JSXAttribute";
  name: JSXIdentifier | JSXNamespacedName;
  value: JSXElement | JSXFragment | ESTree.SimpleLiteral | JSXExpressionContainer | null;
}

export interface JSXClosingElement extends ESTree.BaseNode {
  type: "JSXClosingElement";
  name: JSXIdentifier | JSXMemberExpression;
}

export interface JSXElement extends ESTree.BaseNode {
  type: "JSXElement";
  openingElement: JSXOpeningElement;
  closingElement: JSXClosingElement | null;
  children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>;
  selfClosing: any;
}

export interface JSXEmptyExpression extends ESTree.BaseNode {
  type: "JSXEmptyExpression";
}

export interface JSXExpressionContainer extends ESTree.BaseNode {
  type: "JSXExpressionContainer";
  expression: ESTree.Expression | JSXEmptyExpression;
}

export interface JSXSpreadChild extends ESTree.BaseNode {
  type: "JSXSpreadChild";
  expression: ESTree.Expression;
}

export interface JSXIdentifier extends ESTree.BaseNode {
  type: "JSXIdentifier";
  name: string;
}

export interface JSXMemberExpression extends ESTree.BaseNode {
  type: "JSXMemberExpression";
  object: JSXMemberExpression | JSXIdentifier;
  property: JSXIdentifier;
}

export interface JSXNamespacedName extends ESTree.BaseNode {
  type: "JSXNamespacedName";
  namespace: JSXIdentifier;
  name: JSXIdentifier;
}

export interface JSXOpeningElement extends ESTree.BaseNode {
  type: "JSXOpeningElement";
  name: JSXIdentifier | JSXMemberExpression;
  attributes: Array<JSXAttribute | JSXSpreadAttribute>;
  selfClosing: boolean;
  typeParameters: null;
}

export interface JSXSpreadAttribute extends ESTree.BaseNode {
  type: "JSXSpreadAttribute";
  argument: ESTree.Expression;
}

export interface JSXText extends ESTree.BaseNode {
  type: "JSXText";
  value: string;
}

export interface JSXFragment extends ESTree.BaseNode {
  type: "JSXFragment";
  openingFragment: JSXOpeningFragment;
  closingFragment: JSXClosingFragment;
  children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>;
}

export interface JSXOpeningFragment extends ESTree.BaseNode {
  type: "JSXOpeningFragment";
}

export interface JSXClosingFragment extends ESTree.BaseNode {
  type: "JSXClosingFragment";
}
