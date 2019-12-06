import doctrine from "@teppeis/doctrine";
import flat from "array.prototype.flat";
import espree from "espree";
import { traverse } from "estraverse-fb";
import {
  Comment,
  ExpressionStatement,
  Program,
  SimpleCallExpression,
  SourceLocation,
} from "estree-jsx";
import difference from "lodash.difference";
import * as def from "./default";
import { leave, UsedNamespace } from "./visitor";

const tagsHavingType = new Set([
  "const",
  "define",
  "enum",
  "extends",
  "implements",
  "param",
  "private",
  "protected",
  "public",
  "return",
  "this",
  "type",
  "typedef",
]);

export interface ParserOptions {
  provideRoots?: string[];
  replaceMap?: Map<string, string>;
  providedNamespace?: string[];
  // TODO: espree options
  parserOptions?: any;
}

export interface FixclosureInfo {
  provided: string[];
  required: string[];
  requireTyped: string[];
  forwardDeclared: string[];
  toProvide: string[];
  toRequire: string[];
  toRequireType: string[];
  toForwardDeclare: string[];
  ignoredProvide: string[];
  ignoredRequire: string[];
  ignoredRequireType: string[];
  ignoredForwardDeclare: string[];
  provideStart: number;
  provideEnd: number;
}

export class Parser {
  options: ParserOptions;
  private provideRoots_: Set<string>;
  private replaceMap_: Map<string, string>;
  private providedNamespaces_: Set<string>;
  private ignorePackages_: Set<string>;
  private minLine_ = Number.MAX_VALUE;
  private maxLine_ = 0;

  constructor(opt_options?: ParserOptions) {
    const options = (this.options = opt_options || {});
    if (options.provideRoots) {
      this.provideRoots_ = new Set(options.provideRoots);
    } else {
      this.provideRoots_ = def.getRoots();
    }

    this.replaceMap_ = def.getReplaceMap();
    if (options.replaceMap) {
      options.replaceMap.forEach((value: string, key: string) => {
        this.replaceMap_.set(key, value);
      });
    }

    this.providedNamespaces_ = def.getProvidedNamespaces();
    if (options.providedNamespace) {
      options.providedNamespace.forEach(method => {
        this.providedNamespaces_.add(method);
      });
    }

    this.ignorePackages_ = def.getIgnorePackages();
  }

  parse(src: string): FixclosureInfo {
    const options = {
      loc: true,
      comment: true,
      ecmaVersion: 2019,
      sourceType: "script",
      ecmaFeatures: {
        jsx: true,
      },
      ...this.options.parserOptions,
    };
    const program = espree.parse(src, options);
    const { comments } = program;
    /* istanbul ignore if */
    if (!comments) {
      throw new Error("Enable `comment` option for espree parser");
    }
    return this.parseAst(program, comments);
  }

  parseAst(program: Program, comments: Comment[]): FixclosureInfo {
    const parsed = this.traverseProgram_(program);
    const provided = this.extractProvided_(parsed);
    const required = this.extractRequired_(parsed);
    const requireTyped = this.extractRequireTyped_(parsed);
    const forwardDeclared = this.extractForwardDeclared_(parsed);
    const ignored = this.extractSuppressUnused_(parsed, comments);
    const toProvide = this.extractToProvide_(parsed, comments);
    const fromJsDoc = this.extractToRequireTypeFromJsDoc_(comments);
    const toRequire = this.extractToRequire_(parsed, toProvide, comments, fromJsDoc.toRequire);
    const toRequireType = difference(fromJsDoc.toRequireType, toProvide, toRequire);

    return {
      provided,
      required,
      requireTyped,
      forwardDeclared,
      toProvide,
      toRequire,
      toRequireType,
      toForwardDeclare: [],
      ignoredProvide: ignored.provide,
      ignoredRequire: ignored.require,
      ignoredRequireType: ignored.requireType,
      ignoredForwardDeclare: ignored.forwardDeclare,
      // first goog.provide or goog.require line
      provideStart: this.minLine_,
      // last goog.provide or goog.require line
      provideEnd: this.maxLine_,
    };
  }

