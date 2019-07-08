// Add JSX node types to estree

type BaseNode = import("estree").BaseNode;
type Expression = import("estree").Expression;
type SimpleLiteral = import("estree").SimpleLiteral;

export type Node =
  | import("estree").Node
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

export interface JSXAttribute extends BaseNode {
  type: "JSXAttribute";
  name: JSXIdentifier | JSXNamespacedName;
  value: JSXElement | JSXFragment | SimpleLiteral | JSXExpressionContainer | null;
}

export interface JSXClosingElement extends BaseNode {
  type: "JSXClosingElement";
  name: JSXIdentifier | JSXMemberExpression;
}

export interface JSXElement extends BaseNode {
  type: "JSXElement";
  openingElement: JSXOpeningElement;
  closingElement: JSXClosingElement | null;
  children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>;
  selfClosing: any;
}

export interface JSXEmptyExpression extends BaseNode {
  type: "JSXEmptyExpression";
}

export interface JSXExpressionContainer extends BaseNode {
  type: "JSXExpressionContainer";
  expression: Expression | JSXEmptyExpression;
}

export interface JSXSpreadChild extends BaseNode {
  type: "JSXSpreadChild";
  expression: Expression;
}

export interface JSXIdentifier extends BaseNode {
  type: "JSXIdentifier";
  name: string;
}

export interface JSXMemberExpression extends BaseNode {
  type: "JSXMemberExpression";
  object: JSXMemberExpression | JSXIdentifier;
  property: JSXIdentifier;
}

export interface JSXNamespacedName extends BaseNode {
  type: "JSXNamespacedName";
  namespace: JSXIdentifier;
  name: JSXIdentifier;
}

export interface JSXOpeningElement extends BaseNode {
  type: "JSXOpeningElement";
  name: JSXIdentifier | JSXMemberExpression;
  attributes: Array<JSXAttribute | JSXSpreadAttribute>;
  selfClosing: boolean;
  typeParameters: null;
}

export interface JSXSpreadAttribute extends BaseNode {
  type: "JSXSpreadAttribute";
  argument: Expression;
}

export interface JSXText extends BaseNode {
  type: "JSXText";
  value: string;
}

export interface JSXFragment extends BaseNode {
  type: "JSXFragment";
  openingFragment: JSXOpeningFragment;
  closingFragment: JSXClosingFragment;
  children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>;
}

export interface JSXOpeningFragment extends BaseNode {
  type: "JSXOpeningFragment";
}

export interface JSXClosingFragment extends BaseNode {
  type: "JSXClosingFragment";
}
