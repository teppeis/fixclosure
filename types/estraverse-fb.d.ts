import { VisitorOption } from "estraverse";
type Node = import("estree-jsx").Node;

export interface Visitor {
  enter?: (
    this: EstraverseController,
    node: Node,
    parentNode: Node | null
  ) => VisitorOption | Node | void;
  leave?: (
    this: EstraverseController,
    node: Node,
    parentNode: Node | null
  ) => VisitorOption | Node | void;
  fallback?: "iteration" | ((node: Node) => string[]);
  keys?: { [nodeType: string]: string[] };
}

export function traverse(root: Node, visitor: Visitor): void;
export function replace(root: Node, visitor: Visitor): Node;
export { VisitorOption };

export interface EstraverseController {
  /**
   * @return property path array from root to current node
   */
  path(): string[] | null;

  /**
   * @return type of current node
   */
  type(): string;

  /**
   * @return array of parent elements
   */
  parents(): Node[];

  /**
   * @return current node
   */
  current(): any;

  /**
   * skip child nodes of current node
   */
  skip(): void;

  /**
   * break traversals
   */
  break(): void;

  /**
   * remove node. available only in replace()
   */
  remove(): void;
}