  private extractToProvide_(parsed: UsedNamespace[], comments: Comment[]): string[] {
    const suppressComments = this.getSuppressProvideComments_(comments);
    return parsed
      .filter(namespace => this.suppressFilter_(suppressComments, namespace))
      .map(namespace => this.toProvideMapper_(comments, namespace))
      .filter(isDefAndNotNull)
      .filter(provide => this.provideRootFilter_(provide))
      .sort()
      .reduce(uniq, []);
  }

  /**
   * @return true if the node has JSDoc that includes @typedef and not @private
   * This method assume the JSDoc is at a line just before the node.
   * Use ESLint context like `context.getJSDocComment(node)` if possible.
   */
  private hasTypedefAnnotation_(node: ExpressionStatement, comments: Comment[]): boolean {
    const { line } = getLoc(node).start;
    const jsDocComments = comments.filter(
      comment =>
        getLoc(comment).end.line === line - 1 &&
        isBlockComment(comment) &&
        /^\*/.test(comment.value)
    );
    if (jsDocComments.length === 0) {
      return false;
    }
    return jsDocComments.every(comment => {
      const jsdoc = doctrine.parse(`/*${comment.value}*/`, { unwrap: true });
      return (
        jsdoc.tags.some(tag => tag.title === "typedef") &&
        !jsdoc.tags.some(tag => tag.title === "private")
      );
    });
  }

  private getSuppressProvideComments_(comments: Comment[]): Comment[] {
    return comments.filter(
      comment =>
        isLineComment(comment) && /^\s*fixclosure\s*:\s*suppressProvide\b/.test(comment.value)
    );
  }

  private getSuppressRequireComments_(comments: Comment[]): Comment[] {
    return comments.filter(
      comment =>
        isLineComment(comment) && /^\s*fixclosure\s*:\s*suppressRequire\b/.test(comment.value)
    );
  }

  private extractToRequire_(
    parsed: UsedNamespace[],
    toProvide: string[],
    comments: Comment[],
    opt_required?: string[]
  ): string[] {
    const additional = opt_required || [];
    const suppressComments = this.getSuppressRequireComments_(comments);
    const toRequire = parsed
      .filter(namespace => this.toRequireFilter_(namespace))
      .filter(namespace => this.suppressFilter_(suppressComments, namespace))
      .map(namespace => this.toRequireMapper_(namespace))
      .concat(additional)
      .filter(isDefAndNotNull)
      .sort()
      .reduce(uniq, []);
    return difference(toRequire, toProvide);
  }

  private extractToRequireTypeFromJsDoc_(
    comments: Comment[]
  ): { toRequire: string[]; toRequireType: string[] } {
    const toRequire: string[] = [];
    const toRequireType: string[] = [];
    comments
      .filter(
        comment =>
          // JSDoc Style
          isBlockComment(comment) && /^\*/.test(comment.value)
      )
      .forEach(comment => {
        const { tags } = doctrine.parse(`/*${comment.value}*/`, { unwrap: true });
        tags
          .filter(tag => tagsHavingType.has(tag.title) && tag.type)
          .map(tag => this.extractType(tag.type!))
          .forEach(names => {
            toRequireType.push(...names);
          });
        tags
          .filter(tag => tag.title === "implements" && tag.type)
          .map(tag => this.extractType(tag.type!))
          .forEach(names => {
            toRequire.push(...names);
          });
      });
    return {
      toRequire: toRequire
        .filter(name => this.isProvidedNamespace_(name))
        .sort()
        .reduce(uniq, []),
      toRequireType: toRequireType
        .filter(name => this.isProvidedNamespace_(name))
        .sort()
        .reduce(uniq, []),
    };
  }

  extractType(type: doctrine.Type | null): string[] {
    if (!type) {
      return [];
    }
    let result: string[];
    switch (type.type) {
      case "NameExpression":
        return [type.name];
      case "NullableType":
      case "NonNullableType":
      case "OptionalType":
      case "RestType":
        return this.extractType(type.expression);
      case "TypeApplication":
        result = this.extractType(type.expression);
        result.push(...flat<string>(type.applications.map(app => this.extractType(app))));
        break;
      case "UnionType":
        return flat<string>(type.elements.map(el => this.extractType(el)));
      case "RecordType":
        return flat<string>(type.fields.map(field => this.extractType(field)));
      case "FieldType":
        if (type.value) {
          return this.extractType(type.value);
        } else {
          return [];
        }
      case "FunctionType":
        result = flat<string>(type.params.map(param => this.extractType(param)));
        if (type.result) {
          result.push(...this.extractType(type.result));
        }
        if (type.this) {
          result.push(...this.extractType(type.this));
        }
        break;
      default:
        result = [];
    }
    return result;
  }

  /**
   * Extract "goog.require('goog.foo') // fixclosure: ignore".
   * "suppressUnused" is deprecated.
   */
  private extractSuppressUnused_(
    parsed: UsedNamespace[],
    comments: Comment[]
  ): { provide: string[]; require: string[]; requireType: string[]; forwardDeclare: string[] } {
    const suppresses = comments
      .filter(
        comment =>
          isLineComment(comment) &&
          /^\s*fixclosure\s*:\s*(?:suppressUnused|ignore)\b/.test(comment.value)
      )
      .reduce((prev, item) => {
        prev[getLoc(item).start.line] = true;
        return prev;
      }, {} as { [index: number]: true });

    if (Object.keys(suppresses).length === 0) {
      return { provide: [], require: [], requireType: [], forwardDeclare: [] };
    }

    const getSuppressedNamespaces = (method: string) =>
      parsed
        .filter(isSimpleCallExpression)
        .filter(isCalledMethodName(method))
        .filter(namespace => this.updateMinMaxLine_(namespace))
        .filter(req => !!suppresses[getLoc(req.node).start.line])
        .map(getArgStringLiteralOrNull)
        .filter(isDefAndNotNull)
        .sort();

    return {
      provide: getSuppressedNamespaces("goog.provide"),
      require: getSuppressedNamespaces("goog.require"),
      requireType: getSuppressedNamespaces("goog.requireType"),
      forwardDeclare: getSuppressedNamespaces("goog.forwardDeclare"),
    };
  }

  private extractProvided_(parsed: UsedNamespace[]): string[] {
    return this.extractGoogDeclaration_(parsed, "goog.provide");
  }

  private extractRequired_(parsed: UsedNamespace[]): string[] {
    return this.extractGoogDeclaration_(parsed, "goog.require");
  }

  private extractRequireTyped_(parsed: UsedNamespace[]): string[] {
    return this.extractGoogDeclaration_(parsed, "goog.requireType");
  }

  private extractForwardDeclared_(parsed: UsedNamespace[]): string[] {
    return this.extractGoogDeclaration_(parsed, "goog.forwardDeclare");
  }

  /**
   * @param parsed
   * @param method like 'goog.provide' or 'goog.require'
   */
  private extractGoogDeclaration_(parsed: UsedNamespace[], method: string): string[] {
    return parsed
      .filter(isSimpleCallExpression)
      .filter(isCalledMethodName(method))
      .filter(namespace => this.updateMinMaxLine_(namespace))
      .map(getArgStringLiteralOrNull)
      .filter(isDefAndNotNull)
      .sort();
  }

  private traverseProgram_(node: Program): UsedNamespace[] {
    const uses: UsedNamespace[] = [];
    traverse(node, {
      leave(currentNode, parent) {
        leave.call(this, currentNode, uses);
      },
    });
    return uses;
  }

  /**
   * @return True if the item has a root namespace to extract.
   */
  private provideRootFilter_(item: string): boolean {
    const root = item.split(".")[0];
    return this.provideRoots_.has(root);
  }

  /**
   * @return Provided namespace
   */
  private toProvideMapper_(comments: Comment[], use: UsedNamespace): string | null {
    const name = use.name.join(".");
    switch (use.node.type) {
      case "AssignmentExpression":
        if (use.key === "left" && getLoc(use.node).start.column === 0) {
          return this.getProvidedPackageName_(name);
        }
        break;
      case "ExpressionStatement":
        if (this.hasTypedefAnnotation_(use.node, comments)) {
          return this.getProvidedPackageName_(name);
        }
        break;

      default:
        break;
    }
    return null;
  }

  /**
   * @return Required namespace
   */
  private toRequireMapper_(use: UsedNamespace): string | null {
    const name = use.name.join(".");
    return this.getRequiredPackageName_(name);
  }

  private toRequireFilter_(use: UsedNamespace): boolean {
    switch (use.node.type) {
      case "ExpressionStatement":
        return false;
      case "AssignmentExpression":
        if (use.key === "left" && getLoc(use.node).start.column === 0) {
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  }

  /**
   * Filter toProvide and toRequire if it is suppressed.
   */
  private suppressFilter_(comments: Comment[], use: UsedNamespace): boolean {
    const start = getLoc(use.node).start.line;
    const suppressComment = comments.some(comment => getLoc(comment).start.line + 1 === start);
    return !suppressComment;
  }

  private getRequiredPackageName_(name: string): string | null {
    let names = name.split(".");
    do {
      const name = this.replaceMethod_(names.join("."));
      if (this.providedNamespaces_.has(name) && !this.isIgnorePackage_(name)) {
        return name;
      }
      names = names.slice(0, -1);
    } while (names.length > 0);
    return null;
  }

  private getProvidedPackageName_(name: string): string | null {
    name = this.replaceMethod_(name);
    let names = name.split(".");
    let lastname = names[names.length - 1];
    // Remove prototype or superClass_.
    names = names.reduceRight((prev, cur) => {
      if (cur === "prototype") {
        return [];
      } else {
        prev.unshift(cur);
        return prev;
      }
    }, [] as string[]);

    if (!this.isProvidedNamespace_(name)) {
      lastname = names[names.length - 1];
      if (/^[a-z$]/.test(lastname)) {
        // Remove the last method name.
        names.pop();
      }

      while (names.length > 0) {
        lastname = names[names.length - 1];
        if (/^[A-Z][_0-9A-Z]+$/.test(lastname)) {
          // Remove the last constant name.
          names.pop();
        } else {
          break;
        }
      }
    }

    if (this.isPrivateProp_(names)) {
      return null;
    }

    const pkg = names.join(".");
    if (pkg && !this.isIgnorePackage_(pkg)) {
      return this.replaceMethod_(pkg);
    } else {
      // Ignore just one word namespace like 'goog'.
      return null;
    }
  }

  private isIgnorePackage_(name: string): boolean {
    return this.ignorePackages_.has(name);
  }

  private isPrivateProp_(names: string[]): boolean {
    return names.some(name => name.endsWith("_"));
  }

  private replaceMethod_(method: string): string {
    return this.replaceMap_.has(method) ? this.replaceMap_.get(method)! : method;
  }

  private isProvidedNamespace_(name: string): boolean {
    return this.providedNamespaces_.has(name);
  }

  private updateMinMaxLine_(use: UsedNamespace<SimpleCallExpression>): true {
    const start = getLoc(use.node).start.line;
    const end = getLoc(use.node).end.line;
    this.minLine_ = Math.min(this.minLine_, start);
    this.maxLine_ = Math.max(this.maxLine_, end);
    return true;
  }
}

function isSimpleCallExpression(use: UsedNamespace): use is UsedNamespace<SimpleCallExpression> {
  return use.node.type === "CallExpression";
}

function isCalledMethodName(method: string) {
  return (use: UsedNamespace<SimpleCallExpression>) => use.name.join(".") === method;
}

function getArgStringLiteralOrNull(use: UsedNamespace<SimpleCallExpression>): string | null {
  const arg = use.node.arguments[0];
  if (arg.type === "Literal" && typeof arg.value === "string") {
    return arg.value;
  }
  return null;
}

/**
 * Support both ESTree (Line) and @babel/parser (CommentLine)
 */
function isLineComment(comment: { type: string }): boolean {
  return comment.type === "CommentLine" || comment.type === "Line";
}

/**
 * Support both ESTree (Block) and @babel/parser (CommentBlock)
 */
function isBlockComment(comment: { type: string }): boolean {
  return comment.type === "CommentBlock" || comment.type === "Block";
}

/**
 * Get non-nullable `.loc` (SourceLocation) prop or throw an error
 */
function getLoc(node: { loc?: SourceLocation | null }): SourceLocation {
  /* istanbul ignore if */
  if (!node.loc) {
    throw new TypeError(
      `Enable "loc" option of your parser. The node doesn't have "loc" property: ${node}`
    );
  }
  return node.loc;
}

/**
 * Use like `array.filter(isDefAndNotNull)`
 */
function isDefAndNotNull<T>(item: T): item is NonNullable<T> {
  return item != null;
}

/**
 * Use like `array.reduce(uniq, [])`
 */
function uniq(prev: string[], cur: string): string[] {
  if (prev[prev.length - 1] !== cur) {
    prev.push(cur);
  }
  return prev;
}
